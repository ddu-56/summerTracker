import { useState, useEffect, useCallback, useRef } from 'react';
import Toolbar from './components/Toolbar.jsx';
import CalendarView from './components/CalendarView.jsx';
import BulletinBoard from './components/BulletinBoard.jsx';
import NoteFormModal from './components/NoteFormModal.jsx';
import ProgressSummary from './components/ProgressSummary.jsx';
import KeyGate from './components/KeyGate.jsx';
import { loadStore, saveStore, migrate } from './utils/storage.js';
import { exportData, importData } from './utils/backup.js';
import { hasKey, setKey, clearKey, fetchRemoteStore, pushRemoteStore } from './utils/remote.js';

// Per-note variety, assigned once at creation (README §4).
const randomTilt = () => `${(Math.random() * 6 - 3).toFixed(1)}deg`; // -3deg .. +3deg
const randomDelay = () => `-${(Math.random() * 4).toFixed(1)}s`; //   -4s  .. 0s  (out of sync)

// Highest stacking index among notes, +1.
const nextZ = (notes) => notes.reduce((max, n) => Math.max(max, n.style?.z ?? 0), 0) + 1;

// Gently cascade new notes so they don't stack exactly on top of each other.
function spawnPosition(count) {
  const col = count % 4;
  const row = Math.floor(count / 4) % 3;
  return {
    x: Math.round(36 + col * 62 + Math.random() * 18),
    y: Math.round(40 + row * 74 + Math.random() * 18),
  };
}

export default function App() {
  const [store, setStore] = useState(() => loadStore());

  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const [selectedDate, setSelectedDate] = useState(null); // ISO string, or null for calendar
  const [showSummary, setShowSummary] = useState(false);
  const [modal, setModal] = useState({ open: false, editingNote: null });

  // ---- Cloud sync ---------------------------------------------------------
  // Offline-first: localStorage is the live store; the cloud syncs in the
  // background. `synced` flips true only after the first reconcile so we never
  // push stale local data over newer cloud data on startup.
  const synced = useRef(false);
  const [gate, setGate] = useState(() => (hasKey() ? null : 'prompt')); // 'prompt' | 'rejected' | null

  // Pull remote on connect, compare timestamps, and let the newer copy win.
  const reconcile = useCallback(async () => {
    const local = loadStore();
    const remote = await fetchRemoteStore();

    if (remote.ok) {
      const r = remote.store ? migrate(remote.store) : null;
      if (r && (r.updatedAt || 0) > (local.updatedAt || 0)) {
        setStore(r);       // cloud is newer → adopt it
        saveStore(r);
      } else {
        pushRemoteStore(local); // local is newer or cloud empty → seed the cloud
      }
      synced.current = true;
      setGate(null);
    } else if (remote.status === 401) {
      clearKey();
      setGate('rejected');  // bad key → re-prompt
    }
    // status 0 (offline / no API) → stay offline, keep using localStorage
  }, []);

  useEffect(() => {
    if (hasKey()) reconcile();
  }, [reconcile]);

  // Persist (debounced) to localStorage AND, once synced, to the cloud.
  // updatedAt is stamped on the persisted copy only — newer-wins reconciliation.
  useEffect(() => {
    const id = setTimeout(() => {
      const stamped = { ...store, updatedAt: Date.now() };
      saveStore(stamped);
      if (synced.current) pushRemoteStore(stamped);
    }, 500);
    return () => clearTimeout(id);
  }, [store]);

  const handleConnect = (key) => {
    setKey(key);
    setGate(null);
    reconcile();
  };

  // ---- Store mutators (immutable) ----------------------------------------
  const updateDayNotes = useCallback((iso, updater) => {
    setStore((prev) => {
      const day = prev.days[iso] || { notes: [] };
      const notes = updater(day.notes);
      const days = { ...prev.days };
      if (notes.length === 0) {
        delete days[iso]; // keep the store tidy — drop days with no notes
      } else {
        days[iso] = { ...day, notes };
      }
      return { ...prev, days };
    });
  }, []);

  const handleSaveNote = useCallback(
    ({ id, category, fields }) => {
      const iso = selectedDate;
      updateDayNotes(iso, (notes) => {
        if (id) {
          // Edit: keep position/style, swap category + fields.
          return notes.map((n) => (n.id === id ? { ...n, category, fields } : n));
        }
        // New note.
        const newNote = {
          id: `note-${Date.now()}`,
          category,
          position: spawnPosition(notes.length),
          style: { baseTilt: randomTilt(), swayDelay: randomDelay(), z: nextZ(notes) },
          fields,
        };
        return [...notes, newNote];
      });
      setModal({ open: false, editingNote: null });
    },
    [selectedDate, updateDayNotes]
  );

  const handleDeleteNote = useCallback(
    (noteId) => {
      if (!window.confirm('Delete this note?')) return;
      updateDayNotes(selectedDate, (notes) => notes.filter((n) => n.id !== noteId));
    },
    [selectedDate, updateDayNotes]
  );

  const handleUpdatePosition = useCallback(
    (noteId, position) => {
      updateDayNotes(selectedDate, (notes) =>
        notes.map((n) => (n.id === noteId ? { ...n, position } : n))
      );
    },
    [selectedDate, updateDayNotes]
  );

  const handleBringToFront = useCallback(
    (noteId) => {
      updateDayNotes(selectedDate, (notes) => {
        const top = nextZ(notes);
        return notes.map((n) =>
          n.id === noteId ? { ...n, style: { ...n.style, z: top } } : n
        );
      });
    },
    [selectedDate, updateDayNotes]
  );

  // ---- Navigation ---------------------------------------------------------
  const shiftMonth = (delta) =>
    setView(({ year, month }) => {
      const total = year * 12 + month + delta;
      return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
    });

  const goToToday = () => {
    const now = new Date();
    setView({ year: now.getFullYear(), month: now.getMonth() });
  };

  // ---- Backup -------------------------------------------------------------
  const handleImport = (file) =>
    importData(file, (migrated) => {
      setStore(migrated);
      setSelectedDate(null); // return to the calendar after a replace
    });

  const selectedNotes = selectedDate ? store.days[selectedDate]?.notes || [] : [];

  return (
    <div className="app">
      {gate && (
        <KeyGate
          rejected={gate === 'rejected'}
          onSubmit={handleConnect}
          onSkip={() => setGate(null)}
        />
      )}

      <Toolbar
        onExport={() => exportData(store)}
        onImport={handleImport}
        showSummary={showSummary}
        onToggleSummary={() => setShowSummary((s) => !s)}
      />

      <main className="app-main">
        {showSummary && <ProgressSummary store={store} year={view.year} month={view.month} />}

        {selectedDate ? (
          <BulletinBoard
            iso={selectedDate}
            notes={selectedNotes}
            onBack={() => setSelectedDate(null)}
            onAddNote={() => setModal({ open: true, editingNote: null })}
            onEditNote={(note) => setModal({ open: true, editingNote: note })}
            onDeleteNote={handleDeleteNote}
            onUpdatePosition={handleUpdatePosition}
            onBringToFront={handleBringToFront}
          />
        ) : (
          <CalendarView
            year={view.year}
            month={view.month}
            days={store.days}
            onSelectDay={setSelectedDate}
            onPrevMonth={() => shiftMonth(-1)}
            onNextMonth={() => shiftMonth(1)}
            onToday={goToToday}
          />
        )}
      </main>

      {modal.open && (
        <NoteFormModal
          editingNote={modal.editingNote}
          onSave={handleSaveNote}
          onClose={() => setModal({ open: false, editingNote: null })}
        />
      )}
    </div>
  );
}
