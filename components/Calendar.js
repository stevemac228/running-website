import React, { useState } from "react";
import races from "../data/races";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const daysInMonth = [];
  const firstDayOfWeek = startOfMonth.getDay(); // 0 = Sunday

  // Fill empty days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysInMonth.push(null);
  }

  // Fill the days of the month
  for (let d = 1; d <= endOfMonth.getDate(); d++) {
    daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

const isRaceDay = (date) => {
  if (!date) return false;

  // Convert date to MM/DD/YYYY
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const formattedDate = `${month}/${day}/${year}`;

  // Check if any race matches this date
  return races.some((race) => race.date === formattedDate);
};

// Returns all races for a given day
const getRacesForDay = (date) => {
  if (!date || !races) return [];
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const formattedDate = `${month}/${day}/${year}`;
  return races.filter((race) => race.date === formattedDate);
};

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  return (
    <div className="month-calendar">
      <div className="calendar-header">
        <button onClick={prevMonth}>&lt;</button>
        <h2>{monthName} {year}</h2>
        <button onClick={nextMonth}>&gt;</button>
      </div>
      <div className="calendar-grid">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="calendar-day-name">{d}</div>
        ))}
        {daysInMonth.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${isRaceDay(day) ? "race-day" : ""}`}
          >
            {day ? day.getDate() : ""}
            {getRacesForDay(day).map((race) => (
            <div key={race.id} className="race-chip">
                {race.name}
            </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
