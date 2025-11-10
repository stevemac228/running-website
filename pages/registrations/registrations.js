import Head from "next/head";
import races from "../../data/races.json";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import RaceList from "../../components/RaceList/RaceList";

export default function RegistrationsPage() {
  const today = new Date();
  const threeMonthsFromNow = new Date(today);
  threeMonthsFromNow.setMonth(today.getMonth() + 3);

  const currentRegistrations = races
    .filter((race) => {
      if (!race.registrationStart) return false;
      const regStartDate = new Date(race.registrationStart);
      const regEndDate = race.registrationDeadline
        ? new Date(race.registrationDeadline)
        : null;

      if (isNaN(regStartDate)) return false;
      if (regEndDate && isNaN(regEndDate)) return false;

      if (regEndDate) {
        return today >= regStartDate && today <= regEndDate;
      }

      return today >= regStartDate;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingRegistrations = races
    .filter((race) => {
      if (!race.registrationStart) return false;
      const regStartDate = new Date(race.registrationStart);

      if (isNaN(regStartDate)) return false;
      return regStartDate > today && regStartDate <= threeMonthsFromNow;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      <Head>
        <title>Registrations | Run NL</title>
        <meta
          name="description"
          content="Browse Newfoundland and Labrador races that currently have open registration periods."
        />
        <link rel="canonical" href="https://www.runnl.ca/registrations" />
      </Head>
      <Header />
      <main className="page-main-padding">
        <h1>Open Registrations</h1>
        <RaceList races={currentRegistrations} type="upcomingRegistrations" />
        <h2>Upcoming Registrations</h2>
        <RaceList races={upcomingRegistrations} type="upcomingRegistrations" />
      </main>
      <Footer />
    </div>
  );
}

