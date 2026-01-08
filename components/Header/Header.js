import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import SearchFilter from "../SearchFilter/SearchFilter";

export default function Header() {
  const handleHeaderSearch = useCallback(() => {}, []);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header>
      <div className="header-top">
        <Link href="/" className="header-text">
          <img
            src="/icons/newPufin-Kittl(1).svg"
            alt="Puffin Mascot"
            className="puffin-icon"
            fill="none"
          />
          <h1>Run NL</h1>
        </Link>
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
          <Link href="/calendar/calendar" className="nav-strip-link" onClick={(e) => {
            // When on mobile, navigate to calendar with a query param so the
            // page can center today's date in the list. Use router.push to
            // ensure we can add the query param without a full page reload.
            if (isMobile) {
              e.preventDefault();
              router.push({ pathname: '/calendar/calendar', query: { focus: 'today' } });
            }
          }}>
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
