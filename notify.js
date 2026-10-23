const webpush = require('web-push');
const { Redis } = require('@upstash/redis');
const redis = Redis.fromEnv();

webpush.setVapidDetails(
  'mailto:no-reply@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    const { room, cid } = req.body || {};
    if (!room || !cid) return res.status(400).json({ error: 'missing fields' });
    const roomKey = String(room).toLowerCase().slice(0, 60);

    const members = await redis.smembers(`dc:members:${roomKey}`);
    const targets = (members || []).filter((m) => m !== cid);

    await Promise.all(
      targets.map(async (memberCid) => {
        const raw = await redis.get(`dc:sub:${roomKey}:${memberCid}`);
        if (!raw) return;
        let entry;
        try {
          entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          return;
        }
        const payload = JSON.stringify({ title: 'Clock', body: 'Naya message aaya' });
        try {
          await webpush.sendNotification(entry.sub, payload);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await redis.del(`dc:sub:${roomKey}:${memberCid}`);
            await redis.srem(`dc:members:${roomKey}`, memberCid);
          }
        }
      })
    );

    res.status(200).json({ ok: true, sent: targets.length });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
};
