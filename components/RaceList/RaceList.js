import RaceCard from "../RaceCard/RaceCard";
import UpcomingRaceCard from "../UpcomingRaceCard/UpcomingRaceCard";
import UpcomingRegistrationCard from "../UpcomingRegistrationCard/UpcomingRegistrationCard";

export default function RaceList({ races, type = "all" }) {
  return (
    <div>
      {type === "upcomingRaces" && races.length > 0
        ? races.map((race) => <UpcomingRaceCard key={race.id} race={race} />)
        : type === "upcomingRegistrations" && races.length > 0
        ? races.map((race) => (
            <UpcomingRegistrationCard key={race.id} race={race} />
          ))
        : races.map((race) => <RaceCard key={race.id} race={race} />)}
    </div>
  );
}
