import Header from "../components/Header";
import RaceList from "../components/RaceList";
import races from "../data/races.json";

function parseUSDate(dateStr) {
  // expects MM/DD/YYYY
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

const today = new Date();
const threeMonthsFromNow = new Date();
threeMonthsFromNow.setMonth(today.getMonth() + 3);

const upcomingRaces = races
  .filter(r => {
    const raceDate = parseUSDate(r.date);
    return raceDate >= today && raceDate <= threeMonthsFromNow;
  })
  .sort((a, b) => parseUSDate(a.date) - parseUSDate(b.date));


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
