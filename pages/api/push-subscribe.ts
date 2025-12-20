import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory store for demo (replace with DB in production)
let subscriptions: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const body = req.body;
    if (!body || !body.endpoint) {
      res.status(400).json({ error: 'Invalid subscription' });
      return;
    }
    // Avoid duplicate
    if (!subscriptions.find((s) => s.endpoint === body.endpoint)) {
      subscriptions.push(body);
    }
    res.status(200).json({ success: true });
  } else if (req.method === 'GET') {
    res.status(200).json(subscriptions);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
