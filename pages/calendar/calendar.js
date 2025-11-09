import React from "react";
import Calendar from "../../components/Calendar/Calendar";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

export default function CalendarPage() {
  return (
    <div>
      <Header />
      <main>
        <div className="calendar-page">
        <Calendar />
        </div>
      </main>
      <Footer />
    </div>
  );
}