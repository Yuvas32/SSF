import { useEffect, useState } from "react";
import { LS_ACTIVE_TAB } from "../utils/appConstants";

export default function useActiveTab() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem(LS_ACTIVE_TAB) || "spectrum"
  );

  useEffect(() => {
    localStorage.setItem(LS_ACTIVE_TAB, activeTab);
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
  };
}