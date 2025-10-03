import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header>
      <div class = "nav_left">
        <img src="/icons/newPufin-Kittl(1).svg" alt="Puffin Mascot" className="puffin-icon" fill="none"/>
        <h1>Run NL</h1>
      </div>
      <div>
        <nav>
          <ul class = "nav_links">
            <Link href="/">Home</Link>
            <Link href="/races">All Races</Link>
          </ul>
        </nav>
      </div>
      {/* <ThemeToggle />*/}
    </header>
  );
}
