import Header from "../components/Header";
import RaceList from "../components/RaceList";
import races from "../data/races.json";

export default function AllRaces() {
  return (
    <div>
      <Header />
      <main style={{ padding: "1rem" }}>
        <h1>All Races</h1>
        <RaceList races={races} />
      </main>
    </div>
  );
}
