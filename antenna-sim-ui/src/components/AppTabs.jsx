import { APP_TABS } from "../utils/appConstants";
import { labelForTab } from "../utils/tabUtils";

export default function AppTabs({ activeTab, setActiveTab, scanId }) {
  return (
    <div className="panel" style={{ padding: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {APP_TABS.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
        Active: <b>{labelForTab(activeTab)}</b>
        {scanId ? (
          <>
            {" "}
            • Current Scan ID: <b>{scanId}</b>
          </>
        ) : null}
      </div>
    </div>
  );
}

function TabButton({ id, activeTab, setActiveTab, children }) {
  const active = id === activeTab;

  return (
    <button
      className={active ? "btnTabActive" : "btnTab"}
      onClick={() => setActiveTab(id)}
      type="button"
    >
      {children}
    </button>
  );
}