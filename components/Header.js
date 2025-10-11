import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
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
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
          >
            <path d="M20.5 3l-5 2-5-2-6 2v15l6-2 5 2 6-2V3zM9 5.2l4 1.6v11.9l-4-1.6V5.2zM7 5.9v11.8L3.5 18V6.2L7 5.9zM21 17.8l-3.5 1.2V7.1L21 5.9v11.9z" />
          </svg>
          <span className="nav-text">Maps</span>
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
    </header>
  );
}
