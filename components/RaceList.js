import RaceCard from "./RaceCard";

export default function RaceList({ races }) {
  return (
    <div>
      {races.map(race => (
        <RaceCard key={race.id} race={race} />
      ))}
    </div>
  );
}
