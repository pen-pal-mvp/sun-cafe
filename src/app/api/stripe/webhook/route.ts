import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-08-26.dahlia',
});

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id || session.metadata?.user_id;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const email = session.customer_details?.email || session.metadata?.email;
    
    if (userId) {
      // 🛡️ 防波堤: 上書きする前に、既存のプロフィール（言語データ）があるか確認する！
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('native_language, learning_language')
        .eq('id', userId)
        .maybeSingle();

      // 💡 既存のデータがあればそれを最優先し、完全な新規ユーザーの場合のみStripeのデータを使う
      const nativeLanguage = existingProfile?.native_language || session.metadata?.native_language || 'ko';
      const learningLanguage = existingProfile?.learning_language || session.metadata?.learning_language || 'ja';

      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: email || '',
          is_paid: true,
          is_deleted: false, // 退会からの復帰！
          stripe_customer_id: customerId,
          native_language: nativeLanguage,
          learning_language: learningLanguage
        }, {
          onConflict: 'id'
        });

    } else if (email) {
      // ユーザーIDがない場合のフォールバック処理
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('native_language, learning_language')
        .eq('email', email)
        .maybeSingle();

      const nativeLanguage = existingProfile?.native_language || session.metadata?.native_language || 'ko';
      const learningLanguage = existingProfile?.learning_language || session.metadata?.learning_language || 'ja';

      await supabaseAdmin
        .from('profiles')
        .update({
          is_paid: true,
          is_deleted: false,
          stripe_customer_id: customerId,
          native_language: nativeLanguage,
          learning_language: learningLanguage
        })
        .eq('email', email);
    }
  }
  return NextResponse.json({ received: true });
}