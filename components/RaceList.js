import RaceCard from "./RaceCard";
import UpcomingRaceCard from "./UpcomingRaceCard";

export default function RaceList({ races, type = "all" }) {
  return (
    <div>
      {races.map(race => 
        type === "upcoming" ? (
          <UpcomingRaceCard key={race.id} race={race} />
        ) : (
          <RaceCard key={race.id} race={race} />
        )
      )}
    </div>
  );
}