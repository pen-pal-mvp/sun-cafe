import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const { user_id, email, is_returning, lang, learn } = await req.json();

    if (!user_id || !email) {
      return NextResponse.json({ error: 'User ID and Email are required.' }, { status: 400 });
    }

    const nativeLanguage = lang || 'ko';

    let priceId = '';
    let paymentMethodTypes: string[] = [];

    // 韓国語（ko）の場合
    if (nativeLanguage === 'ko' || nativeLanguage === 'Korean') {
      priceId = process.env.STRIPE_PRICE_ID_KRW || '';
      paymentMethodTypes = ['card', 'kakao_pay']; 
    } 
    // 日本語（ja）またはその他の場合（デフォルト）
    else {
      priceId = process.env.STRIPE_PRICE_ID_JPY || '';
      paymentMethodTypes = ['card'];
    }

    if (!priceId) {
      console.error(`Missing Stripe Price ID for language: ${nativeLanguage}`);
      return NextResponse.json({ error: 'Stripe Price ID is not configured properly.' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16' as any,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      mode: 'subscription',
      customer_email: email,
      client_reference_id: user_id,
      line_items: [
        {
          price: priceId, 
          quantity: 1,
        },
      ],
      // 💡 戻り先を全員一律で /users に固定！
      success_url: `${baseUrl}/users?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        user_id: user_id,
        email: email,
        native_language: lang || 'ko',
        learning_language: learn || 'ja'
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Checkout session creation failed.' }, { status: 500 });
  }
}