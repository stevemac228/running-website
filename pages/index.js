import Head from "next/head";
import races from "../data/races.json";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RaceList from "../components/RaceList";

export default function Home() {
  const today = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(today.getMonth() + 3);

  // Upcoming races
  const upcomingRaces = races
    .filter(r => {
      const raceDate = new Date(r.date);
      return raceDate >= today && raceDate <= threeMonthsFromNow;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Upcoming registrations
  const upcomingRegistrations = races
    .filter(r => {
      if (!r.registrationStart) return false; // skip if no start date

      const regStartDate = new Date(r.registrationStart);
      const regEndDate = r.registrationDeadline
        ? new Date(r.registrationDeadline)
        : null;

      if (isNaN(regStartDate)) return false;
      if (regEndDate && isNaN(regEndDate)) return false;

      // Include if today is within registration start → registration end
      if (regEndDate) {
        return today >= regStartDate && today <= regEndDate;
      } else {
        // If no end date, just check start date is in the future
        return regStartDate >= today;
      }
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

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
        <div className="upcomingRaces">
          <h1>Upcoming Races</h1>
          <RaceList races={upcomingRaces} type="upcomingRaces" />
        </div>
        <div className="upcomingRegistrations">
          <h1>Current Registrations</h1>
          <RaceList races={upcomingRegistrations} type="upcomingRegistrations" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
