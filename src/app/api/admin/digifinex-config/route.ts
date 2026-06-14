import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type JobName = 'buy1' | 'buy2' | 'sell1' | 'sell2';
const VALID_JOBS: ReadonlyArray<JobName> = ['buy1', 'buy2', 'sell1', 'sell2'];

interface PatchBody {
  name: JobName;
  symbol?: string;
  amount?: number;
  price?: number;
  coupon_issued?: number;
  coupon_used?: number;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!VALID_JOBS.includes(body.name)) {
    return NextResponse.json({ error: 'Invalid job name' }, { status: 400 });
  }

  const patch: Record<string, string | number | null> = {
    updated_by: user.id,
  };
  if (typeof body.symbol === 'string') patch.symbol = body.symbol.trim().toLowerCase();
  if (typeof body.amount === 'number' && Number.isFinite(body.amount) && body.amount >= 0)
    patch.amount = body.amount;
  if (typeof body.price === 'number' && Number.isFinite(body.price) && body.price >= 0)
    patch.price = body.price;
  if (typeof body.coupon_issued === 'number' && Number.isFinite(body.coupon_issued))
    patch.coupon_issued = Math.max(0, Math.floor(body.coupon_issued));
  if (typeof body.coupon_used === 'number' && Number.isFinite(body.coupon_used))
    patch.coupon_used = Math.max(0, Math.floor(body.coupon_used));

  const { data, error } = await supabase
    .from('digifinex_cron_config')
    .update(patch)
    .eq('name', body.name)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/admin/cron-config');

  return NextResponse.json({ ok: true, config: data });
}
