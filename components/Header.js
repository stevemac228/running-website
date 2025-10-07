import Link from "next/link";

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
        <Link href="/races" className="nav-link">
          <img src="/icons/list.svg" alt="All Races" className="nav-icon" />
          <span className="nav-text">All Races</span>
        </Link>
      </nav>
    </header>
  );
}
