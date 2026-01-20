import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const { endpoint, keys, username, device_info } = await request.json();

        if (!endpoint || !keys) {
            return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
        }

        // Simpan ke database Supabase
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                endpoint: endpoint,
                keys: JSON.stringify(keys),
                username: username || 'guest',
                device_info: device_info
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error in push-subscribe:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
