import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 토큰이 없습니다. / 認証トークンがありません。' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // 管理者権限(service_role)でSupabaseクライアントを作成
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: '유저를 확인할 수 없습니다. / ユーザーを確認できません。' }, { status: 401 });
    }

    // 1. Stripe 구독 즉시 해지 / Stripeサブスク即時解約
    if (process.env.STRIPE_SECRET_KEY && user.email) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active' });
        
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      }
    }

    // 2. 💡 データを削除する代わりに、退会フラグを立ててサブスク権限をリセット
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_deleted: true,
        is_paid: false,
        stripe_customer_id: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete Account Error:', error);
    return NextResponse.json({ error: '탈퇴 처리 중 오류가 발생했습니다. / 退会処理中にエラーが発生しました。' }, { status: 500 });
  }
}