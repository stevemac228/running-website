import Link from "next/link";
import { useCallback } from "react";
import SearchFilter from "../SearchFilter/SearchFilter";

export default function Header() {
  const handleHeaderSearch = useCallback(() => {}, []);

  return (
    <header>
      <div className="header-top">
          <img
            src="/icons/newPufin-Kittl(1).svg"
            alt="Puffin Mascot"
            className="puffin-icon"
            fill="none"
          />
          <h1>Run NL</h1>
        <div className="header-tools">
          <div className="header-search">
            <SearchFilter onSearch={handleHeaderSearch} />
          </div>
        </div>
      </div>

      <div className="nav-strip">
        <nav className="nav-strip-links">
          <Link href="/" className="nav-strip-link">
            Home
          </Link>
          <Link href="/calendar/calendar" className="nav-strip-link">
            Calendar
          </Link>
          <Link href="/maps/maps" className="nav-strip-link">
            Map
          </Link>
          <Link href="/races/races" className="nav-strip-link">
            All Races
          </Link>
          <Link href="/upcoming-races/upcoming-races" className="nav-strip-link">
            Upcoming Races
          </Link>
          <Link href="/registrations/registrations" className="nav-strip-link">
            Registrations
          </Link>
        </nav>
      </div>
    </header>
  );
}
