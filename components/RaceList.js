import RaceCard from "./RaceCard";
import UpcomingRaceCard from "./UpcomingRaceCard";
import RegistrationCarousel from "./RegistrationCarousel";

export default function RaceList({ races, type = "all" }) {
  return (
    <div>
      {type === "upcomingRaces" && races.length > 0
        ? races.map((race) => <UpcomingRaceCard key={race.id} race={race} />)
        : type === "upcomingRegistrations" && races.length > 0
        ? <RegistrationCarousel races={races} />
        : races.map((race) => <RaceCard key={race.id} race={race} />)}
    </div>
  );
}
