import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const { data, error } = await supabase
        .from('pollution_sensors')
        .select('id')
        .limit(1);

    if (error) {
        return NextResponse.json(
            { status: 'error', message: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        status: 'ok',
        sensors_available: data?.length ?? 0
    });
}
