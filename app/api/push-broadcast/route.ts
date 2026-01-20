import { NextResponse } from 'next/server';
import webPush from 'web-push';
import supabase from '@/lib/supabaseClient';

// Konfigurasi VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webPush.setVapidDetails(
        'mailto:admin@absensimumi.com',
        vapidPublicKey,
        vapidPrivateKey
    );
    console.log('✅ VAPID keys configured successfully');
} else {
    console.warn("⚠️ VAPID Keys belum disetting di environment variables (.env)");
}

export async function POST(request: Request) {
    console.log('📤 Push broadcast request received');

    try {
        const { title, body, icon, url } = await request.json();
        console.log('📋 Notification content:', { title, body, icon, url });

        if (!vapidPublicKey || !vapidPrivateKey) {
            console.error('❌ VAPID keys not configured');
            return NextResponse.json({ error: 'Server VAPID keys not configured' }, { status: 500 });
        }

        // Ambil semua subscription
        const { data: subs, error } = await supabase
            .from('push_subscriptions')
            .select('*');

        if (error) {
            console.error('❌ Database error:', error);
            return NextResponse.json({ error: 'Gagal mengambil data subscription: ' + error.message }, { status: 500 });
        }

        if (!subs || subs.length === 0) {
            console.log('⚠️ No subscriptions found in database');
            return NextResponse.json({
                success: false,
                message: 'Tidak ada device yang terdaftar untuk menerima notifikasi',
                count: 0
            });
        }

        console.log(`📱 Found ${subs.length} subscriptions`);

        const payload = JSON.stringify({
            title: title || 'Notifikasi Baru',
            body: body || '',
            icon: icon || '/logo-ldii.png',
            url: url || '/dashboard',
            tag: `notif-${Date.now()}`, // Unique tag untuk setiap notifikasi
        });

        const results = {
            success: 0,
            failed: 0,
            expired: 0,
            errors: [] as string[]
        };

        const promises = subs.map(async (sub) => {
            let subscriptionKeys = { auth: '', p256dh: '' };

            try {
                // Handle if keys is string (JSON) or already object
                subscriptionKeys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
            } catch (e) {
                console.error(`❌ Error parsing keys for ${sub.username}:`, e);
                results.failed++;
                results.errors.push(`Parse error for ${sub.username}`);
                return;
            }

            if (!subscriptionKeys?.auth || !subscriptionKeys?.p256dh) {
                console.error(`❌ Invalid keys for ${sub.username}`);
                results.failed++;
                results.errors.push(`Invalid keys for ${sub.username}`);
                return;
            }

            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    auth: subscriptionKeys.auth,
                    p256dh: subscriptionKeys.p256dh
                }
            };

            try {
                await webPush.sendNotification(pushSubscription as webPush.PushSubscription, payload);
                console.log(`✅ Sent to ${sub.username || 'unknown'} (${sub.device_info?.substring(0, 30) || 'unknown device'})`);
                results.success++;
            } catch (err: any) {
                // Log detailed error info for debugging
                console.error(`❌ Push error for ${sub.username}:`, {
                    statusCode: err.statusCode,
                    message: err.message,
                    body: err.body,
                    endpoint: sub.endpoint?.substring(0, 50) + '...'
                });

                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired/invalid, hapus dari DB
                    console.log(`🗑️ Removing expired subscription for ${sub.username}: ${err.statusCode}`);
                    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                    results.expired++;
                } else if (err.statusCode === 429) {
                    console.error(`⏳ Rate limited for ${sub.username}`);
                    results.failed++;
                    results.errors.push(`Rate limited for ${sub.username}`);
                } else if (err.statusCode === 401 || err.statusCode === 403) {
                    // VAPID key issues or authorization problems
                    console.error(`🔐 Auth error for ${sub.username}: ${err.statusCode} - Mungkin masalah VAPID key atau endpoint tidak valid`);
                    // Hapus subscription yang bermasalah
                    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                    results.failed++;
                    results.errors.push(`${sub.username}: Auth error ${err.statusCode}`);
                } else {
                    console.error(`❌ Error sending to ${sub.username}:`, err.message || err);
                    results.failed++;
                    results.errors.push(`${sub.username}: ${err.message || 'Unknown error'} (${err.statusCode || 'no code'})`);
                }
            }
        });

        await Promise.all(promises);

        console.log('📊 Broadcast results:', results);

        return NextResponse.json({
            success: true,
            total: subs.length,
            sent: results.success,
            failed: results.failed,
            expired: results.expired,
            message: `Berhasil mengirim ke ${results.success}/${subs.length} device`
        });
    } catch (err: any) {
        console.error('❌ Error in push-broadcast:', err);
        return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
    }
}

