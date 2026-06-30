/* =================================================================
   Remote sync against the Vercel /api/state function (Upstash KV behind it).

   The app is OFFLINE-FIRST: localStorage is the instant source of truth and
   these helpers are the background sync layer. They NEVER throw — on any
   failure (offline, dev with no API, wrong key) they resolve to a safe value
   and the app keeps working purely on localStorage.

   The "app key" is the shared passphrase that gates the API. It's stored
   separately from your tracker data so importing/exporting data never touches
   it.
   ================================================================= */

const KEY_STORAGE = 'summer_app_key';

export function getKey() {
  try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; }
}
export function setKey(key) {
  try { localStorage.setItem(KEY_STORAGE, key.trim()); } catch { /* ignore */ }
}
export function clearKey() {
  try { localStorage.removeItem(KEY_STORAGE); } catch { /* ignore */ }
}
export function hasKey() {
  return !!getKey();
}

/**
 * GET the remote store.
 * @returns {Promise<{ ok: boolean, store?: object|null, status: number }>}
 *   ok:true  -> store is the remote data (may be null if nothing saved yet)
 *   ok:false -> status 401 means bad/missing key; 0 means offline/no API.
 */
export async function fetchRemoteStore() {
  const key = getKey();
  if (!key) return { ok: false, status: 0 };
  try {
    const res = await fetch('/api/state', { headers: { 'x-app-key': key } });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    return { ok: true, store: data.store ?? null, status: 200 };
  } catch {
    return { ok: false, status: 0 };
  }
}

/**
 * POST the store to the remote. Never throws.
 * @returns {Promise<{ ok: boolean, status: number }>}
 */
export async function pushRemoteStore(store) {
  const key = getKey();
  if (!key) return { ok: false, status: 0 };
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-key': key },
      body: JSON.stringify({ store }),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
