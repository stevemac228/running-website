import React, { useState } from "react";

export default function DateRangeSelector({ onChange, isOpen, onToggle }) {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper: get all days for the current month including previous month days
  const getDaysInMonth = (month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const days = [];
    
    // Get first day of the month
    const firstDay = new Date(year, monthIndex, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Add previous month's days if month doesn't start on Sunday
    if (firstDayOfWeek > 0) {
      const prevMonthEnd = new Date(year, monthIndex, 0);
      const prevMonthLastDay = prevMonthEnd.getDate();
      const startDay = prevMonthLastDay - firstDayOfWeek + 1;
      
      for (let d = startDay; d <= prevMonthLastDay; d++) {
        days.push(new Date(year, monthIndex - 1, d));
      }
    }
    
    // Add current month's days
    const lastDay = new Date(year, monthIndex + 1, 0);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, monthIndex, i));
    }
    return { days, prevMonthDaysCount: firstDayOfWeek };
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

  const { days: daysInMonth, prevMonthDaysCount } = getDaysInMonth(currentMonth);

  const formatDisplay = () => {
    const formatDayMonth = (date) =>
      date
        ? `${date.toLocaleString("default", {
            month: "short",
          })} ${date.getDate()}`
        : "";

    if (start && end)
      return ` (${formatDayMonth(start)} – ${formatDayMonth(end)})`;
    if (start) return ` (${formatDayMonth(start)} –)`;
    return "";
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setStart(null);
    setEnd(null);
    onChange({ start: null, end: null });
  };

  return (
    <>
      <button 
        className="filter-dropdown"
        onClick={onToggle}
      >
        Dates{formatDisplay()}<span className="mobile-only-inline"> ▾</span>
      </button>
      {isOpen && (
        <div className="dropdown-menu date-dropdown-menu">
          <div className="date-range-selector-header">
            <button onClick={prevMonth} type="button">&lt;</button>
            <span>
              {currentMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button onClick={nextMonth} type="button">&gt;</button>
          </div>

          <div className="date-range-selector-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="date-range-selector-weekday">
                {d}
              </div>
            ))}
          </div>

          <div className="date-range-selector-calendar-grid">
            {daysInMonth.map((date, i) => {
              const isPrevMonth = i < prevMonthDaysCount;
              return (
                <div
                  key={i}
                  className={`date-range-selector-calendar-day 
            ${isSelected(date) ? "selected" : ""}
            ${isInRange(date) ? "in-range" : ""}
            ${isPrevMonth ? "prev-month" : ""}`}
                  onClick={() => handleDateClick(date)}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
          
          {(start || end) && (
            <div style={{ padding: '0.5rem', borderTop: '1px solid #ddd', textAlign: 'center' }}>
              <button 
                onClick={handleClear}
                style={{
                  padding: '0.4rem 0.8rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Clear Dates
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
