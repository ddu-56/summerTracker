import { useRef } from 'react';
import { Sun, Download, Upload, BarChart3 } from 'lucide-react';

/**
 * Top toolbar: brand, Progress Summary toggle, and Export / Import (backup).
 * The file input is hidden and triggered by the Import button; resetting its
 * value after a pick allows re-importing the same file.
 */
export default function Toolbar({ onExport, onImport, showSummary, onToggleSummary }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = '';
  };

  return (
    <header className="toolbar">
      <div className="brand">
        <Sun className="brand-sun" size={24} />
        Summer Progress Tracker
      </div>

      <div className="toolbar-spacer" />

      <button
        className={`btn ${showSummary ? 'is-active' : ''}`}
        onClick={onToggleSummary}
        aria-pressed={showSummary}
      >
        <BarChart3 size={17} /> Progress
      </button>
      <button className="btn" onClick={onExport}>
        <Download size={17} /> Export
      </button>
      <button className="btn" onClick={() => fileRef.current?.click()}>
        <Upload size={17} /> Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="visually-hidden"
      />
    </header>
  );
}
