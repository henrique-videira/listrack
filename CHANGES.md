# Listrack — revision for the JFMI manuscript

This revision aligns the proof of concept with the protocol specified in the revised paper
(*Listrack: payment-versus-payment settlement between a regulated ledger and external
blockchains without third-party intermediaries*, Section 4.3). Every change has a
regression test in `test/04_E_RevisionChecks.js`.

## Changes

| # | Change | Contracts | Test |
|---|--------|-----------|------|
| 1 | **External-leg deadline T_E enforced on E.** `writeAlienLeg` rejects late legs. T_E and the hash-lock refund time T_A are computed on R at registration and bound into TxId, so AL enforces exactly the registered values and a counterparty cannot change them. | DrexListrack, AlienListrack | 1, 2 |
| 2 | **Genesis-anchored slots.** `slot = (t − genesis) / slotLength` on both ledgers (no drift across empty slots). Roots and proofs are served only for closed slots (`isSlotClosed`). | DrexListrack, AlienListrack | 4, 5 |
| 3 | **Domain-separated, size-bound Merkle tree.** Leaf `H(0x00‖TxId)`, node `H(0x01‖l‖r)`, committed root `H(0x02‖n‖treeRoot)`. The verifier requires a proof of exactly ⌈log₂ n⌉ hashes and an index below n. One shared library for all contracts. | ListrackMerkle (new), all three | 6 |
| 4 | **Settlement window T_S in both modes.** Previously checked only in hash-lock mode. Manual and batch settlement are now refused after T_S, so settlement and refund on R are mutually exclusive. | DrexListrack | 7 |
| 5 | **Refund state.** A batch refund left the trade marked as locked, which allowed a second refund or a settlement after the refund. The lock is now cleared before paying, and batch refunds become due at T_X (previously 2·T_X). | DrexListrack | 8 |
| 6 | **Hash-lock mode on E.** Claims and refunds pay in the trade's token (previously the native coin, because `tokenAddress` was never set); each TxId can be recorded only once; Mike's claim window closes at T_A, when Alice's refund opens. | AlienListrack | 3, 9 |
| 7 | **Committee threshold.** A root is stored when `votes × 10000 ≥ threshold × totalWeight`. The previous integer multiplier `10000 / totalWeight` miscounted for most weight totals and blocked approval above a total weight of 10,000. Removed approvers now lose their weight. | MerkleContract | 10 |

Also fixed: native-coin legs and fees, which failed because the contracts sent coins to
themselves without a `receive` function.

## Interface changes

- `AlienListrack` constructor: `(slotLength, genesisTimestamp)` — `0` means deployment time.
- `AlienListrack.writeAlienLeg`: two extra arguments at the end, `alienDeadline` and
  `alienRefundTime`, read from `getDrexAlienInputsbyId(txId)[0][12]` and `[13]`.
- `DrexListrack.aliceSettleTrade(txId, index, leafCount, proof, slot, secret)` and
  `validateMerkleProof(txId, index, leafCount, proof, slot)`: new `leafCount` argument,
  from `AlienListrack.getSlotSize(slot)`.
- `MerkleContract.validateSomeTxForSettlement`: new `leafCount[]` argument after `txIndex[]`.
- New views: `AlienListrack.currentSlot`, `isSlotClosed`, `getSlotSize`;
  `DrexListrack.slotNow`, `slotStartTime`.
- `DrexListrack.trades` is now internal; read trades with `getDrexAlienInputsbyId`.

## Running

```
npm install
npx hardhat test                    # 19 tests
REPORT_GAS=true npx hardhat test    # gas table (paper, Table 3)
npx hardhat run scripts/bench.js    # tree and proof scaling (paper, Section 8.3)
```

For the testnet run, copy `listrack.env.example` to `listrack.env` and insert your RPC
URL and keys in `crossChain.js`. The script now waits for the external slot to close
before building proofs.
