import Header from "../components/Header";
import RaceList from "../components/RaceList";
import races from "../data/races.json";

export default function Home() {
  const upcomingRaces = races.filter(r => new Date(r.date) >= new Date());

  return (
    <div>
      <Header />
      <main style={{ padding: "1rem" }}>
        <h1>Upcoming Races</h1>
        <RaceList races={upcomingRaces} type="upcoming"/>
      </main>
    </div>
  );
}
