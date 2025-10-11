import React, { useState, useEffect, useMemo } from "react";
import races from "../data/races.json";
import { getRaceId } from "../utils/getRaceId";
import Link from "next/link";


export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // set initially
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const daysInMonth = [];
  const firstDayOfWeek = startOfMonth.getDay(); // 0 = Sunday

  const today = new Date(); // actual today

  // Fill empty days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysInMonth.push(null);
  }

  // Fill the days of the month
  for (let d = 1; d <= endOfMonth.getDate(); d++) {
    daysInMonth.push(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), d)
    );
  }

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const isWeekend = (date) => {
    if (!date) return false;
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const formatTimeShort = (timeStr) => {
    if (!timeStr) return "";

    // Match times with ":00" exactly
    const match = timeStr.match(/^(\d{1,2}):00\s*(AM|PM)$/i);
    if (match) {
      const hour = match[1];
      const ampm = match[2].toUpperCase();
      return `${hour}${ampm}`;
    }

    // If minutes are not :00, return original
    return timeStr.toUpperCase();
  };

  // build a quick lookup map once per dataset
  const dateMap = useMemo(() => {
    const map = Object.create(null);
    if (!Array.isArray(races)) return map;
    for (const r of races) {
      if (!r?.date) continue;
      const key = String(r.date).trim(); // expect "YYYY-MM-DD"
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, []);

  // Helper function to parse time string to minutes since midnight for sorting
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return Infinity; // null/empty times go to the bottom
    
    const input = String(timeStr).trim().toUpperCase();
    // Match "H:MM AM/PM", "HH:MM AM/PM", "H AM/PM", etc.
    const match = input.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    
    if (!match) return Infinity; // unparseable times go to the bottom
    
    let hour = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const period = match[3] ? match[3].toUpperCase() : null;
    
    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0;
    }
    
    return hour * 60 + minutes;
  };

  // Returns all races for a given day, sorted by start time
  const getRacesForDay = (date) => {
    if (!date) return [];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const isoStr = `${year}-${month}-${day}`;
    const racesForDay = dateMap[isoStr] || [];
    
    // Sort races by start time (races without start time go to the bottom)
    return [...racesForDay].sort((a, b) => {
      const timeA = parseTimeToMinutes(a.startTime);
      const timeB = parseTimeToMinutes(b.startTime);
      return timeA - timeB;
    });
  };

  const titleCase = (s) =>
    s
      ? String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase()
      : s;

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  return (
    <div className="month-calendar">
      <div className="calendar-header">
        <button onClick={prevMonth}>&lt;</button>
        <h2>
          {monthName} {year}
        </h2>
        <button onClick={nextMonth}>&gt;</button>
      </div>
      <div className="calendar-weekday">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="calendar-day-name">
            {d}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {daysInMonth.map((day, index) => {
          const isToday =
            day &&
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear() &&
            day.getMonth() === currentDate.getMonth() &&
            day.getFullYear() === currentDate.getFullYear();

          return (
            <div
              key={index}
              className={`calendar-day ${isWeekend(day) ? "weekend" : ""} ${
                isToday ? "today" : ""
              }`}
            >
              {day ? day.getDate() : ""}
              {getRacesForDay(day).map((race) => (
                <div key={getRaceId(race)} className="race-chip">
                  <svg
                    className={`dot-icon ${
                      titleCase(race.terrain) || "default"
                    }`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="6" cy="6" r="6" fill="currentColor" />
                  </svg>
                  <div className="race-text">
                    {isMobile ? (
                      <Link
                        href={`/race/${encodeURIComponent(getRaceId(race))}`}
                        className="race-name"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {race.nickName}
                      </Link>
                    ) : (
                      <>
                        <span className="race-time">
                          {formatTimeShort(race.startTime)}
                        </span>{" "}
                        <Link
                          href={`/race/${encodeURIComponent(getRaceId(race))}`}
                          className="race-name"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {race.nickName}
                        </Link>{" "}
                        -{" "}
                        <span className="race-distance">{race.distance}k</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
