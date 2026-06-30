/* =================================================================
   CATEGORIES — the single source of truth.
   Everything category-specific (dropdown options, note colors, icons,
   calendar dots, and which input fields appear) is driven from here.

   To add a new activity later (the "anything else" goal):
     1. Append one entry below.
     2. Optionally add a matching --color-<key> CSS variable in styles.css.
   No component code changes are required.
   ================================================================= */
import {
  Dumbbell,
  Footprints,
  Volleyball,
  Code,
  FolderKanban,
  FlaskConical,
  StickyNote,
} from 'lucide-react';

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
      { key: 'distance', label: 'Distance (miles)', type: 'number', placeholder: '3.2' },
      { key: 'duration', label: 'Time (minutes)', type: 'number', placeholder: '24' },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Evening run…' },
    ],
  },
  sports: {
    label: 'Volleyball / Sports',
    color: 'var(--color-sports)',
    icon: Volleyball,
    fields: [
      { key: 'activity', label: 'Activity / Practice Type', type: 'text', placeholder: 'Open gym, scrimmage…' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'Rec center' },
    ],
  },
  leetcode: {
    label: 'Leetcode',
    color: 'var(--color-leetcode)',
    icon: Code,
    fields: [
      { key: 'problem', label: 'Problem Name', type: 'text', placeholder: 'Two Sum' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard'] },
      { key: 'url', label: 'URL', type: 'url', placeholder: 'https://leetcode.com/…' },
    ],
  },
  project: {
    label: 'Project Work',
    color: 'var(--color-project)',
    icon: FolderKanban,
    fields: [
      { key: 'name', label: 'Project Name', type: 'text', placeholder: 'Summer Tracker' },
      { key: 'achievements', label: 'Achievements', type: 'textarea', placeholder: 'What did you ship?' },
    ],
  },
  research: {
    label: 'Research Work',
    color: 'var(--color-research)',
    icon: FlaskConical,
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Diffusion models' },
      { key: 'summary', label: 'Reading / Summary', type: 'textarea', placeholder: 'Key takeaways…' },
    ],
  },
  general: {
    label: 'General Note',
    color: 'var(--color-general)',
    icon: StickyNote,
    fields: [
      { key: 'text', label: 'Note', type: 'textarea', placeholder: 'Anything on your mind…' },
    ],
  },
};

/** Stable, predictable category order for dropdowns and the summary. */
export const CATEGORY_KEYS = Object.keys(CATEGORIES);

/** Default category selected when creating a new note. */
export const DEFAULT_CATEGORY = 'general';

/** Safe lookup that always returns a config (falls back to general). */
export function getCategory(key) {
  return CATEGORIES[key] || CATEGORIES[DEFAULT_CATEGORY];
}
