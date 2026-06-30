import { Pencil, Trash2 } from 'lucide-react';
import { getCategory } from '../categories.js';

/** A small 3D-looking red pushpin — the visual pivot the note hangs from. */
function Pushpin() {
  return (
    <svg className="note-pin" width="26" height="30" viewBox="0 0 26 30" aria-hidden="true">
      <rect x="12" y="13" width="2" height="15" rx="1" fill="var(--pin-needle)" />
      <circle cx="13" cy="11" r="9" fill="var(--color-pin)" />
      <circle cx="13" cy="11" r="9" fill="none" stroke="rgba(0,0,0,0.12)" />
      <circle cx="9.5" cy="7.5" r="3" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    const tail = (u.pathname + u.search).replace(/\/$/, '');
    const text = u.hostname.replace(/^www\./, '') + (tail.length > 1 ? tail : '');
    return text.length > 28 ? text.slice(0, 27) + '…' : text;
  } catch {
    return url;
  }
}

/** Render a single field's value, with niceties for difficulty + URL. */
function NoteField({ field, value }) {
  if (field.key === 'difficulty') {
    return (
      <div className="note-field">
        <span className={`note-badge diff-${value}`}>{value}</span>
      </div>
    );
  }
  if (field.type === 'url') {
    return (
      <div className="note-field">
        <span className="note-field-label">{field.label}</span>
        <a
          className="note-field-value"
          href={value}
          target="_blank"
          rel="noreferrer"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {shortenUrl(value)}
        </a>
      </div>
    );
  }
  return (
    <div className="note-field">
      <span className="note-field-label">{field.label}</span>
      <span className="note-field-value">{value}</span>
    </div>
  );
}

/**
 * A post-it note that HANGS from its pushpin and gently sways.
 * Positioned via left/top (never transform) so the swing/tilt never fights
 * placement. Per-note --base-tilt and --sway-delay make the board feel lively.
 */
export default function StickyNote({ note, onEdit, onDelete, onPointerDown, isDragging }) {
  const config = getCategory(note.category);
  const Icon = config.icon;
  const hasContent = config.fields.some((f) => note.fields?.[f.key]);

  return (
    <div
      className={`sticky-note ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${note.position?.x ?? 40}px`,
        top: `${note.position?.y ?? 40}px`,
        zIndex: note.style?.z ?? 1,
        '--note-color': config.color,
        '--base-tilt': note.style?.baseTilt ?? '0deg',
        '--sway-delay': note.style?.swayDelay ?? '0s',
      }}
      onPointerDown={(e) => onPointerDown(e, note)}
    >
      <Pushpin />
      <div className="note-header">
        <Icon size={15} />
        <span className="note-category">{config.label}</span>
        <div className="note-actions">
          <button
            className="note-action-btn"
            onClick={() => onEdit(note)}
            aria-label="Edit note"
          >
            <Pencil size={13} />
          </button>
          <button
            className="note-action-btn"
            onClick={() => onDelete(note.id)}
            aria-label="Delete note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="note-body">
        {hasContent ? (
          config.fields.map((f) => {
            const value = note.fields?.[f.key];
            if (!value) return null;
            return <NoteField key={f.key} field={f} value={value} />;
          })
        ) : (
          <span className="note-empty-hint">Empty note — tap ✎ to fill it in.</span>
        )}
      </div>
    </div>
  );
}
