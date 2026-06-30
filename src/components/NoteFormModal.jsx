import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES, CATEGORY_KEYS, DEFAULT_CATEGORY, getCategory } from '../categories.js';

/**
 * Generic field renderer: a small type → input switch. Adding a field type
 * means adding one case here; adding a field or category touches only
 * categories.js.
 */
function renderField(field, value, onChange) {
  const id = `field-${field.key}`;
  switch (field.type) {
    case 'textarea':
      return <textarea id={id} value={value} onChange={onChange} placeholder={field.placeholder} />;
    case 'number':
      return (
        <input id={id} type="number" step="any" value={value} onChange={onChange} placeholder={field.placeholder} />
      );
    case 'url':
      return <input id={id} type="url" value={value} onChange={onChange} placeholder={field.placeholder} />;
    case 'select':
      return (
        <select id={id} value={value} onChange={onChange}>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    default:
      return <input id={id} type="text" value={value} onChange={onChange} placeholder={field.placeholder} />;
  }
}

/**
 * Create / edit a note. The category dropdown is populated from CATEGORIES and
 * the inputs are generated from the selected category's `fields` schema.
 */
export default function NoteFormModal({ editingNote, onSave, onClose }) {
  const [category, setCategory] = useState(editingNote?.category || DEFAULT_CATEGORY);
  const [values, setValues] = useState(() => ({ ...(editingNote?.fields || {}) }));

  const config = getCategory(category);

  // Make sure select fields always have a valid value (default to first option).
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      config.fields.forEach((f) => {
        if (f.type === 'select' && !next[f.key]) next[f.key] = f.options[0];
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleChange = (key) => (e) => {
    const v = e.target.value;
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  // Always hand a controlled input a defined value; selects fall back to their
  // first option so the control never shows a blank/mismatched state.
  const currentValue = (field) => {
    const v = values[field.key];
    if (v != null && v !== '') return v;
    return field.type === 'select' ? field.options[0] : '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Trim and drop empty fields so notes stay tidy.
    const cleaned = {};
    config.fields.forEach((f) => {
      const v = values[f.key];
      if (v != null && String(v).trim() !== '') cleaned[f.key] = String(v).trim();
    });
    onSave({ id: editingNote?.id, category, fields: cleaned });
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>{editingNote ? 'Edit Note' : 'New Note'}</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label htmlFor="category-select">Activity Type</label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CATEGORIES[key].label}
                </option>
              ))}
            </select>
          </div>

          {config.fields.map((field) => (
            <div className="field" key={field.key}>
              <label htmlFor={`field-${field.key}`}>
                <span className="category-swatch" style={{ background: config.color }} />
                {field.label}
              </label>
              {renderField(field, currentValue(field), handleChange(field.key))}
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {editingNote ? 'Save Changes' : 'Pin Note'}
          </button>
        </div>
      </form>
    </div>
  );
}
