import { useEffect, useMemo, useState } from "react";
import { normalizeSpectrumPoints } from "../utils/spectrumHelpers";

export default function useSpectrumDemo({ enabled }) {
  const demoUrl = useMemo(() => "/spectrum-demo.json", []);
  const [demo, setDemo] = useState({ points: [], unit: "MHz", updatedAt: "" });

  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${demoUrl}?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load demo spectrum (${res.status})`);
        const json = await res.json();
        if (!alive) return;

        setDemo({
          points: normalizeSpectrumPoints(json.points),
          unit: json.unit || "MHz",
          updatedAt: json.updatedAt || "",
        });
      } catch (e) {
        console.warn(e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [demoUrl, enabled]);

  return { ...demo, demoUrl };
}