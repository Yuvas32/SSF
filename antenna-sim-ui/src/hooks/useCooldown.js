import { useEffect, useMemo, useState } from "react";

/**
 * Simple cooldown helper:
 * - call startCooldown() when you begin an action
 * - cooldownLeftMs updates automatically
 */
export default function useCooldown(cooldownMs) {
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNowTick(Date.now()), 100);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const cooldownLeftMs = useMemo(
    () => Math.max(0, cooldownUntil - nowTick),
    [cooldownUntil, nowTick]
  );

  const isCooldownActive = cooldownLeftMs > 0;

  function startCooldown() {
    setCooldownUntil(Date.now() + cooldownMs);
  }

  function resetCooldown() {
    setCooldownUntil(0);
  }

  return { cooldownLeftMs, isCooldownActive, startCooldown, resetCooldown };
}
