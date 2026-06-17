"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/shared/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full border border-[var(--border)] bg-transparent" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--brand-500)]/30 hover:bg-[var(--surface-2)]"
      style={{
        borderColor: "var(--border)",
        background: "transparent",
        color: "var(--muted-text)",
      }}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-violet-600" />
      )}
    </button>
  );
}
