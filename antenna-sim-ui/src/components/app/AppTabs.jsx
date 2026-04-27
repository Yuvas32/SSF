import { APP_TABS } from "../../utils/appConstants";
import { labelForTab } from "../../utils/tabUtils";

export default function AppTabs({ activeTab, setActiveTab, scanId, onSpectrumClick }) {
  const scanTableTab = APP_TABS.find(tab => tab.id === "frequencies");
  const otherTabs = APP_TABS.filter(tab => tab.id !== "frequencies");

  return (
    <div className="panel" style={{ padding: 10 }}>
      <div style={{ display: "flex", gap: 10 }}>
        {scanTableTab && (
          <TabButton
            key={scanTableTab.id}
            id={scanTableTab.id}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          >
            {scanTableTab.label}
          </TabButton>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        {otherTabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSpectrumClick={tab.id === "spectrum" ? onSpectrumClick : undefined}
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

function TabButton({ id, activeTab, setActiveTab, onSpectrumClick, children }) {
  const active = id === activeTab;

  function handleClick() {
    setActiveTab(id);
    if (id === "spectrum" && onSpectrumClick) {
      onSpectrumClick?.();
    }
  }

  return (
    <button
      className={active ? "btnTabActive" : "btnTab"}
      onClick={handleClick}
      type="button"
    >
      {children}
    </button>
  );
}