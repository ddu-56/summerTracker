# Summer Progress Tracker - Design Plan & Implementation Guide

This document is a comprehensive design specification and implementation blueprint for building **Summer Progress Tracker**. It is formatted for direct consumption by a coding assistant to build the entire app from scratch.

---

## 1. Project Overview & Core Features

Summer Progress Tracker is a personal web application that displays a calendar month grid. Each calendar day is interactive. Clicking a day expands it into a whimsical "corkboard" bulletin board. On this board, users can stick post-it notes to track different activities.

### Core Features
*   **Calendar View**: Displays a monthly grid. Each day cell shows mini indicators (color-coded dots or icons) representing active tracking categories for that day.
*   **Interactive Bulletin Board**: Clicking a day triggers a zoom-in animation, loading the day's board.
*   **Hanging Pinned Notes**: Each post-it note hangs from a pushpin at its top-center and **gently sways** as if suspended on the board. Notes can be created, edited/deleted, and **dragged** to reposition their pin (`x`, `y` coordinates); the note continues to hang and sway from wherever it is pinned. Each note carries a small random base tilt and swing delay so the board feels lively rather than uniform.
*   **Dynamic Dropdown Forms**: When creating a note, a dropdown selector lets the user choose the activity type, which dynamically loads the corresponding input fields:
    *   **Running**: Inputs for Distance (miles/km) and Duration (mins).
    *   **Leetcode**: Dropdown for Difficulty (Easy, Medium, Hard) and text input for Problem Name/URL.
    *   **Volleyball/Sports**: Inputs for Location and Notes.
    *   **Workout**: Textarea list for Exercises/Sets.
    *   **Project & Research**: Text inputs for Task/Goal completed.
    *   **General Note (Default)**: Standard text area.
*   **Extensible Categories**: All activity types live in a single config object, so new categories ("anything else") can be added in one place.
*   **Progress Summary**: A toggleable panel showing roll-up stats for the visible month — per-category counts, totals (e.g. miles run, problems solved), and an active-day streak — so the app actually visualizes *progress*, not just daily entries.
*   **Whimsical Style**: Playful animations (hanging/swaying notes, hover wiggles, tactile pushpins, hand-drawn fonts).
*   **Local Storage Sync**: All state is fully serialized and stored in browser `localStorage`.
*   **Export / Import (Backup)**: Buttons to download the entire dataset as a `.json` file and to re-import one, so your summer of data survives a cleared browser or a move to another machine.

---

## 2. Tech Stack & Setup

*   **Framework**: React (using Vite as the build tool for fast hot-module replacement and clean component structures).
*   **Styling**: Vanilla CSS (modern Custom Properties, Flexbox/Grid, transitions, and keyframe animations).
*   **Icons**: [Lucide React](https://lucide.dev/) (simple, clean vector icons for sports, running, coding, etc.).
*   **Typography**: Friendly Google Fonts.
    *   Primary: `Fredoka` or `Quicksand` (rounded, readable).
    *   Handwriting (for notes): `Playpen Sans` or `Architects Daughter`.

---

## 3. Design Tokens & Styling (Vanilla CSS)

Save the following styles to define the core aesthetics of the application.

```css
/* Variables & Theme */
:root {
  /* Color Palette */
  --bg-main: #faf8f5;        /* Soft sandy canvas */
  --bg-board: #f1ece4;       /* Warm linen bulletin board */
  --color-pin: #ff5964;      /* Cherry red pushpin */
  --shadow-coarse: 0 8px 16px rgba(0,0,0,0.06);
  --shadow-tactile: 0 4px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-hover: 0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.1);

  /* Note Colors */
  --color-workout: #ffadad;  /* Soft Pink */
  --color-running: #a0c4ff;  /* Soft Blue */
  --color-sports: #ffd6a5;   /* Soft Peach */
  --color-leetcode: #caffbf; /* Soft Mint Green */
  --color-project: #e8aeff;  /* Soft Lavender */
  --color-research: #fdffb6; /* Soft Cream Yellow */
  --color-general: #ffffff;  /* Classic White */
}

/* Base Font Setup */
body {
  font-family: 'Quicksand', sans-serif;
  background-color: var(--bg-main);
  color: #333;
  margin: 0;
}

/* Whimsical Animations */

/*
  Notes HANG from their pushpin (Option B). The pivot is the pin at the
  top-center, so set transform-origin to top center on every note. Position
  (x, y) is applied via `left`/`top` on the note — NEVER via `transform` — so
  the swing/tilt transforms never fight the placement.
*/
.sticky-note {
  position: absolute;            /* placed via left/top, see Tactical Mechanics */
  transform-origin: top center;  /* pivot at the pushpin */
  animation: note-hang-swing 4s ease-in-out infinite;
  /* Per-note variety is injected inline as CSS custom properties:
     style={{ '--sway-delay': '-1.2s', '--base-tilt': '-2deg' }} */
  animation-delay: var(--sway-delay, 0s);
}

/* 1. Swaying/Hanging animation — pivots from the pin, keeps each note's base tilt */
@keyframes note-hang-swing {
  0%   { transform: rotate(calc(var(--base-tilt, 0deg) - 1.5deg)); }
  50%  { transform: rotate(calc(var(--base-tilt, 0deg) + 1.5deg)); }
  100% { transform: rotate(calc(var(--base-tilt, 0deg) - 1.5deg)); }
}

/* 2. Playful hover wiggle (pauses the sway while hovered for a snappy feel) */
.sticky-note:hover {
  animation: note-hover-wiggle 0.4s ease-in-out;
  z-index: 999; /* hovered note floats above its neighbors */
}
@keyframes note-hover-wiggle {
  0%   { transform: rotate(var(--base-tilt, 0deg)) scale(1.04); }
  25%  { transform: rotate(calc(var(--base-tilt, 0deg) - 2deg)) scale(1.04); }
  75%  { transform: rotate(calc(var(--base-tilt, 0deg) + 2deg)) scale(1.04); }
  100% { transform: rotate(var(--base-tilt, 0deg)) scale(1.04); }
}

/* Transition class for day board zoom-in */
.board-container {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

/*
  Accessibility: respect users who opt out of motion. Disables the constant
  sway, the hover wiggle, and the zoom easing — notes simply rest at their
  base tilt and views cross-fade instead of animating.
*/
@media (prefers-reduced-motion: reduce) {
  .sticky-note,
  .sticky-note:hover {
    animation: none;
    transform: rotate(var(--base-tilt, 0deg));
  }
  .board-container {
    transition: opacity 0.2s ease;
  }
}
```

---

## 4. Component Architecture & State Structure

### Data Structure (JSON Store)
Store all information in a single state object saved under `localStorage.getItem('summer_progress_data')`:

The top-level object carries a `version` for future migrations; day entries live under `days`, keyed by ISO date:

```json
{
  "version": 1,
  "days": {
    "2026-06-12": {
      "notes": [
        {
          "id": "note-1718165000000",
          "category": "running",
          "position": { "x": 120, "y": 80 },
          "style": { "baseTilt": "-2deg", "swayDelay": "-1.2s", "z": 1 },
          "fields": {
            "distance": "3.2",
            "duration": "24",
            "notes": "Evening run, pleasant weather!"
          }
        },
        {
          "id": "note-1718165200000",
          "category": "leetcode",
          "position": { "x": 450, "y": 120 },
          "style": { "baseTilt": "1.5deg", "swayDelay": "-3s", "z": 2 },
          "fields": {
            "problem": "Two Sum",
            "difficulty": "Easy",
            "url": "https://leetcode.com/problems/two-sum/"
          }
        }
      ]
    }
  }
}
```

*   **`version`**: schema version. On load, if a stored blob's `version` is older than the app's current version, run a migration step before using it (and default a missing/legacy blob to `version: 1`). This lets the note shape evolve without wiping existing summer data.
*   **`style.baseTilt` / `style.swayDelay`**: assigned once at note creation (small random values) and fed to the CSS variables in `StickyNote`.
*   **`style.z`**: stacking order; bumped to the current max when a note is focused or dragged.

### Category Configuration (the extensibility core)
Everything category-specific — the dropdown options, note colors, icons, calendar dots, and which input fields appear — is driven by a **single config object** in `categories.js`. Adding a new activity later means appending **one entry** here; no component code changes.

```javascript
// categories.js
import { Dumbbell, Footprints, Volleyball, Code, FolderKanban, FlaskConical, StickyNote } from 'lucide-react';

export const CATEGORIES = {
  workout: {
    label: 'Workout',
    color: 'var(--color-workout)',
    icon: Dumbbell,
    fields: [
      { key: 'log', label: 'Workout Log', type: 'textarea', placeholder: 'Squats 3x10…' },
    ],
  },
  running: {
    label: 'Running',
    color: 'var(--color-running)',
    icon: Footprints,
    fields: [
      { key: 'distance', label: 'Distance (miles)', type: 'number' },
      { key: 'duration', label: 'Time (minutes)', type: 'number' },
      { key: 'notes',    label: 'Notes',           type: 'text' },
    ],
  },
  sports: {
    label: 'Volleyball / Sports',
    color: 'var(--color-sports)',
    icon: Volleyball,
    fields: [
      { key: 'activity', label: 'Activity / Practice Type', type: 'text' },
      { key: 'location', label: 'Location',                 type: 'text' },
    ],
  },
  leetcode: {
    label: 'Leetcode',
    color: 'var(--color-leetcode)',
    icon: Code,
    fields: [
      { key: 'problem',    label: 'Problem Name', type: 'text' },
      { key: 'difficulty', label: 'Difficulty',   type: 'select', options: ['Easy', 'Medium', 'Hard'] },
      { key: 'url',        label: 'URL',          type: 'url' },
    ],
  },
  project: {
    label: 'Project Work',
    color: 'var(--color-project)',
    icon: FolderKanban,
    fields: [
      { key: 'name',         label: 'Project Name', type: 'text' },
      { key: 'achievements', label: 'Achievements', type: 'textarea' },
    ],
  },
  research: {
    label: 'Research Work',
    color: 'var(--color-research)',
    icon: FlaskConical,
    fields: [
      { key: 'topic',   label: 'Topic',             type: 'text' },
      { key: 'summary', label: 'Reading / Summary', type: 'textarea' },
    ],
  },
  general: {
    label: 'General Note',
    color: 'var(--color-general)',
    icon: StickyNote,
    fields: [
      { key: 'text', label: 'Note', type: 'textarea' },
    ],
  },
};
```

*   **`NoteFormModal`** maps over `CATEGORIES[selected].fields` to render inputs generically (a small `type → input` switch handles `text` / `number` / `textarea` / `select` / `url`).
*   **`StickyNote`** reads `CATEGORIES[category]` for its color, icon, and field labels — no hardcoded per-category JSX.
*   **`CalendarView`** dots/icons come from the categories present on each day, looked up in the config.
*   **To add a category later** (your "anything else" goal): add one key to `CATEGORIES` and, optionally, one `--color-*` CSS variable. Done.

### Component Breakdown
1.  **`App.jsx`**: Manages global navigation, selected date, and loaded dataset. Renders either the calendar grid or the active day board. Hosts the top toolbar (Export / Import / progress summary toggle).
2.  **`CalendarView.jsx`**:
    *   Displays standard 7-column calendar month.
    *   Header includes current Month/Year display and Previous/Next buttons.
    *   Each day cell renders the day number and a list of tiny icon tags matching the categories filled for that day.
    *   **Today** is visually highlighted (e.g. an accent ring around the day number) so the current day is easy to spot at a glance.
3.  **`BulletinBoard.jsx`**:
    *   Background styled like a linen board.
    *   Includes a "Back to Calendar" button and a floating "Add Note" button.
    *   Renders all notes for the day at their respective `position.x` and `position.y` coordinates, ordered by `style.z`.
    *   Supports drag-and-drop mechanics using React pointer handlers to update coordinates.
    *   **Empty state**: when a day has no notes, shows a gentle whimsical prompt (e.g. a faded pin and "Pin your first note for the day!") instead of a blank board.
4.  **`StickyNote.jsx`**:
    *   Maintains class names for color based on `category`.
    *   Placed via `left`/`top` from `position`; **hangs** from a pushpin with `transform-origin: top center` and the `note-hang-swing` animation (Option B).
    *   Injects per-note `--base-tilt` and `--sway-delay` as inline CSS variables (read from the note's `style` fields) so each note rests at its own angle and sways out of sync.
    *   Displays a 3D red pin SVG at `top: -10px; left: 50%; transform: translateX(-50%);` (the visual pivot point).
    *   Uses `font-family: 'Playpen Sans', handwriting;`.
    *   Displays custom content depending on the category (e.g. details of running distance, Leetcode details).
    *   Provides edit controls and a delete button.
    *   On pointer-down/drag, the note's `z-index` is raised above its siblings so the active note is never occluded.
5.  **`NoteFormModal.jsx`**:
    *   Triggered when adding a new note or editing an existing one.
    *   Contains a dropdown selection menu for the note category, populated from `CATEGORIES`.
    *   Dynamically renders inputs from the selected category's `fields` schema (generic `renderField`, see Tactical Mechanics §2).
6.  **`Toolbar.jsx`** (in `App`):
    *   **Export** button: serializes the full store and triggers a `.json` download (`summer-progress-YYYY-MM-DD.json`).
    *   **Import** button: hidden `<input type="file">`; reads a chosen `.json`, validates `version` + shape, confirms before replacing, then runs any needed migration and saves.
    *   Toggle for the **Progress Summary** panel.
7.  **`ProgressSummary.jsx`**:
    *   Computes month-scoped roll-ups from the store: count of notes per category, simple numeric totals where it makes sense (e.g. summed running `distance`/`duration`, count of Leetcode problems by difficulty), number of active days, and the longest active-day streak.
    *   Rendered as small whimsical "stat cards" so it matches the corkboard aesthetic.
    *   Pure derived view — reads state, writes nothing.

---

## 5. Tactical Mechanics

> **Scope note:** This app is **desktop-first**. A responsive/touch layout for phones is explicitly out of scope for v1 — the fixed-coordinate board assumes a mouse and a wide viewport. Pointer events are still used (they cover mouse cleanly), but no mobile reflow is implemented.

### 1. Freeform Positioning (Drag and Drop)
Use absolute positioning (`position: absolute`) within the bulletin board canvas. Implement React pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp`):

```javascript
const handlePointerDown = (e, noteId) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  // Raise this note above its siblings for the duration of the interaction
  bringNoteToFront(noteId);

  // Set active dragging state
  setDragging({ noteId, offsetX, offsetY });
};

const handlePointerMove = (e) => {
  if (!dragging) return;
  
  const boardRect = boardRef.current.getBoundingClientRect();
  const x = e.clientX - boardRect.left - dragging.offsetX;
  const y = e.clientY - boardRect.top - dragging.offsetY;
  
  // Constrain coordinates within board boundaries
  const constrainedX = Math.max(0, Math.min(x, boardRect.width - NOTE_WIDTH));
  const constrainedY = Math.max(0, Math.min(y, boardRect.height - NOTE_HEIGHT));

  updateNotePosition(dragging.noteId, { x: constrainedX, y: constrainedY });
};
```

### 2. Category Configuration & Input Options
Input fields are **not** hardcoded per category here — they are generated from the `CATEGORIES` config object (see *Section 4 → Category Configuration*). `NoteFormModal` reads `CATEGORIES[selected].fields` and renders each field by its `type`:

```javascript
function renderField(field, value, onChange) {
  switch (field.type) {
    case 'textarea': return <textarea value={value} onChange={onChange} placeholder={field.placeholder} />;
    case 'number':   return <input type="number" value={value} onChange={onChange} />;
    case 'url':      return <input type="url" value={value} onChange={onChange} />;
    case 'select':   return (
      <select value={value} onChange={onChange}>
        {field.options.map(o => <option key={o}>{o}</option>)}
      </select>
    );
    default:         return <input type="text" value={value} onChange={onChange} />;
  }
}
```

This keeps a single source of truth: adding a field or category touches only `categories.js`.

### 3. Export / Import (Backup)
Export serializes the whole store to a downloadable file; import reads one back, validates it, and (after confirmation) replaces the current data. Keep the same `{ version, days }` shape so files stay forward-compatible via the migration step.

```javascript
function exportData(store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `summer-progress-${new Date().toISOString().slice(0, 10)}.json`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file, onLoad) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || typeof parsed !== 'object' || !('days' in parsed)) {
        throw new Error('Not a valid Summer Progress file.');
      }
      if (!confirm('Importing will replace your current data. Continue?')) return;
      onLoad(migrate(parsed)); // migrate() bumps older versions to the current schema
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
  };
  reader.readAsText(file);
}
```

---

## 6. Data Storage Options & Persistence

The default plan uses **browser `localStorage`** with the manual JSON export/import above as your backup. That's the simplest path and works fully offline with zero setup. Below are the realistic options, roughly in order of effort, so you can decide how durable you want this to be.

| Option | How it works | Pros | Cons / effort |
| --- | --- | --- | --- |
| **`localStorage` (default)** | Single JSON string under `summer_progress_data`. | Zero setup, instant, offline. | ~5 MB cap; tied to one browser/profile; cleared if you wipe site data. Plenty for text notes. |
| **`localStorage` + JSON export/import** | Default, plus manual `.json` download/upload (implemented above). | Real backup; portable between machines; human-readable. | Backups are manual — you have to remember to export. |
| **IndexedDB** (e.g. via [`idb-keyval`](https://github.com/jakearchibald/idb-keyval) or `Dexie`) | Structured local DB in the browser. | Much larger limits; better for many entries or future images/attachments; still offline. | More API surface than `localStorage`; overkill for pure text. |
| **File System Access API** | App reads/writes a real `.json` file on disk you pick once. | Edits persist to an actual file you control (drop it in iCloud/Dropbox for sync). | Chrome/Edge only; permission prompts; not on Safari/Firefox. |
| **Cloud sync (Supabase / Firebase)** | Data stored in a hosted DB behind your login. | Access from any device; automatic durable backup. | Needs auth + a backend/account; online dependency; more setup than a personal summer app may warrant. |
| **Git-backed JSON** | Export and commit the file to a private repo. | Versioned history of your whole summer; free durable backup. | Manual unless scripted; not an in-app feature. |

**Recommendation for this app:** start with **`localStorage` + export/import** (already in the plan) and, if you find yourself wanting it on your phone or laptop interchangeably, layer in **Supabase** later — the `{ version, days }` shape ports to a single table row or document with no model changes. A low-effort middle ground: keep `localStorage` as the live store and **auto-prompt an export every N days** (or auto-download on a schedule) so backups aren't purely manual.

---

## 7. Implementation Checklist for the Coding Agent

*   [ ] **Step 1**: Initialize project with Vite React, Tailwind CSS (optional - Vanilla CSS preferred), and Lucide React.
*   [ ] **Step 2**: Create standard styles, import fonts (`Quicksand` & `Playpen Sans`), and configure custom color variables.
*   [ ] **Step 3**: Define the `CATEGORIES` config object in `categories.js` (the single source of truth for labels, colors, icons, and field schemas).
*   [ ] **Step 4**: Implement the `CalendarView` displaying a monthly grid. Add helper utility to compute days of the month (including buffer days of neighboring months); render the **today** highlight and per-day category dots from the config.
*   [ ] **Step 5**: Code the `BulletinBoard` component, including the empty-board state. Build smooth entry/exit animations between calendar grid and board view.
*   [ ] **Step 6**: Code the `StickyNote` styling including the hanging/swaying animation (Option B), per-note `--base-tilt`/`--sway-delay` variables, custom 3D pins, and the `prefers-reduced-motion` fallback.
*   [ ] **Step 7**: Implement pointer event listeners for dragging (desktop-first), save offsets, and bring the active note to the front via `style.z`.
*   [ ] **Step 8**: Write the `NoteFormModal` with the category dropdown and the generic `renderField` driven by the config.
*   [ ] **Step 9**: Link all adjustments to browser `localStorage` (`{ version, days }` shape) with a version-check/migration step on load.
*   [ ] **Step 10**: Build the `Toolbar` Export / Import buttons (download + validated upload) and the `ProgressSummary` panel with month roll-ups and streak.
# summerTracker
