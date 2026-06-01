import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('point_balance_history')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'No point balance recorded yet' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: data.id,
    recorded_at: data.recorded_at,
    j_value_usd: Number(data.j_value),
    j_value_jpy: data.j_value_jpy != null ? Number(data.j_value_jpy) : null,
    fx_rate_jpy_per_usd:
      data.fx_rate_jpy_per_usd != null
        ? Number(data.fx_rate_jpy_per_usd)
        : null,
    v_value: Number(data.v_value),
    params: {
      a: Number(data.param_a),
      b: Number(data.param_b),
      c: Number(data.param_c),
    },
    note: data.note,
  });
}
