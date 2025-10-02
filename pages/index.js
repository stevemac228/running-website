import Header from "../components/Header";
import RaceList from "../components/RaceList";
import races from "../data/races.json";

function parseUSDate(dateStr) {
  // expects MM/DD/YYYY
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

export default function Home() {
  const today = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(today.getMonth() + 3);

  const upcomingRaces = races
    .filter(r => {
      const raceDate = parseUSDate(r.date);
      return raceDate >= today && raceDate <= threeMonthsFromNow;
    })
    .sort((a, b) => parseUSDate(a.date) - parseUSDate(b.date));

  const upcomingRegistrations = races
    .filter(r => {
      const raceRegDate = parseUSDate(r.registrationStart);
      return raceRegDate >= today && raceRegDate <= threeMonthsFromNow;
    })
    .sort((a, b) => parseUSDate(a.date) - parseUSDate(b.date));

  return (
    <div>
      <Header />
      <main class = "homepage" >
        <div class = "upcomingRaces">
          <h1>Upcoming Races</h1>
          <RaceList races={upcomingRaces} type="upcoming" />
        </div>
        <div class = "upcomingRegistrations">
          <h1>Upcoming Registrations</h1>
          <RaceList races={upcomingRegistrations} type="upcoming" />
        </div>
      </main>
    </div>
  );
}
