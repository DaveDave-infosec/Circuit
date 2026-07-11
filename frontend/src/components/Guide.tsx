export function Guide() {
  return (
    <div className="panel guide">
      <section className="guide-sec">
        <h2>What Circuit is</h2>
        <p>
          Circuit is a consensus-gated firewall for a protocol's dangerous actions —
          treasury transfers & parameter changes. Instead of executing a proposed action
          directly, the protocol routes it through Circuit. Consensus inspects the real
          action against locked policy & the governance proposal it claims to fulfil, then
          decides: ALLOW, BLOCK, ESCALATE, or DELAY. No admin & no multisig is the safety
          authority. Consensus is.
        </p>
      </section>

      <section className="guide-sec">
        <h2>Test it in 30 seconds</h2>
        <ol className="guide-steps">
          <li>Connect a wallet, or use the demo wallet.</li>
          <li>In the Console, click a scenario. It fills the form for you.</li>
          <li>Click Propose action, then Run the gate.</li>
          <li>Watch the Breaker Panel evaluate & land on an outcome.</li>
        </ol>
        <p>
          Start with <span className="g-em">Governance calldata attack</span>. The proposal
          claims a harmless fee tweak, but the real action drains the treasury. Every
          deterministic check passes, & the gate still blocks it, because consensus reads
          the proposal & catches the lie. That is the case no single backend can be trusted
          to judge.
        </p>
      </section>

      <section className="guide-sec">
        <h2>Reading the Breaker Panel</h2>
        <p>Four breakers, one per check. A toggle up & green means pass. A toggle down & red means tripped.</p>
        <ul className="guide-list">
          <li><span className="g-k">Calldata Match</span> — does the real action match the governance proposal it cites? Decided by consensus.</li>
          <li><span className="g-k">Threshold</span> — is the transfer within the locked size cap?</li>
          <li><span className="g-k">Approved Destination</span> — is the recipient on the locked allow-list?</li>
          <li><span className="g-k">Policy Bounds</span> — does a parameter change stay within its locked bound?</li>
        </ul>
        <p>The master state is the verdict:</p>
        <ul className="guide-list">
          <li><span className="g-allow">ALLOW</span> — every critical check passes; the action executes.</li>
          <li><span className="g-block">BLOCK</span> — a hard violation; execution is made impossible.</li>
          <li><span className="g-escalate">ESCALATE</span> — off-list destination; frozen for governance.</li>
          <li><span className="g-delay">DELAY</span> — a soft threshold breach; cooldown before it can proceed.</li>
        </ul>
      </section>

      <section className="guide-sec">
        <h2>Under the hood</h2>
        <p>
          A proposer submits a real executable action, not a description of one. The gate
          decodes it, fetches its own evidence — the current on-chain state, the locked
          constitution, & the referenced governance proposal pulled from the web inside a
          consensus block — & runs the four checks. The verdict is written on-chain. The
          protected treasury only moves value on an ALLOW verdict; BLOCK, ESCALATE, & DELAY
          move nothing. The gate never takes the proposer's word for a decisive fact; it
          obtains the evidence itself.
        </p>
      </section>

      <section className="guide-sec">
        <h2>Honest limitations (V1)</h2>
        <ul className="guide-list">
          <li>
            <span className="g-k">Policy firewall, not a threat oracle.</span> Circuit judges
            actions against locked policy & real state, not address reputation. Reputation
            scoring is out of scope in V1.
          </li>
          <li>
            <span className="g-k">Relayed execution.</span> In V1 the protocol owner relays
            an ALLOW verdict to the executor. Fully trustless automatic execution is the V2
            target. The verdict itself is produced by consensus.
          </li>
          <li>
            <span className="g-k">Mock protected target.</span> The treasury & parameter here
            are a stand-in protocol. Real-protocol integration is V2.
          </li>
          <li>
            <span className="g-k">Static proposal pages.</span> The referenced proposal must
            be a stable page so every validator fetches identical text for consensus.
          </li>
          <li>
            <span className="g-k">Use a single-wallet browser.</span> Multiple injected
            wallets (MetaMask plus others) can clash on the wallet connection. A browser with
            only MetaMask avoids it.
          </li>
        </ul>
      </section>
    </div>
  );
}
