const { Redis } = require('@upstash/redis');
const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    const { room, cid, name, sub } = req.body || {};
    if (!room || !cid || !sub || !sub.endpoint) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const roomKey = String(room).toLowerCase().slice(0, 60);
    await redis.set(`dc:sub:${roomKey}:${cid}`, JSON.stringify({ name: name || '', sub }));
    await redis.sadd(`dc:members:${roomKey}`, cid);
    await redis.expire(`dc:sub:${roomKey}:${cid}`, 60 * 60 * 24 * 60); // 60 days
    await redis.expire(`dc:members:${roomKey}`, 60 * 60 * 24 * 60);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
};
