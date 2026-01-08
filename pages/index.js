import Head from "next/head";
import races from "../data/races.json";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import RaceList from "../components/RaceList/RaceList";

export default function Home() {

  return (
    <div>
      <Head>
        <title>Run NL | Newfoundland Running Races</title>
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
          <img
            src="/images/marathon-1236351.png"
            alt="homepage running graphic"
            className="home-image"
            fill="none"
          />
          <div className="home-text-container">
            <p className="home-text">
              Welcome to Run NL, your go-to source for discovering running events across Newfoundland and Labrador.<br></br>
              Browse upcoming road and trail races as well as fun runs with detailed information on dates, distances and locations<br></br>
              <i>Please use official race websites for the most accurate and up-to-date information.</i><br></br>
              If anyting is missing or incorrect, please <a href="mailto:steven.macdonald228@gmail.com">let me know</a>!<br></br>
            </p>
          </div>
          {/* Blob SVG
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="home-blob">
            <path fill="#48ff00ff" d="M34.2,-56.1C48.1,-51.2,65.6,-49.6,74.4,-40.8C83.2,-32,83.2,-16,78.3,-2.8C73.4,10.4,63.7,20.8,55.5,30.6C47.3,40.4,40.7,49.7,31.7,55.5C22.7,61.3,11.4,63.5,0,63.6C-11.5,63.7,-22.9,61.6,-32.4,56.1C-41.8,50.6,-49.3,41.7,-58.8,31.8C-68.3,21.8,-79.9,10.9,-82.9,-1.8C-86,-14.5,-80.5,-28.9,-72.2,-40.9C-63.9,-52.9,-52.7,-62.5,-40.2,-68.1C-27.7,-73.8,-13.9,-75.6,-1.8,-72.4C10.2,-69.2,20.3,-61,34.2,-56.1Z" transform="translate(100 100)" />
          </svg>
          */}
      </main>
      <Footer />
    </div>
  );
}
