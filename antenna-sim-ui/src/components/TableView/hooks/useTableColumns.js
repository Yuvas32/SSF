import { useEffect, useMemo, useState } from "react";
import { LS_COLS_KEY } from "../constants";
import { norm, safeJsonParse, unique } from "../utils/columnUtils";

export default function useTableColumns(allHeaders, defaultSelected) {
  const [selected, setSelected] = useState([]);
  const [colSearch, setColSearch] = useState("");
  const [showColumnsView, setShowColumnsView] = useState(false);

  useEffect(() => {
    if (!allHeaders.length) {
      setSelected([]);
      return;
    }

    const saved = safeJsonParse(localStorage.getItem(LS_COLS_KEY));
    if (Array.isArray(saved) && saved.length) {
      const existing = new Set(allHeaders);

      const revived = [];
      for (const s of saved) {
        if (existing.has(s)) {
          revived.push(s);
          continue;
        }

        const targetNorm = norm(s);
        const idx = allHeaders.findIndex((h) => norm(h) === targetNorm);
        if (idx >= 0) revived.push(allHeaders[idx]);
      }

      setSelected(revived.length ? unique(revived) : unique(defaultSelected));
    } else {
      setSelected(unique(defaultSelected));
    }
  }, [allHeaders, defaultSelected]);

  useEffect(() => {
    if (!allHeaders.length) return;
    localStorage.setItem(LS_COLS_KEY, JSON.stringify(selected));
  }, [selected, allHeaders.length]);

  const visibleHeaders = useMemo(() => {
    const set = new Set(allHeaders);
    return selected.filter((h) => set.has(h));
  }, [selected, allHeaders]);

  const colIndexByHeader = useMemo(() => {
    const map = new Map();
    allHeaders.forEach((h, i) => map.set(h, i));
    return map;
  }, [allHeaders]);

  const filteredAvailable = useMemo(() => {
    const q = colSearch.trim().toLowerCase();
    if (!q) return allHeaders;
    return allHeaders.filter((h) => String(h).toLowerCase().includes(q));
  }, [allHeaders, colSearch]);

  function toggleHeader(h) {
    setSelected((prev) => {
      const has = prev.includes(h);
      if (has) return prev.filter((x) => x !== h);
      return [...prev, h];
    });
  }

  function move(h, dir) {
    setSelected((prev) => {
      const idx = prev.indexOf(h);
      if (idx < 0) return prev;

      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;

      const copy = [...prev];
      [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
      return copy;
    });
  }

  function resetToDefault() {
    setSelected(unique(defaultSelected));
  }

  function showAll() {
    setSelected(unique(allHeaders));
  }

  function hideAll() {
    setSelected([]);
    localStorage.removeItem(LS_COLS_KEY);
  }

  return {
    selected,
    colSearch,
    setColSearch,
    showColumnsView,
    setShowColumnsView,
    visibleHeaders,
    colIndexByHeader,
    filteredAvailable,
    toggleHeader,
    move,
    resetToDefault,
    showAll,
    hideAll,
  };
}