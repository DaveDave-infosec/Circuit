import { useState, useCallback } from "react";
import { useWallet } from "./lib/useWallet";
import { StatusBar } from "./components/StatusBar";
import { Flow } from "./components/Flow";
import { CaseLog } from "./components/CaseLog";
import { Guide } from "./components/Guide";
import { Landing } from "./components/Landing";

export default function App() {
  const { address, mode, connectMetaMask, useDemo, disconnect } = useWallet();
  const [refreshKey, setRefreshKey] = useState(0);
  const [owner, setOwner] = useState<string | null>(null);
  const [tab, setTab] = useState<"console" | "guide">("console");
  const [view, setView] = useState<"landing" | "app">("landing");

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const isOwner = !!address && !!owner && address.toLowerCase() === owner.toLowerCase();

  if (view === "landing") {
    return <Landing onEnter={() => setView("app")} />;
  }

  return (
    <main className="shell-wide">
      <header className="topbar">
        <div className="topbar-brand" onClick={() => setView("landing")}>
          <div className="armed-line" />
          <span className="status">CIRCUIT ARMED</span>
          <h1 className="wordmark-sm">Circuit</h1>
        </div>
        <div className="wallet-box">
          {!address ? (
            <div className="row">
              <button className="primary" onClick={connectMetaMask}>Connect MetaMask</button>
              <button className="ghost" onClick={useDemo}>Demo wallet</button>
            </div>
          ) : (
            <div className="wallet-info mono">
              <span>{mode}</span>
              <span className="addr">{address}</span>
              {isOwner && <span className="owner-tag">owner</span>}
              <button className="ghost sm" onClick={disconnect}>disconnect</button>
            </div>
          )}
        </div>
      </header>

      <nav className="tabs">
        <button
          className={"tab " + (tab === "console" ? "tab-active" : "")}
          onClick={() => setTab("console")}
        >
          Console
        </button>
        <button
          className={"tab " + (tab === "guide" ? "tab-active" : "")}
          onClick={() => setTab("guide")}
        >
          Guide
        </button>
      </nav>

      {tab === "console" ? (
        <>
          <StatusBar refreshKey={refreshKey} onOwner={setOwner} />
          {address ? (
            <Flow account={address} isOwner={isOwner} onExecuted={bumpRefresh} />
          ) : (
            <div className="panel">
              <p className="hint">Connect a wallet to propose an action & run the gate.</p>
            </div>
          )}
          <CaseLog refreshKey={refreshKey} />
        </>
      ) : (
        <Guide />
      )}
    </main>
  );
}
