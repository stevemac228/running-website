import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header>
      <div className="nav_left">
        <img
          src="/icons/newPufin-Kittl(1).svg"
          alt="Puffin Mascot"
          className="puffin-icon"
          fill="none"
        />
        <h1>Run NL</h1>
      </div>

      {/* Hamburger menu button - only visible on mobile */}
      <button 
        className="hamburger-menu" 
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
      >
        <span className={isMenuOpen ? "hamburger-line open" : "hamburger-line"}></span>
        <span className={isMenuOpen ? "hamburger-line open" : "hamburger-line"}></span>
        <span className={isMenuOpen ? "hamburger-line open" : "hamburger-line"}></span>
      </button>

      {/* Desktop navigation */}
      <nav className="nav-desktop">
        <Link href="/" className="nav-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="22"
            height="22"
          >
            <path d="M4 10.5L12 4l8 6.5"></path>
            <path d="M6 10.5v8.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5"></path>
            <rect x="10" y="13.5" width="4" height="6" rx="1" ry="1"></rect>
          </svg>
          <span className="nav-text">Home</span>
        </Link>
        <Link href="/calendar" className="nav-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="22"
            height="22"
          >
            <rect x="3.5" y="4" width="17" height="17" rx="2" ry="2"></rect>
            <line x1="16" y1="2.5" x2="16" y2="6"></line>
            <line x1="8" y1="2.5" x2="8" y2="6"></line>
            <line x1="3.5" y1="10" x2="20.5" y2="10"></line>
          </svg>
          <span className="nav-text">Calendar</span>
        </Link>
        {/* Maps link with SVG icon */}
        <Link href="/maps" className="nav-link" aria-label="Maps">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nav-icon"
            viewBox="0 0 32 32"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="22"
            height="22"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M29,6.94,20.48,4.11h-.06A1,1,0,0,0,20,4a.89.89,0,0,0-.43.11h-.08L16.64,5.19a5,5,0,0,0-1-1.59,5,5,0,0,0-7.9.77,4.87,4.87,0,0,0-.47,1L3.94,4.26A1.47,1.47,0,0,0,2,5.66V7A1,1,0,0,0,4,7V6.39l3,1a5,5,0,0,0,.51,1.87l3.57,7.19a1,1,0,0,0,1.8,0l3.57-7.19A5.06,5.06,0,0,0,17,7.41a1.47,1.47,0,0,0,0-.21l2-.76V25.31l-6,2.25V20a1,1,0,0,0-2,0v7.61L4,25.28V11a1,1,0,0,0-2,0V25.66a1.48,1.48,0,0,0,1,1.4l8.51,2.83h.07A.92.92,0,0,0,12,30a1,1,0,0,0,.44-.11h.07L20,27.06l2.66.89a1,1,0,0,0,.64-1.9L21,25.28V6.39l7,2.33V27.61l-.68-.23a1,1,0,0,0-.64,1.9l1.38.46a1.48,1.48,0,0,0,.46.08,1.53,1.53,0,0,0,.87-.28,1.5,1.5,0,0,0,.61-1.2v-20A1.48,1.48,0,0,0,29,6.94ZM14.68,8.37,12,13.75,9.32,8.37a3,3,0,0,1,.14-2.95A3,3,0,0,1,14.19,5a3.07,3.07,0,0,1,.8,2.3A3.18,3.18,0,0,1,14.68,8.37Z"
              fill="currentColor"
            />
            <path
              d="M12,6h0a1,1,0,1,0,1,1A1,1,0,0,0,12,6Z"
              fill="currentColor"
            />
          </svg>
          <span className="nav-text">Map</span>
        </Link>
        <Link href="/races" className="nav-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="22"
            height="22"
          >
            <circle cx="5" cy="6" r="0.9"></circle>
            <circle cx="5" cy="12" r="0.9"></circle>
            <circle cx="5" cy="18" r="0.9"></circle>
            <line x1="9" y1="6" x2="20" y2="6"></line>
            <line x1="9" y1="12" x2="20" y2="12"></line>
            <line x1="9" y1="18" x2="20" y2="18"></line>
          </svg>
          <span className="nav-text">All Races</span>
        </Link>
      </nav>

      {/* Mobile navigation - slides in from right */}
      <nav className={`nav-mobile ${isMenuOpen ? "open" : ""}`}>
        <Link href="/" className="nav-link" onClick={closeMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="22"
            height="22"
          >
            <path d="M4 10.5L12 4l8 6.5"></path>
            <path d="M6 10.5v8.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5"></path>
            <rect x="10" y="13.5" width="4" height="6" rx="1" ry="1"></rect>
          </svg>
          <span className="nav-text">Home</span>
        </Link>
        <Link href="/calendar" className="nav-link" onClick={closeMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="22"
            height="22"
          >
            <rect x="3.5" y="4" width="17" height="17" rx="2" ry="2"></rect>
            <line x1="16" y1="2.5" x2="16" y2="6"></line>
            <line x1="8" y1="2.5" x2="8" y2="6"></line>
            <line x1="3.5" y1="10" x2="20.5" y2="10"></line>
          </svg>
          <span className="nav-text">Calendar</span>
        </Link>
        {/* Maps link with SVG icon */}
        <Link href="/maps" className="nav-link" aria-label="Maps" onClick={closeMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nav-icon"
            viewBox="0 0 32 32"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="22"
            height="22"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M29,6.94,20.48,4.11h-.06A1,1,0,0,0,20,4a.89.89,0,0,0-.43.11h-.08L16.64,5.19a5,5,0,0,0-1-1.59,5,5,0,0,0-7.9.77,4.87,4.87,0,0,0-.47,1L3.94,4.26A1.47,1.47,0,0,0,2,5.66V7A1,1,0,0,0,4,7V6.39l3,1a5,5,0,0,0,.51,1.87l3.57,7.19a1,1,0,0,0,1.8,0l3.57-7.19A5.06,5.06,0,0,0,17,7.41a1.47,1.47,0,0,0,0-.21l2-.76V25.31l-6,2.25V20a1,1,0,0,0-2,0v7.61L4,25.28V11a1,1,0,0,0-2,0V25.66a1.48,1.48,0,0,0,1,1.4l8.51,2.83h.07A.92.92,0,0,0,12,30a1,1,0,0,0,.44-.11h.07L20,27.06l2.66.89a1,1,0,0,0,.64-1.9L21,25.28V6.39l7,2.33V27.61l-.68-.23a1,1,0,0,0-.64,1.9l1.38.46a1.48,1.48,0,0,0,.46.08,1.53,1.53,0,0,0,.87-.28,1.5,1.5,0,0,0,.61-1.2v-20A1.48,1.48,0,0,0,29,6.94ZM14.68,8.37,12,13.75,9.32,8.37a3,3,0,0,1,.14-2.95A3,3,0,0,1,14.19,5a3.07,3.07,0,0,1,.8,2.3A3.18,3.18,0,0,1,14.68,8.37Z"
              fill="currentColor"
            />
            <path
              d="M12,6h0a1,1,0,1,0,1,1A1,1,0,0,0,12,6Z"
              fill="currentColor"
            />
          </svg>
          <span className="nav-text">Map</span>
        </Link>
        <Link href="/races" className="nav-link" onClick={closeMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="22"
            height="22"
          >
            <circle cx="5" cy="6" r="0.9"></circle>
            <circle cx="5" cy="12" r="0.9"></circle>
            <circle cx="5" cy="18" r="0.9"></circle>
            <line x1="9" y1="6" x2="20" y2="6"></line>
            <line x1="9" y1="12" x2="20" y2="12"></line>
            <line x1="9" y1="18" x2="20" y2="18"></line>
          </svg>
          <span className="nav-text">All Races</span>
        </Link>
      </nav>

      {/* Overlay background when menu is open */}
      {isMenuOpen && (
        <div className="nav-overlay" onClick={closeMenu}></div>
      )}
    </header>
  );
}
