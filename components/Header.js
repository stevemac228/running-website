import Link from "next/link";

export default function Header() {
  return (
    <header>
      <h1>Run NL</h1>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/races">All Races</Link>
      </nav>
    </header>
  );
}
