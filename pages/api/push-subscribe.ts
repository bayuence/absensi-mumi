
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabaseClient';

// Tabel: push_subscriptions
// Struktur minimal: id (serial), endpoint (text, unique), keys (json/text), created_at (timestamp)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const body = req.body;
    if (!body || !body.endpoint) {
      res.status(400).json({ error: 'Invalid subscription' });
      return;
    }
    // Cek duplikat endpoint
    const { data: existing, error: findError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', body.endpoint)
      .single();
    if (!existing) {
      // Simpan subscription baru dengan username & device_info
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert([
          {
            endpoint: body.endpoint,
            keys: body.keys ? JSON.stringify(body.keys) : null,
            created_at: new Date().toISOString(),
            username: body.username || null,
            device_info: body.device_info || null,
          }
        ]);
      if (insertError) {
        res.status(500).json({ error: 'Failed to save subscription' });
        return;
      }
    }
    res.status(200).json({ success: true });
  } else if (req.method === 'GET') {
    // Ambil semua subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*');
    if (error) {
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
      return;
    }
    // Format sesuai web-push
    const formatted = (data || []).map((sub: any) => ({
      endpoint: sub.endpoint,
      keys: sub.keys ? JSON.parse(sub.keys) : {},
    }));
    res.status(200).json(formatted);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
