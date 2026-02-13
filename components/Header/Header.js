import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import SearchFilter from "../SearchFilter/SearchFilter";

export default function Header() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    function onDocClick(e) {
      if (!menuOpen) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      if (toggleRef.current && toggleRef.current.contains(e.target)) return;
      setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("click", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
        {/* Mobile hamburger placed to the left so it becomes top-left on small screens */}
        <button
          ref={toggleRef}
          className="nav-menu-toggle"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((s) => !s); }}
        >
          {/* Inline SVG hamburger (three horizontal strokes). Kept simple and static. */}
          <svg className="nav-menu-icon" width="24" height="18" viewBox="0 0 24 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <line x1="2" y1="3" x2="22" y2="3" />
            <line x1="2" y1="9" x2="22" y2="9" />
            <line x1="2" y1="15" x2="22" y2="15" />
          </svg>
        </button>

        <div className="header-tools">
          {/* Search bar only shown on desktop, not mobile */}
        </div>

        {/* Desktop navigation links (hidden on mobile) */}
        {!isMobile && (
          <nav className="header-nav-desktop">
            <Link href="/races/races" className="nav-link">All Races</Link>
            <Link href="/calendar/calendar" className="nav-link">Calendar</Link>
            <Link href="/maps/maps" className="nav-link">Map</Link>
            {/* <Link href="/upcoming-races/upcoming-races" className="nav-link">Upcoming Races</Link> */}
            <Link href="/registrations/registrations" className="nav-link">Registrations</Link>
            {/* <Link href="/pdf-export/pdf-export" className="nav-link">PDF Export</Link> */}
          </nav>
        )}
      </div>

      {/* Mobile menu drawer (only visible on small screens via CSS) */}
      <div
        ref={menuRef}
        className={`nav-mobile-drawer ${menuOpen ? "open" : ""}`}
        role="menu"
        aria-hidden={!menuOpen}
      >
        <nav className="nav-mobile-links">
          <Link href="/" className="nav-strip-link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/calendar/calendar" className="nav-strip-link" onClick={() => { setMenuOpen(false); if (isMobile) router.push({ pathname: '/calendar/calendar', query: { focus: 'today' } }); }}>Calendar</Link>
          <Link href="/maps/maps" className="nav-strip-link" onClick={() => setMenuOpen(false)}>Map</Link>
          <Link href="/races/races" className="nav-strip-link" onClick={() => setMenuOpen(false)}>All Races</Link>
          {/* <Link href="/upcoming-races/upcoming-races" className="nav-strip-link" onClick={() => setMenuOpen(false)}>Upcoming Races</Link> */}
          <Link href="/registrations/registrations" className="nav-strip-link" onClick={() => setMenuOpen(false)}>Registrations</Link>
          {/* <Link href="/pdf-export/pdf-export" className="nav-strip-link" onClick={() => setMenuOpen(false)}>PDF Export</Link> */}
        </nav>
      </div>
    </header>
  );
}
