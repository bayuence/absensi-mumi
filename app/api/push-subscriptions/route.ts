import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data: subs, error } = await supabase
            .from('push_subscriptions')
            .select('username, device_info, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: subs?.length || 0,
            subscriptions: subs?.map(s => ({
                username: s.username,
                device: s.device_info?.substring(0, 50) + '...',
                created_at: s.created_at
            })) || []
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
