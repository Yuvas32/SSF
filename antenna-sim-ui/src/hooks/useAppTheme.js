import { useEffect, useState } from "react";
import { LS_THEME } from "../utils/appConstants";

export default function useAppTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(LS_THEME) || "light");

  useEffect(() => {
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}