import { useState, useEffect } from "react";

export default function ThemeToggle() {
  // Initialize theme from localStorage to prevent flash
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
  const [mounted, setMounted] = useState(false);

  // Sync theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    setMounted(true);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Don't render until mounted to prevent flash
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "0.25rem",
        display: "flex",
        alignItems: "center",
      }}
      aria-label="Toggle dark/light mode"
    >
      {theme === "light" ? (
        /* Moon SVG for light mode */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M21.75 15.5a9 9 0 01-11.25-11.25 9 9 0 1011.25 11.25z" />
        </svg>
      ) : (
        /* Sun SVG for dark mode */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 18a6 6 0 100-12 6 6 0 000 12zm0-16v2m0 16v2m10-10h-2M4 12H2m15.364-7.364l-1.414 1.414M6.05 17.95l-1.414 1.414M17.95 17.95l-1.414-1.414M6.05 6.05L4.636 7.464" />
        </svg>
      )}
    </button>
  );
}
