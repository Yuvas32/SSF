import { useEffect, useRef } from "react";

export default function useInterval(fn, delayMs) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    if (delayMs == null) return;
    const id = setInterval(() => fnRef.current?.(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
