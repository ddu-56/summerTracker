/* =================================================================
   localStorage persistence with a version-check / migration step.
   Store shape: { version, days: { "YYYY-MM-DD": { notes: [...] } } }
   ================================================================= */

export const STORAGE_KEY = 'summer_progress_data';
export const CURRENT_VERSION = 1;

/** A fresh, empty store at the current schema version. */
export function emptyStore() {
  return { version: CURRENT_VERSION, updatedAt: 0, days: {} };
}

/**
 * Bring any stored/imported blob up to the current schema version.
 * Defaults a missing/legacy blob to version 1, then applies sequential
 * migrations. Add `if (store.version < N) { …; store.version = N; }`
 * blocks here as the schema evolves.
 */
export function migrate(data) {
  if (!data || typeof data !== 'object') return emptyStore();

  const store = { ...data };
  if (typeof store.version !== 'number') store.version = 1;
  if (typeof store.updatedAt !== 'number') store.updatedAt = 0; // for newer-wins sync
  if (!store.days || typeof store.days !== 'object') store.days = {};

  // --- Future migrations go here, e.g.:
  // if (store.version < 2) { /* transform store */ store.version = 2; }

  store.version = CURRENT_VERSION;
  return store;
}

/** Load + migrate the store from localStorage, falling back to empty. */
export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.error('Failed to load store; starting fresh.', err);
    return emptyStore();
  }
}

/** Persist the store to localStorage. */
export function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save store.', err);
  }
}
