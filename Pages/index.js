import Header from "../components/Header";
import RaceList from "../components/RaceList";
import racesData from "../data/races.json";

export default function Home() {
  // Show upcoming races (next 30 days)
  const today = new Date();
  const upcomingRaces = racesData.filter(race => new Date(race.raceDate) >= today);

  return (
    <div>
      <Header />
      <main className="p-4">
        <h2 className="text-xl font-bold mb-4">Upcoming Races</h2>
        <RaceList races={upcomingRaces} />
      </main>
    </div>
  );
}
