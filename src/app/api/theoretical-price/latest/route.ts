import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calculateTheoreticalPrice, getCurrentPriceParams } from '@/lib/pricing';

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

  // Fall back to a live computation against current params if no row exists yet.
  if (!data) {
    return NextResponse.json(
      { error: 'No point balance recorded yet', params: getCurrentPriceParams() },
      { status: 404 },
    );
  }

  // Use the snapshotted params from the row so historical V is reproducible
  // even if a, b, c change later.
  const params = {
    a: Number(data.param_a),
    b: Number(data.param_b),
    c: Number(data.param_c),
  };
  const j = Number(data.j_value);
  const v = calculateTheoreticalPrice(j, params);

  return NextResponse.json({
    j_value: j,
    v_value: v,
    v_value_stored: Number(data.v_value),
    params,
    recorded_at: data.recorded_at,
  });
}
