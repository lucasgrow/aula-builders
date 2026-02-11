"use client";

import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const [theme, setTheme] = useState("light");

  const toggleTheme = useCallback(() => {
    if (typeof window !== "undefined" && window.__setPreferredTheme) {
      window.__setPreferredTheme(theme === "light" ? "dark" : "light");
    }
  }, [theme]);

  useEffect(() => {
    if (window.__theme) setTheme(window.__theme);
    window.__onThemeChange = setTheme;
  }, []);

  return { theme, toggleTheme };
}
