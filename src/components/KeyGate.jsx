import { useState } from 'react';

/* =================================================================
   KeyGate — a one-time prompt for the shared cloud key.

   Shown when no key is stored yet, or when the server rejects the
   current key (401). Self-contained inline styles so it doesn't depend
   on the rest of the stylesheet. "Use offline" lets you skip the cloud
   entirely and run on localStorage only (handy in local dev).
   ================================================================= */
export default function KeyGate({ rejected, onSubmit, onSkip }) {
  const [value, setValue] = useState('');

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'grid', placeItems: 'center',
    background: 'rgba(40, 34, 28, 0.45)', backdropFilter: 'blur(2px)',
  };
  const card = {
    background: 'var(--bg-main, #faf8f5)', borderRadius: 16, padding: '28px 26px',
    width: 'min(380px, 90vw)', boxShadow: '0 14px 28px rgba(0,0,0,0.2)',
    fontFamily: "'Quicksand', sans-serif", color: '#333',
  };
  const input = {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px', marginTop: 14,
    borderRadius: 10, border: '2px solid #e2dcd2', fontSize: 16,
    fontFamily: "'Quicksand', sans-serif",
  };
  const row = { display: 'flex', gap: 10, marginTop: 18 };
  const btn = {
    flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none',
    cursor: 'pointer', fontSize: 15, fontWeight: 600,
    fontFamily: "'Quicksand', sans-serif",
  };

  const submit = (e) => {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <div style={overlay}>
      <form style={card} onSubmit={submit}>
        <h2 style={{ margin: 0, fontSize: 20 }}>🔑 Connect your cloud</h2>
        <p style={{ marginTop: 8, lineHeight: 1.5, fontSize: 14, color: '#6b6258' }}>
          {rejected
            ? 'That key was rejected. Enter the correct key to reconnect.'
            : 'Enter your secret key to sync this device with your saved progress.'}
        </p>
        <input
          style={input}
          type="password"
          placeholder="Secret key"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div style={row}>
          <button type="submit" style={{ ...btn, background: 'var(--color-pin, #ff5964)', color: '#fff' }}>
            Connect
          </button>
          <button type="button" style={{ ...btn, background: '#ece6dc', color: '#555' }} onClick={onSkip}>
            Use offline
          </button>
        </div>
      </form>
    </div>
  );
}
