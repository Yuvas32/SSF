import React, { createContext, useContext, useState } from "react";

const ScanStatusContext = createContext();

export function ScanStatusProvider({ children }) {
  const [scanStatus, setScanStatus] = useState("idle"); // idle, loading, completed, error

  const startScan = () => setScanStatus("loading");
  const completeScan = () => setScanStatus("completed");
  const errorScan = () => setScanStatus("error");
  const resetScan = () => setScanStatus("idle");

  return (
    <ScanStatusContext.Provider value={{ scanStatus, startScan, completeScan, errorScan, resetScan }}>
      {children}
    </ScanStatusContext.Provider>
  );
}

export function useScanStatus() {
  return useContext(ScanStatusContext);
}
