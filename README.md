# Listrack

**Payment-versus-payment settlement between a regulated ledger and external blockchains, without third-party intermediaries.**

Listrack is the reference implementation of the protocol described in:

> Videira, H. de C. (2025). *Listrack: A Custom Interoperability Design for Regulated Blockchains.* TechRxiv preprint. [doi:10.36227/techrxiv.174650571.12702688/v1](https://doi.org/10.36227/techrxiv.174650571.12702688/v1)

The code in this repository tracks the revised version of the paper. [CHANGES.md](CHANGES.md) lists every change made in the revision, each with its own regression test.

## The problem

A regulated ledger (for example, one carrying tokenised central bank or commercial bank money) needs to settle trades against assets that live on other blockchains. The usual answer puts a trusted intermediary or bridge between the two legs. Listrack settles both legs atomically without one: the regulated ledger only releases its leg once it holds a proof that the external leg was recorded, and either side recovers its funds if the other leg never arrives.

## How it works

Two ledgers take part: the regulated ledger **R** and an external ledger **E**.

1. **Registration on R.** A trade is registered on R. Its identifier (TxId) binds the trade's terms together with its deadlines, so no party can change them afterwards. The counterparty on R then locks the funds for the R leg.
2. **External leg on E.** The other party records the E leg before the external deadline T_E. Legs that arrive late are rejected before any asset moves.
3. **Slots and roots.** E groups the recorded legs into slots on a genesis-anchored clock, so slot numbers never drift. Once a slot closes, its set of legs is fixed. A weighted committee contract on R then approves that slot's Merkle root by threshold vote.
4. **Settlement on R.** The trade settles on R in one of three ways:
   - individually, with a Merkle proof that the leg is in the approved root;
   - in batch, by the committee contract;
   - in hash-lock mode, where a revealed secret replaces the committee.
5. **Refunds.** If the trade does not settle within the window T_S, the locked funds are refunded. Settlement and refund are mutually exclusive, and a refunded trade can be neither settled nor refunded again.

The Merkle tree is domain-separated:

| Element | Hash |
|---|---|
| Leaf | `H(0x00 ‖ TxId)` |
| Node | `H(0x01 ‖ left ‖ right)` |
| Committed root | `H(0x02 ‖ leafCount ‖ treeRoot)` |

Because the leaf count is part of the committed root, the verifier can require a proof of exactly ⌈log₂ n⌉ hashes and an index below n. This rules out the duplicated-last-node ambiguity behind CVE-2012-2459.

## Contracts

| Contract | Ledger | Role |
|---|---|---|
| `DrexListrack.sol` | R | Registers trades, locks the R leg, settles against proofs or batches, refunds after T_S. |
| `DrexMerkle.sol` (`MerkleContract`) | R | Weighted committee that approves slot roots by threshold and settles or refunds in batch. |
| `AlienListrack.sol` | E | Records external legs into slots, serves roots and proofs for closed slots, runs the hash-lock claim and refund. |
| `ListrackMerkle.sol` | both | The shared Merkle scheme: one source of truth for every contract. |
| `TokenDrex.sol`, `TokenAlien.sol` | R, E | Test tokens for the two legs. |

**Naming.** "Drex" and "Alien" are the role names the paper gives the regulated ledger and the external ledger. This is an independent research proof of concept. It is not code from the Banco Central do Brasil's Drex programme, and it is not affiliated with or endorsed by any institution.

## Running

Requires Node.js 18 or later.

```bash
npm install
npx hardhat test                     # 19 tests
REPORT_GAS=true npx hardhat test     # gas table (paper, Table 3)
npx hardhat run scripts/bench.js     # tree and proof scaling (paper, Section 8.3)
```

The test suite covers regular and high-volume cross-chain transfers, automatic settlement and refunds by the committee contract, hash-lock refunds, and the ten revision checks in `test/04_E_RevisionChecks.js`.

### Testnet run

`crossChain.js` runs the protocol across two public test networks (Sepolia as R; Moonbase Alpha as E by default).

1. Copy `listrack.env.example` to `listrack.env`. That file is git-ignored.
2. Set your own `DREX_RPC_URL`.
3. Set seven **test-network** private keys in `PRIVATE_KEYS`.

No RPC URL, API key or private key is stored in this repository.

## Status

This is a research prototype that has not been audited. Do not use it with real funds.

## Licence

The contracts are released under the MIT licence, as declared in their SPDX headers. See [LICENSE](LICENSE).

## Citation

```bibtex
@misc{videira2025listrack,
  author = {Videira, Henrique de Carvalho},
  title  = {Listrack: A Custom Interoperability Design for Regulated Blockchains},
  year   = {2025},
  howpublished = {TechRxiv preprint},
  doi    = {10.36227/techrxiv.174650571.12702688/v1}
}
```

---

<sub>Published in a personal capacity. Views are the author's own and do not represent any institution he is affiliated with.</sub>
