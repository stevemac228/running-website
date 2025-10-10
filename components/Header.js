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
          <img src="/icons/home.svg" alt="Home" className="nav-icon" />
          <span className="nav-text">Home</span>
        </Link>
        <Link href="/calendar" className="nav-link">
          <img src="/icons/calendar.svg" alt="Calendar" className="nav-icon" />
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
          <img src="/icons/list.svg" alt="All Races" className="nav-icon" />
          <span className="nav-text">All Races</span>
        </Link>
      </nav>
    </header>
  );
}
