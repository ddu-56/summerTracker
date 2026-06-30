import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategory } from '../categories.js';
import { getMonthMatrix, MONTH_NAMES, WEEKDAY_LABELS } from '../utils/calendar.js';

/**
 * Standard 7-column month grid. Each cell shows the day number, a today
 * highlight, a note count, and one color-coded dot per category present that
 * day. Dots/colors are looked up from the CATEGORIES config — nothing here is
 * hardcoded per category.
 */
export default function CalendarView({
  year,
  month,
  days,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onToday,
}) {
  const cells = getMonthMatrix(year, month);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="btn btn-icon" onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
        </div>
        <h2 className="calendar-title">
          {MONTH_NAMES[month]} <span className="year">{year}</span>
        </h2>
        <div className="calendar-nav">
          <button className="btn btn-icon" onClick={onNextMonth} aria-label="Next month">
            <ChevronRight size={20} />
          </button>
          <button className="btn btn-ghost today-btn" onClick={onToday}>
            Today
          </button>
        </div>
      </div>

      <div className="weekday-row">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell) => {
          const notes = days[cell.iso]?.notes || [];
          const uniqueCategories = [...new Set(notes.map((n) => n.category))];
          return (
            <button
              key={cell.iso}
              className={[
                'day-cell',
                cell.inMonth ? '' : 'is-outside',
                cell.isToday ? 'is-today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDay(cell.iso)}
            >
              <span className="day-number">{cell.day}</span>
              {notes.length > 0 && <span className="day-note-count">{notes.length}</span>}
              <div className="day-dots">
                {uniqueCategories.map((cat) => {
                  const config = getCategory(cat);
                  return (
                    <span
                      key={cat}
                      className="day-dot"
                      title={config.label}
                      style={{ background: config.color }}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
