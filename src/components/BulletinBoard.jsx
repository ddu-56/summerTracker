import { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Pin } from 'lucide-react';
import StickyNote from './StickyNote.jsx';
import { formatLongDate } from '../utils/calendar.js';

/**
 * The day's corkboard. Renders notes at their (x, y), ordered by z, supports
 * pointer-based dragging (desktop-first), and shows a whimsical empty state.
 *
 * Offsets are computed from each note's stored position (the un-rotated
 * left/top), not getBoundingClientRect — so the swaying rotation never makes
 * the note jump under the cursor on grab.
 */
export default function BulletinBoard({
  iso,
  notes,
  onBack,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onUpdatePosition,
  onBringToFront,
}) {
  const boardRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const handlePointerDown = useCallback(
    (e, note) => {
      // Don't start a drag from the edit/delete buttons or a link.
      if (e.target.closest('button, a, input, textarea, select')) return;
      e.preventDefault();
      const board = boardRef.current;
      const rect = board.getBoundingClientRect();
      onBringToFront(note.id);
      // Positions are relative to the board's padding box (inside the frame
      // border), so offset against rect.left + clientLeft (the border width).
      setDragging({
        noteId: note.id,
        offsetX: e.clientX - (rect.left + board.clientLeft) - (note.position?.x ?? 0),
        offsetY: e.clientY - (rect.top + board.clientTop) - (note.position?.y ?? 0),
        width: e.currentTarget.offsetWidth,
        height: e.currentTarget.offsetHeight,
      });
    },
    [onBringToFront]
  );

  // While dragging, listen on the window so the note keeps tracking even if the
  // pointer briefly leaves the board.
  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const board = boardRef.current;
      const rect = board.getBoundingClientRect();
      let x = e.clientX - (rect.left + board.clientLeft) - dragging.offsetX;
      let y = e.clientY - (rect.top + board.clientTop) - dragging.offsetY;
      // Constrain within the board's inner (content) area so notes never slip
      // under the wooden frame.
      x = Math.max(0, Math.min(x, board.clientWidth - dragging.width));
      y = Math.max(0, Math.min(y, board.clientHeight - dragging.height));
      onUpdatePosition(dragging.noteId, { x, y });
    };
    const handleUp = () => setDragging(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging, onUpdatePosition]);

  // Render ordered by stacking index so z reflects visual order.
  const ordered = [...notes].sort((a, b) => (a.style?.z ?? 0) - (b.style?.z ?? 0));

  return (
    <div className="board-view">
      <div className="board-header">
        <button className="btn" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Calendar
        </button>
        <h2 className="board-date-title">{formatLongDate(iso)}</h2>
      </div>

      <div className="board-container">
        <div className="board-surface" ref={boardRef}>
          {notes.length === 0 && (
            <div className="board-empty">
              <Pin className="empty-pin" size={48} />
              <p>Pin your first note for the day!</p>
            </div>
          )}

          {ordered.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              isDragging={dragging?.noteId === note.id}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
              onPointerDown={handlePointerDown}
            />
          ))}

          <button className="add-note-fab" onClick={onAddNote} aria-label="Add note">
            <Plus size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}
