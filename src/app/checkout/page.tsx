'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// 💡 実際の処理を行うコンポーネントを分離
function CheckoutContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams(); // 💡 クエリパラメータを取得

  useEffect(() => {
    const processCheckout = async () => {
      // マジックリンクの認証トークンを処理してセッションを取得
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // セッションが取れなかった場合はトップへ
        router.push('/');
        return;
      }

      // 💡 URLからパラメータをキャッチ
      const isReturning = searchParams.get('returning') === 'true';
      const lang = searchParams.get('lang') || 'ko'; // 見つからなければデフォルト韓国語
      const learn = searchParams.get('learn') || 'ja';

      try {
        // Stripeの決済URLを生成してリダイレクト
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: session.user.id, 
            email: session.user.email,
            is_returning: isReturning, 
            lang: lang,   
            learn: learn  
          }),
        });
        
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url; 
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error(error);
        alert('결제 준비 중 오류가 발생했습니다. / 決済の準備中にエラーが発生しました。');
      }
    };

    processCheckout();
  }, [router, supabase, searchParams]);

  return (
    <p className="text-2xl text-[#4a3b32] font-bold animate-pulse">
      결제 화면으로 이동 중입니다... / 決済画面へ移動中です...
    </p>
  );
}

// 💡 大元のページコンポーネント（ここでSuspenseで包む）
export default function CheckoutRedirect() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Suspense fallback={<p className="text-2xl text-[#4a3b32] font-bold">로딩 중... / 読み込み中...</p>}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}