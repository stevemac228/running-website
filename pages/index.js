import Head from "next/head";
import races from "../data/races.json";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import SearchFilter from "../components/SearchFilter/SearchFilter";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isDesktop, setIsDesktop] = useState(false);
  const raceCount = races.length;

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <Head>
        <title>Run NL | Newfoundland Running Races</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
        />
        <meta
          name="description"
          content="Discover upcoming Newfoundland and Labrador running events with dates, distances, and registration details."
        />
        <link rel="canonical" href="https://www.runnl.ca/" />
        <meta property="og:title" content="Run NL | Newfoundland Running Races" />
        <meta
          property="og:description"
          content="Browse road, trail, and fun run events happening soon across Newfoundland and Labrador."
        />
        <meta property="og:url" content="https://www.runnl.ca/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Website",
              name: "Run NL",
              url: "https://www.runnl.ca/",
              description:
                "Discover upcoming Newfoundland and Labrador running events with dates, distances, and registration details.",
            }),
          }}
        />
      </Head>
      <Header />
      <main className="homepage">
        <div className="hero-section">
          <span className="hero-tagline">Newfoundland & Labrador</span>
          <h1 className="hero-title">
            Find Your Next <span className="hero-title-highlight">Race</span>
          </h1>
          <p className="hero-subtitle">
            Discover road races, trail runs, and fun runs across Newfoundland and Labrador. 
            All the details you need in one place.
          </p>
          
          <div className="hero-search-container">
            <SearchFilter onSearch={() => {}} />
          </div>
          
          <div className="hero-actions">
            <Link href="/races/races" className="hero-action-btn">
              Browse All Races
            </Link>
            <Link href="/calendar/calendar" className="hero-action-btn secondary">
              View Calendar
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">{raceCount}+</div>
              <div className="hero-stat-label">Races</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">5K–Ultra</div>
              <div className="hero-stat-label">Distances</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">All NL</div>
              <div className="hero-stat-label">Locations</div>
            </div>
          </div>
        </div>
        
        <img
          src="/images/marathon-1236351.png"
          alt="homepage running graphic"
          className="home-image"
        />
      </main>
      <Footer />
    </div>
  );
}
