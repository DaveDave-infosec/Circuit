import { useEffect, useState, useCallback } from "react";
import { getConfig, getTreasuryState, getConstitution } from "../lib/contracts";

export function StatusBar({
  refreshKey,
  onOwner,
}: {
  refreshKey: number;
  onOwner: (o: string) => void;
}) {
  const [treasury, setTreasury] = useState<any>(null);
  const [constitution, setConstitution] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const cfg = await getConfig();
      const t = await getTreasuryState();
      const c = await getConstitution();
      setTreasury(t);
      setConstitution(c);
      if (cfg && cfg.owner) onOwner(cfg.owner);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }, [onOwner]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (err) return <div className="panel"><div className="error mono">{err}</div></div>;
  if (!treasury || !constitution)
    return <div className="panel"><div className="msg mono">Reading circuit state…</div></div>;

  const dests: string[] = constitution.approved_destinations || [];

  return (
    <div className="panel status-panel">
      <div className="stat">
        <span className="stat-label">PROTECTED TARGET</span>
        <span className="stat-value">{treasury.protected_target}</span>
      </div>
      <div className="stat">
        <span className="stat-label">TREASURY</span>
        <span className="stat-value mono">{treasury.treasury_balance} GenUSDC</span>
      </div>
      <div className="stat">
        <span className="stat-label">FEE PARAM</span>
        <span className="stat-value mono">{treasury.param_fee_bps} bps</span>
      </div>
      <div className="stat">
        <span className="stat-label">TRANSFER CAP</span>
        <span className="stat-value mono">{constitution.max_transfer_bps} bps</span>
      </div>
      <div className="stat">
        <span className="stat-label">FEE CAP</span>
        <span className="stat-value mono">{constitution.param_fee_cap_bps} bps</span>
      </div>
      <div className="stat">
        <span className="stat-label">POLICY</span>
        <span className={"stat-value " + (constitution.locked ? "locked-ok" : "")}>
          {constitution.locked ? "LOCKED" : "unlocked"}
        </span>
      </div>
      <div className="stat wide">
        <span className="stat-label">APPROVED DESTINATIONS</span>
        <span className="stat-value small">
          {dests.length > 0 ? dests.join(", ") : "(none)"}
        </span>
      </div>
    </div>
  );
}
