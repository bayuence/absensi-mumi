import type { NextApiRequest, NextApiResponse } from 'next';
import webpush from 'web-push';

// VAPID keys (replace with your own in production)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  'mailto:admin@mumi-bp-kulon.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// In-memory subscriptions (replace with DB in production)
let subscriptions: any[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { title, body, icon } = req.body;
    // Get all subscriptions (in-memory for demo)
    // In production, fetch from DB
    const subsRes = await fetch('http://localhost:3000/api/push-subscribe');
    const allSubs = await subsRes.json();
    let success = 0, fail = 0;
    await Promise.all(
      allSubs.map(async (sub: any) => {
        try {
          await webpush.sendNotification(sub, JSON.stringify({
            title,
            body,
            icon,
            badge: icon,
            url: '/'
          }));
          success++;
        } catch (e) {
          fail++;
        }
      })
    );
    res.status(200).json({ success, fail });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
