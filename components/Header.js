import Link from "next/link";
import { useCallback } from "react";
import ThemeToggle from "./ThemeToggle";
import SearchFilter from "./SearchFilter";

export default function Header() {
  const handleHeaderSearch = useCallback(() => {}, []);

  return (
    <header>
      <div className="header-top">
        <div className="nav_left">
          <img
            src="/icons/newPufin-Kittl(1).svg"
            alt="Puffin Mascot"
            className="puffin-icon"
            fill="none"
          />
          <h1>Run NL</h1>
        </div>
        <div className="header-tools">
          <div className="header-search">
            <SearchFilter onSearch={handleHeaderSearch} />
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="nav-strip">
        <nav className="nav-strip-links">
          <Link href="/" className="nav-strip-link">
            Home
          </Link>
          <Link href="/calendar" className="nav-strip-link">
            Calendar
          </Link>
          <Link href="/maps" className="nav-strip-link">
            Map
          </Link>
          <Link href="/races" className="nav-strip-link">
            All Races
          </Link>
          <Link href="/upcoming-races" className="nav-strip-link">
            Upcoming Races
          </Link>
          <Link href="/registrations" className="nav-strip-link">
            Registrations
          </Link>
        </nav>
      </div>
    </header>
  );
}
