import Header from "../components/Header";
import RaceList from "../components/RaceList";
import racesData from "../data/races.json";

export default function AllRaces() {
  return (
    <div>
      <Header />
      <main className="p-4">
        <h2 className="text-xl font-bold mb-4">All Races</h2>
        <RaceList races={racesData} />
      </main>
    </div>
  );
}
