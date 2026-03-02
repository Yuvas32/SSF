import { useEffect, useState } from "react";

const DEFAULT_MISSING = ["DEVICE", "PSSR4"];

export default function usePcHealth(pollMs = 3000) {
  const [state, setState] = useState({
    ok: false,
    devicesOk: false,
    missingDevices: DEFAULT_MISSING,
    apiOk: false,
    apiMessage: "satscan api call not running",
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      let devicesOk = false;
      let missingDevices = DEFAULT_MISSING;

      try {
        const r = await fetch("http://localhost:8080/health/devices", {
          cache: "no-store",
        });
        const j = await r.json();

        devicesOk = Boolean(j.ok);
        missingDevices = Array.isArray(j.missing)
          ? j.missing.map((x) => String(x).toUpperCase())
          : DEFAULT_MISSING;
      } catch {
        devicesOk = false;
        missingDevices = DEFAULT_MISSING;
      }

      let apiOk = false;
      let apiMessage = "satscan api call not running";

      try {
        const r2 = await fetch("http://localhost:8080/health/satscan-api", {
          cache: "no-store",
        });
        const j2 = await r2.json();

        apiOk = Boolean(j2.ok);
        apiMessage = String(
          j2.message || (apiOk ? "api call satscan ok" : "satscan api call not running")
        );
      } catch {
        apiOk = false;
        apiMessage = "satscan api call not running";
      }

      if (!alive) return;

      setState({
        ok: devicesOk && apiOk,
        devicesOk,
        missingDevices,
        apiOk,
        apiMessage,
      });
    }

    load();
    const id = setInterval(load, pollMs);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pollMs]);

  return state;
}