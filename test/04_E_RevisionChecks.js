// Regression tests for the revised protocol (JFMI version of the paper, Section 4.3)
// Each test checks one correction to the proof of concept.
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const SLOT = 20;          // slot length in seconds, both ledgers
const DREX_LEG = 2;       // T_L: Mike must lock within 2 slots
const ALIEN_CONF = 6;     // T_E: Alice must write within 6 slots
const EXPIRY = 12;        // T_X: Mike may reclaim after 12 slots; T_S = 70% of T_X = 8 slots
const ZERO = ethers.ZeroHash;
const AMOUNT = 10n ** 14n;

describe("Revision checks", function () {

  async function fixture() {
    const [owner, alice, mike, aliceE, mikeE, m1, m2, m3, m4] = await ethers.getSigners();
    const drexToken = await ethers.deployContract("DrexToken");
    const alienToken = await ethers.deployContract("AlienToken");
    await drexToken.transfer(mike.address, 10n ** 16n);
    await alienToken.transfer(aliceE.address, 10n ** 16n);
    const merkle = await (await ethers.getContractFactory("MerkleContract"))
      .deploy([m1.address, m2.address, m3.address, m4.address], [1, 1, 1, 1], 0);
    const listrack = await (await ethers.getContractFactory("DrexListrack"))
      .deploy(SLOT, DREX_LEG, ALIEN_CONF, EXPIRY);
    const alien = await (await ethers.getContractFactory("AlienListrack")).deploy(SLOT, 0);
    await drexToken.connect(mike).approve(listrack.target, 10n ** 16n);
    await alienToken.connect(aliceE).approve(alien.target, 10n ** 16n);
    return { owner, alice, mike, aliceE, mikeE, m1, m2, m3, m4, drexToken, alienToken, merkle, listrack, alien };
  }

  // Mike registers (and so locks) a trade; returns the TxId and the arguments Alice needs on E
  async function register(f, hashedSecret = ZERO, amount = AMOUNT) {
    const tx = await f.listrack.connect(f.mike).setTrade(
      [f.alice.address, f.mike.address, f.drexToken.target], amount, [f.merkle.target],
      [f.aliceE.address, f.mikeE.address, f.alienToken.target], amount, hashedSecret);
    const txId = (await tx.wait()).logs.find(l => l.fragment && l.fragment.name === "tradeInsertedUsersTxId").args[2];
    const [t] = await f.listrack.getDrexAlienInputsbyId(txId);
    const args = [t[3], t[4], t[5], t[6], t[8], t[9], t[11][4], t[11][3], txId, t[12], t[13]];
    return { txId, args };
  }

  async function notarise(f, slot) {
    const [root] = await f.alien.createMerkleTree(slot, false, 0);
    for (const m of [f.m1, f.m2, f.m3]) await f.merkle.connect(m).insertMerkleForApproval(root, slot);
  }

  async function proofOf(f, txId) {
    const st = await f.alien.getTradeFeatures(txId);
    const proof = await f.alien.createMerkleTree(st[0], true, st[1]);
    return { slot: st[0], index: st[1], count: await f.alien.getSlotSize(st[0]), proof: [...proof] };
  }

  it("1. T_E is enforced on E: a late alien leg is rejected before any asset moves", async function () {
    const f = await loadFixture(fixture);
    const { args } = await register(f);
    await time.increase(ALIEN_CONF * SLOT + 1);
    await expect(f.alien.connect(f.aliceE).writeAlienLeg(...args))
      .to.be.revertedWith("Alien leg deadline has passed");
    expect(await f.alienToken.balanceOf(f.mikeE.address)).to.equal(0n);
  });

  it("2. TxId binds the deadlines: Alice cannot extend her own deadline", async function () {
    const f = await loadFixture(fixture);
    const { args } = await register(f);
    const forged = [...args]; forged[9] = args[9] + 1000n;
    await expect(f.alien.connect(f.aliceE).writeAlienLeg(...forged))
      .to.be.revertedWith("Drex Id Hash is not equal to the inputed parameters");
  });

  it("3. A TxId can be recorded on E only once", async function () {
    const f = await loadFixture(fixture);
    const { args } = await register(f, ethers.keccak256(ethers.toUtf8Bytes("secret")));
    await f.alien.connect(f.aliceE).writeAlienLeg(...args);
    await expect(f.alien.connect(f.aliceE).writeAlienLeg(...args))
      .to.be.revertedWith("Transaction already recorded");
  });

  it("4. Roots and proofs are served only for closed slots", async function () {
    const f = await loadFixture(fixture);
    const { args } = await register(f);
    await f.alien.connect(f.aliceE).writeAlienLeg(...args);
    const slot = await f.alien.currentSlot();
    await expect(f.alien.createMerkleTree(slot, false, 0)).to.be.revertedWith("Slot is not closed yet");
    await time.increase(SLOT);
    expect((await f.alien.createMerkleTree(slot, false, 0)).length).to.equal(1);
  });

  it("5. Slots are genesis-anchored: no drift across empty slots", async function () {
    const f = await loadFixture(fixture);
    const genesis = await f.alien.genesisTimestamp();
    await time.increase(7 * SLOT + 5);
    const now = BigInt(await time.latest());
    expect(await f.alien.currentSlot()).to.equal((now - genesis) / BigInt(SLOT));
  });

  it("6. Proofs must match the committed leaf count and cannot start from an internal node", async function () {
    const f = await loadFixture(fixture);
    const a = await register(f, ZERO, AMOUNT); const b = await register(f, ZERO, AMOUNT + 1n); const c = await register(f, ZERO, AMOUNT + 2n);
    for (const t of [a, b, c]) await f.alien.connect(f.aliceE).writeAlienLeg(...t.args);
    await time.increase(SLOT);
    const p = await proofOf(f, c.txId);
    await notarise(f, p.slot);
    expect(p.count).to.equal(3n);
    // wrong leaf count
    expect(await f.listrack.validateMerkleProof(c.txId, p.index, 4, p.proof, p.slot)).to.equal(false);
    // truncated proof: an internal node presented as a leaf
    expect(await f.listrack.validateMerkleProof(c.txId, p.index, p.count, p.proof.slice(1), p.slot)).to.equal(false);
    // the genuine proof
    expect(await f.listrack.validateMerkleProof(c.txId, p.index, p.count, p.proof, p.slot)).to.equal(true);
    await expect(f.listrack.connect(f.alice).aliceSettleTrade(c.txId, p.index, p.count, p.proof, p.slot, ZERO))
      .to.emit(f.listrack, "manualTradeSettled");
  });

  it("7. Settlement window T_S applies in plain mode too", async function () {
    const f = await loadFixture(fixture);
    const t = await register(f);
    await f.alien.connect(f.aliceE).writeAlienLeg(...t.args);
    await time.increase(SLOT);
    const p = await proofOf(f, t.txId);
    await notarise(f, p.slot);
    await time.increase(8 * SLOT); // past T_S = 8 slots
    await expect(f.listrack.connect(f.alice).aliceSettleTrade(t.txId, p.index, p.count, p.proof, p.slot, ZERO))
      .to.be.revertedWith("Alien Leg already expired");
  });

  it("8. A trade refunded in batch can be neither refunded again nor settled", async function () {
    const f = await loadFixture(fixture);
    const t = await register(f);
    await time.increase(EXPIRY * SLOT + 1);
    await expect(f.merkle.connect(f.m1).revertTxs(f.listrack.target)).to.emit(f.listrack, "tradeReverted");
    expect(await f.drexToken.balanceOf(f.listrack.target)).to.equal(0n);
    await expect(f.listrack.connect(f.mike).mikeManualRevert(t.txId)).to.be.revertedWith("Trade not locked yet to revert");
  });

  it("9. Hash-lock mode: Mike's claim pays the trade's token, and cannot follow Alice's refund", async function () {
    const f = await loadFixture(fixture);
    const secret = ethers.keccak256(ethers.toUtf8Bytes("s1"));
    const h = ethers.keccak256(ethers.solidityPacked(["bytes32"], [secret]));
    const t1 = await register(f, h);
    await f.alien.connect(f.aliceE).writeAlienLeg(...t1.args);
    await expect(f.alien.mikeSettleTrade(t1.txId, secret))
      .to.changeTokenBalances(f.alienToken, [f.mikeE, f.alien], [AMOUNT, -AMOUNT]);

    const secret2 = ethers.keccak256(ethers.toUtf8Bytes("s2"));
    const h2 = ethers.keccak256(ethers.solidityPacked(["bytes32"], [secret2]));
    const t2 = await register(f, h2, AMOUNT + 1n);
    await f.alien.connect(f.aliceE).writeAlienLeg(...t2.args);
    await time.increase(EXPIRY * SLOT + 1); // past T_A
    await expect(f.alien.aliceGetRefund(t2.txId))
      .to.changeTokenBalances(f.alienToken, [f.aliceE, f.alien], [AMOUNT + 1n, -(AMOUNT + 1n)]);
    await expect(f.alien.mikeSettleTrade(t2.txId, secret2)).to.be.revertedWith("Funds already have been refunded");
  });

  it("10. Committee threshold is exact for any weight sum", async function () {
    const [ , a, b, c] = await ethers.getSigners();
    const F = await ethers.getContractFactory("MerkleContract");
    // three equal weights: 2 of 3 (66.7%) is below 70%, 3 of 3 approves
    const m3 = await F.deploy([a.address, b.address, c.address], [1, 1, 1], 0);
    const root = ethers.keccak256("0x01");
    await m3.connect(a).insertMerkleForApproval(root, 5);
    await m3.connect(b).insertMerkleForApproval(root, 5);
    expect((await m3.getRootByBlock(5))[1]).to.equal(ZERO);
    await m3.connect(c).insertMerkleForApproval(root, 5);
    expect((await m3.getRootByBlock(5))[1]).to.equal(root);
    // weights summing above 10,000 (the old integer multiplier was 0 here)
    const mBig = await F.deploy([a.address, b.address, c.address], [7000, 7000, 7000], 0);
    await mBig.connect(a).insertMerkleForApproval(root, 1);
    await mBig.connect(b).insertMerkleForApproval(root, 1);
    await mBig.connect(c).insertMerkleForApproval(root, 1);
    expect((await mBig.getRootByBlock(1))[1]).to.equal(root);
  });
});
