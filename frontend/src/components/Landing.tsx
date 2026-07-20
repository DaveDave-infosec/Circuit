import { HeroBreaker } from "./HeroBreaker";

export function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="lb-mark" />
          <span className="lb-name">Circuit</span>
        </div>
        <div className="landing-nav-actions">
          <a className="landing-navlink" href="#how">How it works</a>
          <button className="primary" onClick={onEnter}>Open the console →</button>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-left">
          <p className="hero-eyebrow mono">CONSENSUS-GATED EXECUTION FIREWALL</p>
          <h1 className="hero-headline">
            The proposal said fee tweak.<br />
            The calldata said <span className="hl-block">drain</span>.
          </h1>
          <p className="hero-sub">
            A firewall for a protocol's dangerous actions. Consensus reads the real
            calldata against the proposal it cites & stops the ones that lie. No admin.
            No multisig. Consensus.
          </p>
          <div className="hero-cta">
            <button className="primary lg" onClick={onEnter}>Open the console →</button>
            <a className="ghost-link" href="#how">See how it works</a>
          </div>
          <div className="hero-stats">
            <div className="hstat">
              <span className="hstat-num">4</span>
              <span className="hstat-label">OUTCOMES</span>
            </div>
            <div className="hstat">
              <span className="hstat-num">0</span>
              <span className="hstat-label">TRUSTED ADMINS</span>
            </div>
            <div className="hstat">
              <span className="hstat-num">100%</span>
              <span className="hstat-label">VERDICTS ON-CHAIN</span>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <HeroBreaker />
        </div>
      </header>

      <section className="section problem-sec">
        <div className="section-inner">
          <p className="section-eyebrow mono">THE PROBLEM</p>
          <h2 className="section-headline">A proposal is a story.<br />Calldata is the truth.</h2>
          <p className="section-lead">
            The classic governance attack hides a hostile action behind an innocent description.
            The proposal reads like routine housekeeping. The calldata does something else entirely.
          </p>
          <div className="contrast">
            <div className="contrast-card contrast-benign">
              <span className="cc-label mono">THE PROPOSAL SAYS</span>
              <p className="cc-text">
                "Adjust the protocol fee parameter. A routine tweak. No treasury funds are moved."
              </p>
              <span className="cc-tag mono">reads harmless</span>
            </div>
            <div className="contrast-card contrast-hostile">
              <span className="cc-label mono">THE CALLDATA DOES</span>
              <p className="cc-text mono">
                transfer(0xattacker, 90000) — the whole treasury, to an address the proposal never names.
              </p>
              <span className="cc-tag mono">drains everything</span>
            </div>
          </div>
          <p className="section-foot">
            Every deterministic check passes. The amount, the recipient, the limits all look fine in
            isolation. Only reading the proposal against the real action catches the lie, & that read is
            a judgment no single backend can be trusted to make. Consensus can.
          </p>
        </div>
      </section>

      <section className="section how-sec" id="how">
        <div className="section-inner">
          <p className="section-eyebrow mono">HOW IT WORKS</p>
          <h2 className="section-headline">Three steps from a proposed action to a verdict.</h2>
          <div className="steps">
            <div className="step">
              <span className="step-num mono">01</span>
              <h3 className="step-title">Propose the real action</h3>
              <p className="step-text">
                A proposer submits the actual executable action, not a description of one. Circuit
                decodes it into its true fields.
              </p>
            </div>
            <div className="step">
              <span className="step-num mono">02</span>
              <h3 className="step-title">The gate fetches its own evidence</h3>
              <p className="step-text">
                It reads the on-chain state, the locked policy, & the governance proposal the action
                cites, pulled from the web inside a consensus block. It never takes the proposer's word.
              </p>
            </div>
            <div className="step">
              <span className="step-num mono">03</span>
              <h3 className="step-title">Consensus decides the gate</h3>
              <p className="step-text">
                Validators reason over the four checks & reach a verdict: ALLOW, BLOCK, ESCALATE, or
                DELAY. The treasury moves only on ALLOW.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section outcomes-sec">
        <div className="section-inner">
          <p className="section-eyebrow mono">THE VERDICTS</p>
          <h2 className="section-headline">Four outcomes. Colour is the verdict.</h2>
          <p className="section-lead">
            Every proposed action lands on one of four states. The signal colour is the decision —
            you read the outcome before you read a word.
          </p>
          <div className="outcomes-board">
            <div className="outcome-panel op-allow">
              <div className="op-bar" />
              <h3 className="op-name">ALLOW</h3>
              <div className="op-row">
                <span className="op-k mono">WHEN</span>
                <span className="op-v">Every critical check passes.</span>
              </div>
              <div className="op-row">
                <span className="op-k mono">THEN</span>
                <span className="op-v">The action executes against the treasury.</span>
              </div>
            </div>
            <div className="outcome-panel op-block">
              <div className="op-bar" />
              <h3 className="op-name">BLOCK</h3>
              <div className="op-row">
                <span className="op-k mono">WHEN</span>
                <span className="op-v">The action contradicts its proposal, breaks a locked bound, or overshoots the cap.</span>
              </div>
              <div className="op-row">
                <span className="op-k mono">THEN</span>
                <span className="op-v">Execution is made impossible.</span>
              </div>
            </div>
            <div className="outcome-panel op-escalate">
              <div className="op-bar" />
              <h3 className="op-name">ESCALATE</h3>
              <div className="op-row">
                <span className="op-k mono">WHEN</span>
                <span className="op-v">The recipient is off the approved list.</span>
              </div>
              <div className="op-row">
                <span className="op-k mono">THEN</span>
                <span className="op-v">The action freezes, held for governance.</span>
              </div>
            </div>
            <div className="outcome-panel op-delay">
              <div className="op-bar" />
              <h3 className="op-name">DELAY</h3>
              <div className="op-row">
                <span className="op-k mono">WHEN</span>
                <span className="op-v">A soft breach of the transfer cap.</span>
              </div>
              <div className="op-row">
                <span className="op-k mono">THEN</span>
                <span className="op-v">A cooldown is enforced before it can proceed.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section proof-sec">
        <div className="section-inner">
          <p className="section-eyebrow mono">THE PROOF</p>
          <h2 className="section-headline">This isn't a mockup. It's a real verdict.</h2>
          <p className="section-lead">
            Case circuit_1 on the live gate. Every deterministic check passed — the amount was under
            cap, the recipient was on the approved list — & consensus blocked it anyway, because the
            action didn't match the proposal it cited.
          </p>

          <div className="proof-card">
            <div className="proof-head">
              <span className="mono proof-case">circuit_1</span>
              <span className="outcome-BLOCK proof-outcome">BLOCK</span>
            </div>

            <div className="proof-breakers">
              <div className="pb pb-fail"><span>Calldata Match</span><span className="mono">FAIL</span></div>
              <div className="pb pb-pass"><span>Threshold</span><span className="mono">PASS</span></div>
              <div className="pb pb-pass"><span>Approved Destination</span><span className="mono">PASS</span></div>
              <div className="pb pb-na"><span>Policy Bounds</span><span className="mono">N/A</span></div>
            </div>

            <div className="proof-action mono">
              <div><span className="pa-k">action</span> transfer 5000 GenUSDC → 0x0000…dead</div>
              <span className="pa-note">amount under the 9500 cap · recipient on the approved list · both deterministic checks clean</span>
            </div>

            <div className="proof-reasoning">
              <span className="stat-label">CONSENSUS REASONING</span>
              <p>
                "The executable action transfers 5000 GenUSDC from the protected treasury to
                0x0000000000000000000000000000000000000dead, while the proposal says it is only a
                minor protocol fee parameter adjustment and explicitly states that no treasury funds
                are moved."
              </p>
            </div>

            <div className="proof-foot mono">
              Verifiable on the gate contract 0xcA5f9159ff37c4089131f9EA85C030167D6b947e · GenLayer Studio · chainId 61999
            </div>
          </div>
        </div>
      </section>

      <section className="section cta-sec">
        <div className="section-inner cta-inner">
          <div className="cta-line" />
          <h2 className="cta-headline">Consensus at the breaker.</h2>
          <p className="cta-sub">
            Propose an action, run the gate, & watch the breaker decide. Every outcome is live on
            GenLayer Studio right now.
          </p>
          <button className="primary lg" onClick={onEnter}>Open the console →</button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="lb-mark" />
            <span className="lb-name">Circuit</span>
          </div>
          <div className="footer-meta mono">
            <div>Executor · 0xC78ce2f5a6387FeA9694b0064e6467437831913B</div>
            <div>Gate · 0xcA5f9159ff37c4089131f9EA85C030167D6b947e</div>
            <div className="footer-credit">Built on GenLayer Studio · chainId 61999</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
