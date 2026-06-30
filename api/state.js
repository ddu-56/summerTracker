/* =================================================================
   Vercel Serverless Function — the cloud storage endpoint.

   GET  /api/state  -> { store: <your data> | null }
   POST /api/state  -> { ok: true }   (body: { store: <your data> })

   Every request must carry the shared key in the `x-app-key` header,
   matched against the APP_KEY env var. No key, no access — that's the
   simple gate that keeps the app private without a real login system.

   Data lives in Upstash Redis (one key holds your whole JSON blob).
   ================================================================= */
import { Redis } from '@upstash/redis';

// The Vercel/Upstash integration injects one of these env-var pairs
// depending on how you connect it. Support both so setup "just works".
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const DATA_KEY = 'summer_progress_data';

export default async function handler(req, res) {
  // --- Key gate -----------------------------------------------------------
  const provided = req.headers['x-app-key'];
  if (!process.env.APP_KEY || provided !== process.env.APP_KEY) {
    return res.status(401).json({ error: 'Invalid or missing app key.' });
  }

  try {
    if (req.method === 'GET') {
      // Upstash auto-deserializes JSON, so this is already an object (or null).
      const store = await redis.get(DATA_KEY);
      return res.status(200).json({ store: store ?? null });
    }

    if (req.method === 'POST') {
      const store = req.body?.store;
      if (!store || typeof store !== 'object' || !('days' in store)) {
        return res.status(400).json({ error: 'Invalid store payload.' });
      }
      await redis.set(DATA_KEY, store);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    return res.status(500).json({ error: 'Storage error.', detail: String(err) });
  }
}
