# Circuit

**A consensus-gated execution firewall for high-risk protocol actions, on GenLayer.**

Tagline: **Consensus at the breaker.**

Live demo: **https://circuit-genlayer.vercel.app**

---

## What Circuit is

A protocol routes its dangerous actions (treasury transfers, parameter changes, privileged calls) through Circuit instead of executing them directly. A proposer submits the ACTUAL executable action, not a description of one. Circuit independently inspects the action, fetches the protocol's real state & a locked safety constitution, pulls the governance proposal the action claims to fulfil, & consensus decides:

- **ALLOW** → the action executes
- **BLOCK** → execution is made impossible
- **ESCALATE** → the action is frozen pending governance
- **DELAY** → a cooldown is enforced before the action can proceed

No admin & no multisig is the safety authority. Consensus is.

---

## Why consensus is indispensable here

Circuit's core check is the one no single backend can be trusted to run: does the real executable action actually match the human-readable governance proposal it claims to fulfil?

This catches the classic governance attack. The proposal reads "adjust a fee parameter." The calldata drains the treasury. Every deterministic guard passes, amount under cap, recipient on the approved list, & a normal firewall waves it through. Circuit reads the proposal, compares it to the real action, & blocks the lie.

Whoever runs a centralised backend could be the attacker, so a single reviewer can't be the authority on that match. Consensus can. That is where GenLayer is load-bearing, not decorative.

---

## Deployed contracts (GenLayer Studio, chainId 61999 / 0xF22F)

| Contract | Address | Role |
|---|---|---|
| CircuitExecutor | `0xd8d0A423992D90fc2521B846d5ED83C1294B280b` | Holds the protected treasury & token, locks the safety constitution, & executes ONLY on an ALLOW verdict |
| CircuitGate | `0x78A9C3FaFbF44fF56D6b6a3dCC008b08Fea9DDC3` | Decodes the action, fetches evidence, runs the four checks, reaches consensus on the verdict |

Both are Python Intelligent Contracts.

---

## The four checks

Each proposed action is judged by four breakers.

1. **Calldata Match** — does the real action faithfully match the governance proposal it cites? This is the contestable one, decided by consensus over the fetched proposal text.
2. **Threshold** — is a transfer within the locked size cap (a percentage of the treasury)?
3. **Approved Destination** — is the recipient on the locked allow-list?
4. **Policy Bounds** — does a parameter change stay within its locked bound?

Three of the four are exact deterministic comparisons against the locked constitution. Only Calldata Match needs judgment, so only it runs through the LLM under consensus. Wrapping unambiguous math in an LLM would add unreliability, not safety, so Circuit does not.

## How the checks become an outcome

- Calldata mismatch → **BLOCK** (the action lies about what it does)
- Parameter over its policy bound → **BLOCK**
- Transfer far over cap (more than double) → **BLOCK**
- Transfer to an off-list destination → **ESCALATE**
- Transfer just over cap (over, but within double) → **DELAY**
- Everything passes → **ALLOW**

BLOCK beats ESCALATE beats DELAY beats ALLOW when more than one fires.

---

## Architecture

```
  Protocol sets up Circuit
   (funds the protected treasury, locks the safety constitution:
    transfer cap + policy bounds + approved-destination list)
        │
        │  a proposer submits an ACTUAL executable action
        ▼
  CircuitGate ── decodes the action; fetches evidence: current on-chain
        │        state, the locked constitution, & the referenced governance
        │        proposal (pulled from the web inside a consensus block).
        │        Runs the four checks. Consensus decides the calldata-vs-proposal
        │        match. Outputs outcome + per-check results + reasoning +
        │        minority note.
        │  verdict
        ▼
  CircuitExecutor ── the ONLY path to the protected action:
        │  ALLOW    → executes the action against the protected treasury
        │  BLOCK    → rejected; execution impossible
        │  ESCALATE → frozen; flagged for governance
        │  DELAY    → cooldown; reassessment required before proceeding
        ▼  every case logged on-chain, fully auditable
```

The gate produces the verdict. The executor is the only thing that moves value, & only on ALLOW. The gate never takes the proposer's word for a decisive fact; it obtains the evidence itself.

---

## Run it locally

Requirements: Node 18+, a browser with a single wallet (see limitations).

```
cd frontend
npm install
npm run dev
```

Then open the local URL, connect a wallet (or use the built-in demo wallet), & try a scenario.

The frontend is Vite + React + TypeScript + genlayer-js. No environment variables or API keys, the contract addresses are in `frontend/src/lib/contracts.ts`.

## How to test it in 30 seconds

1. Open the live demo, connect a wallet or use the demo wallet.
2. Click a scenario. It fills the form for you.
3. Click Propose action, then Run the gate.
4. Watch the Breaker Panel evaluate & land on an outcome.

Start with **Governance calldata attack**. The proposal claims a harmless fee tweak, the real action drains the treasury, every deterministic check passes, & the gate still blocks it. That is the case no single backend can be trusted to judge.

---

## The proposal source is deliberately open

The gate fetches the referenced governance proposal from any web-reachable source. The demo uses public gists for convenience, but a proposal can live anywhere fetchable, a governance forum, a raw repo file, or a project's own page. Circuit is source-agnostic by design; its job is to obtain the evidence itself, wherever the proposal actually lives.

Circuit also composes naturally with proposal-evaluation tools. A platform like GovMind (an AI governance console on GenLayer) decides whether a proposal should pass; Circuit enforces that the executed action matches what was approved. Two independent layers of the same defence, evaluation then execution control, without coupling the contracts together.

---

## Honest limitations (V1)

- **Policy firewall, not a threat oracle.** Circuit judges actions against locked policy & real state, not address reputation. Reputation scoring is out of scope in V1.
- **Relayed execution.** In V1 the protocol owner relays an ALLOW verdict to the executor. Fully trustless automatic execution is the V2 target. The verdict itself is produced by consensus.
- **Mock protected target.** The treasury & parameter here are a stand-in protocol. Real-protocol integration is V2.
- **Static proposal pages.** The referenced proposal must be a stable page so every validator fetches identical text for consensus.
- **Single-wallet browser.** Multiple injected wallets (MetaMask plus others) can clash on the wallet connection. A browser with only MetaMask avoids it.

---

## Stack

- Intelligent Contracts: Python on GenLayer Studio
- Frontend: Vite + React + TypeScript
- Chain access: genlayer-js
- Design: an instrument-panel "Control Room" register, signal colours map one-to-one to the four outcomes

---

## Build arc

Circuit is the fifth in a line of GenLayer builds exploring where consensus is genuinely indispensable: Holdline (consensus-triggered insurance) → Balance (proportional settlement) → Steward (autonomous execution of grants) → Remedy (lifecycle settlement of security claims) → Circuit (consensus-gated execution firewall).
