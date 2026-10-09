import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-08-26.dahlia',
    });

    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
    
    const email = checkoutSession.customer_details?.email || checkoutSession.customer_email || null;
    const userId = checkoutSession.client_reference_id || null;
    const stripeCustomerId = typeof checkoutSession.customer === 'string' 
      ? checkoutSession.customer 
      : checkoutSession.customer?.id || null;

    const nativeLanguage = checkoutSession.metadata?.native_language || 'ko';
    const learningLanguage = checkoutSession.metadata?.learning_language || 'ja';

    if (checkoutSession.payment_status === 'paid') {
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const updateData = {
          is_paid: true, 
          is_deleted: false,
          stripe_customer_id: stripeCustomerId,
          native_language: nativeLanguage,
          learning_language: learningLanguage,
          updated_at: new Date().toISOString() 
        };

        if (userId) {
          await supabase.from('profiles').update(updateData).eq('id', userId);
        } else if (email) {
          await supabase.from('profiles').update(updateData).eq('email', email);
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        email: email, 
        user_id: userId,
        customer_id: stripeCustomerId
      });
      
    } else {
      return NextResponse.json({ error: 'Payment not completed.' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed.' }, { status: 500 });
  }
}