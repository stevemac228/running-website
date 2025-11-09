import Head from "next/head";
import races from "../../data/races.json";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import RaceList from "../../components/RaceList/RaceList";

export default function UpcomingRacesPage() {
  const today = new Date();
  const threeMonthsFromNow = new Date(today);
  threeMonthsFromNow.setMonth(today.getMonth() + 3);

  const upcomingRaces = races
    .filter((race) => {
      const raceDate = new Date(race.date);
      return raceDate >= today && raceDate <= threeMonthsFromNow;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      <Head>
        <title>Upcoming Races | Run NL</title>
        <meta
          name="description"
          content="See all Newfoundland and Labrador races happening in the next three months."
        />
        <link rel="canonical" href="https://www.runnl.ca/upcoming-races" />
      </Head>
      <Header />
      <main className="page-main-padding">
        <h1>Upcoming Races</h1>
        <RaceList races={upcomingRaces} type="upcomingRaces" />
      </main>
      <Footer />
    </div>
  );
}
