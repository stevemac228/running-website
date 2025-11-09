import React, { useState, useRef, useEffect } from "react";

export default function DateRangeSelector({ onChange }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef]);

  // Helper: get all days for the current month
  const getDaysInMonth = (month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const days = [];
    const lastDay = new Date(year, monthIndex + 1, 0);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, monthIndex, i));
    }
    return days;
  };

  const handleDateClick = (date) => {
    if (!start || (start && end)) {
      setStart(date);
      setEnd(null);
      onChange({ start: date, end: null });
    } else {
      if (date < start) {
        setEnd(start);
        setStart(date);
        onChange({ start: date, end: start });
      } else {
        setEnd(date);
        onChange({ start, end: date });
      }
    }
  };

  const isInRange = (date) => start && end && date > start && date < end;
  const isSelected = (date) =>
    (start && date.getTime() === start.getTime()) ||
    (end && date.getTime() === end.getTime());

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  const daysInMonth = getDaysInMonth(currentMonth);

  const formatDisplay = () => {
    const formatDayMonth = (date) =>
      date
        ? `${date.toLocaleString("default", {
            month: "short",
          })} ${date.getDate()}`
        : "";

    if (start && end)
      return `${formatDayMonth(start)} – ${formatDayMonth(end)}`;
    if (start) return `${formatDayMonth(start)} –`;
    return "Select Dates";
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setStart(null);
    setEnd(null);
    onChange({ start: null, end: null });
  };

  return (
    <div className="date-range-relative">
      <div className="date-range-selector-wrapper">
        <button
          className="date-range-selector-btn"
          onClick={() => setShowCalendar(!showCalendar)}
        >
          {formatDisplay()}
        </button>
        {(start || end) && (
          <button className="date-clear-btn" onClick={handleClear}>
            ×
          </button>
        )}
      </div>

      {showCalendar && (
        <div className="date-range-selector-modal" ref={modalRef}>
          <div className="date-range-selector-header">
            <button onClick={prevMonth}>&lt;</button>
            <span>
              {currentMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button onClick={nextMonth}>&gt;</button>
          </div>

          <div className="date-range-selector-calendar-grid">
            {daysInMonth.map((date, i) => (
              <div
                key={i}
                className={`date-range-selector-calendar-day 
            ${isSelected(date) ? "selected" : ""}
            ${isInRange(date) ? "in-range" : ""}`}
                onClick={() => handleDateClick(date)}
              >
                {date.getDate()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
