import { useRouter } from "next/router";
import Header from "../../components/Header";
import racesData from "../../data/races.json";

export default function RaceDetail() {
  const router = useRouter();
  const { id } = router.query;
  const race = racesData.find(r => r.id === id);

  if (!race) return <p>Loading...</p>;

  return (
    <div>
      <Header />
      <main className="p-4">
        <h2 className="text-2xl font-bold mb-2">{race.name}</h2>
        <p>{race.city}</p>
        <p>Distance: {race.distance}</p>
        <p>Type: {race.Terrain}</p>
        <p>Race Date: {race.raceDate}</p>
        <p>Registration: {race.registrationStart} → {race.registrationEnd}</p>
        <a href={race.website} target="_blank" className="text-blue-500 underline">Official Website</a>
      </main>
    </div>
  );
}