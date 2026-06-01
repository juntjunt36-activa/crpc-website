import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const RANGES: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: 36500,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = (searchParams.get('range') ?? '30d').toLowerCase();
  const days = RANGES[range] ?? RANGES['30d'];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('point_balance_history')
    .select('recorded_at, j_value, j_value_jpy, v_value, note')
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    range,
    points: (data ?? []).map((row) => ({
      recorded_at: row.recorded_at,
      j_value: Number(row.j_value),
      j_value_jpy: row.j_value_jpy != null ? Number(row.j_value_jpy) : null,
      v_value: Number(row.v_value),
      note: row.note,
    })),
  });
}
