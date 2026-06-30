import { CalendarDays, Flame, StickyNote as NotesIcon } from 'lucide-react';
import { CATEGORY_KEYS, getCategory } from '../categories.js';
import { monthPrefix, MONTH_NAMES } from '../utils/calendar.js';

const round1 = (n) => Math.round(n * 10) / 10;

const TILTS = ['-1.4deg', '1deg', '-0.8deg', '1.3deg', '-1.1deg', '0.7deg', '-1.2deg', '1.1deg'];

/**
 * Month-scoped roll-ups derived purely from the store (writes nothing):
 * per-category counts, numeric totals (miles/minutes run, Leetcode by
 * difficulty), active days, and the longest active-day streak.
 */
export default function ProgressSummary({ store, year, month }) {
  const prefix = monthPrefix(year, month);
  const dayKeys = Object.keys(store.days).filter((k) => k.startsWith(prefix));

  let totalNotes = 0;
  let runDistance = 0;
  let runDuration = 0;
  const perCategory = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0]));
  const leetByDiff = { Easy: 0, Medium: 0, Hard: 0 };
  const activeDays = new Set();

  dayKeys.forEach((key) => {
    const notes = store.days[key]?.notes || [];
    if (notes.length) activeDays.add(key);
    notes.forEach((n) => {
      totalNotes += 1;
      perCategory[n.category] = (perCategory[n.category] || 0) + 1;
      if (n.category === 'running') {
        const d = parseFloat(n.fields?.distance);
        const t = parseFloat(n.fields?.duration);
        if (!Number.isNaN(d)) runDistance += d;
        if (!Number.isNaN(t)) runDuration += t;
      }
      if (n.category === 'leetcode') {
        const diff = n.fields?.difficulty;
        if (diff in leetByDiff) leetByDiff[diff] += 1;
      }
    });
  });

  // Longest run of consecutive calendar days (within the month) that have notes.
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let longestStreak = 0;
  let current = 0;
  for (let d = 1; d <= daysInMonth; d += 1) {
    const key = `${prefix}-${String(d).padStart(2, '0')}`;
    if (activeDays.has(key)) {
      current += 1;
      longestStreak = Math.max(longestStreak, current);
    } else {
      current = 0;
    }
  }

  const title = `${MONTH_NAMES[month]} ${year} — Progress`;

  if (totalNotes === 0) {
    return (
      <div className="summary-panel">
        <div className="summary-title">
          <NotesIcon size={18} /> {title}
        </div>
        <p className="summary-empty">
          No notes yet this month — pin something and your progress will roll up here.
        </p>
      </div>
    );
  }

  const detailFor = (key) => {
    if (key === 'running') {
      const parts = [];
      if (runDistance > 0) parts.push(`${round1(runDistance)} mi`);
      if (runDuration > 0) parts.push(`${Math.round(runDuration)} min`);
      return parts.join(' • ') || null;
    }
    if (key === 'leetcode') {
      return `${leetByDiff.Easy}E · ${leetByDiff.Medium}M · ${leetByDiff.Hard}H`;
    }
    return null;
  };

  // Headline cards first, then one card per category present.
  const cards = [
    { key: 'active', value: activeDays.size, label: 'Active Days', icon: CalendarDays, color: '#fff' },
    {
      key: 'streak',
      value: longestStreak,
      label: 'Longest Streak',
      sub: longestStreak === 1 ? 'day' : 'days',
      icon: Flame,
      color: '#ffe3bf',
    },
    { key: 'total', value: totalNotes, label: 'Notes Pinned', icon: NotesIcon, color: '#fff' },
  ];

  CATEGORY_KEYS.forEach((key) => {
    if (perCategory[key] > 0) {
      const config = getCategory(key);
      cards.push({
        key,
        value: perCategory[key],
        label: config.label,
        sub: detailFor(key),
        icon: config.icon,
        color: config.color,
      });
    }
  });

  return (
    <div className="summary-panel">
      <div className="summary-title">
        <NotesIcon size={18} /> {title}
      </div>
      <div className="summary-grid">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              className="stat-card"
              key={c.key}
              style={{ '--card-color': c.color, '--card-tilt': TILTS[i % TILTS.length] }}
            >
              {Icon && <Icon className="stat-icon" size={18} />}
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
              {c.sub && <div className="stat-sub">{c.sub}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
