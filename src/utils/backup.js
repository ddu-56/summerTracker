/* =================================================================
   Export / Import (Backup).
   Export serializes the whole { version, days } store to a downloadable
   .json file; import reads one back, validates its shape, confirms, then
   runs the migration step before handing it to the app.
   ================================================================= */
import { migrate } from './storage.js';

/** Download the entire store as summer-progress-YYYY-MM-DD.json. */
export function exportData(store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `summer-progress-${new Date().toISOString().slice(0, 10)}.json`,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Read a chosen .json file, validate it, confirm with the user, then call
 * onLoad(migratedStore). Errors surface via alert(); the live store is only
 * replaced on success + confirmation.
 */
export function importData(file, onLoad) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || typeof parsed !== 'object' || !('days' in parsed)) {
        throw new Error('Not a valid Summer Progress file.');
      }
      if (!window.confirm('Importing will replace your current data. Continue?')) {
        return;
      }
      onLoad(migrate(parsed)); // migrate() bumps older versions to the current schema
    } catch (err) {
      window.alert(`Import failed: ${err.message}`);
    }
  };
  reader.readAsText(file);
}
