'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

function UsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myNativeLanguage, setMyNativeLanguage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializePage = async () => {
      setLoading(true);

      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        setIsVerifying(true);
        try {
          await fetch('/api/stripe/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          window.history.replaceState(null, '', '/users');
        } catch (err) {
          console.error('Verify error:', err);
        }
        if (isMounted) setIsVerifying(false);
      }

      // 💡 認証セッションの取得を数回リトライするロジックに変更
      let user = null;
      for (let i = 0; i < 3; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          user = session.user;
          break; // セッションが取れたらループを抜ける
        }
        // セッションが取れなかったら0.5秒待つ
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!user) {
        // それでもダメなら強制サインアウトしてトップへ
        await supabase.auth.signOut();
        if (isMounted) window.location.href = '/'; 
        return;
      }

      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('nickname, is_deleted, native_language')
        .eq('id', user.id)
        .maybeSingle(); 
      
      if (profileError || !myProfile || !myProfile.nickname || myProfile.nickname.trim() === '') {
        window.location.href = '/profile/new';
        return;
      }

      if (myProfile.is_deleted) {
        alert('탈퇴한 계정입니다. 결제 페이지로 이동합니다.\n\n退会済みのアカウントです。決済ページへ移動します。');
        window.location.href = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '#';
        return;
      }

      if (isMounted) {
        setMyUserId(user.id);
        setMyNativeLanguage(myProfile.native_language);
      }

      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);
      
      const blockedIds = new Set((blocks || []).map(b => b.blocked_id));

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('is_deleted', true) 
        .order('created_at', { ascending: false });
      
      if (!error && data && isMounted) {
        const filteredUsers = data.filter(u => !blockedIds.has(u.id) && u.nickname && u.nickname.trim() !== '');
        setUsers(filteredUsers);
      }
      
      if (isMounted) setLoading(false);
    };

    initializePage();

    return () => { isMounted = false; };
  }, [router, searchParams, supabase]);

  if (isVerifying) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-2xl text-[#4a3b32] font-bold animate-pulse">결제 확인 중... / 決済確認中...</p>
      </main>
    );
  }

  return (
    <>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px 32px', 
        backgroundColor: '#f4efe8', 
        borderBottom: '1px solid #e6dfd5',
      }}>
        <h1 
          className="text-3xl font-bold text-[#4a3b32] cursor-pointer"
          onClick={() => router.push('/')}
        >
          순카페 (純喫茶)
        </h1>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Button 
            onClick={() => router.push('/letters')}
            className="bg-[#879977] hover:bg-[#738563] text-white font-bold text-lg px-6 py-3 h-auto"
          >
            수신함 / 受信箱
          </Button>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <h2 className="text-3xl font-bold text-[#4a3b32] mb-10 pb-6 border-b border-[#e6dfd5]">
          유저 목록 / ユーザー一覧
        </h2>

        {loading ? (
          <div className="text-center text-[#a39891] text-xl py-10">
            데이터를 불러오는 중입니다... / 読み込み中...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-[#a39891] text-xl py-10">
            등록된 사용자가 없습니다. / 登録されたユーザーがいません。
          </div>
        ) : (
          <div className="space-y-8">
            {users.map((user) => {
              const isKo = user.native_language === 'Korean' || user.native_language === 'ko';
              const isJa = user.native_language === 'Japanese' || user.native_language === 'ja';
              const flagEmoji = isKo ? '🇰🇷' : isJa ? '🇯🇵' : '☕';
              
              const isSameNative = myNativeLanguage === user.native_language;
              const isMe = myUserId === user.id;
              const isMatchable = !isSameNative && !isMe; 
              
              const bgGradient = isKo 
                ? 'bg-gradient-to-br from-white to-blue-50/50' 
                : isJa 
                ? 'bg-gradient-to-br from-white to-red-50/50' 
                : 'bg-white';

              return (
                <div 
                  key={user.id}
                  onClick={() => {
                    if (isMatchable) {
                      router.push(`/letters/new?receiver_id=${user.id}`);
                    }
                  }}
                  className={`relative overflow-hidden ${bgGradient} p-8 rounded-2xl shadow-sm border border-[#e6dfd5] transition-all duration-300 flex items-center group
                    ${isMatchable 
                      ? 'hover:shadow-md hover:border-[#879977] hover:-translate-y-1 cursor-pointer' 
                      : 'cursor-default' 
                    }`}
                >
                  {isMe && (
                    <div className="absolute top-4 right-4 bg-[#e6dfd5] text-[#7a5c4d] px-3 py-1 rounded-full text-sm font-bold z-20">
                      나 / 自分
                    </div>
                  )}

                  <div className="w-[200px] border-r border-[#efebe3] pr-6 mr-6 flex-shrink-0 flex flex-col gap-3 relative z-10">
                    {user.mbti && (
                      <span className="inline-block px-4 py-2 bg-[#f0e6dd] text-[#7a5c4d] font-bold rounded-full text-center text-lg w-fit shadow-sm">
                        {user.mbti}
                      </span>
                    )}
                    <span className={`font-bold text-2xl truncate transition-colors text-[#4a3b32] ${isMatchable ? 'group-hover:text-[#879977]' : ''}`} title={user.nickname}>
                      {user.nickname}
                    </span>
                  </div>
                  
                  {flagEmoji && (
                    <div className="text-[64px] z-10 mr-8 flex-shrink-0 drop-shadow-sm">
                      {flagEmoji}
                    </div>
                  )}

                  <div className="flex-1 relative z-10">
                    <p className="text-[#5c4d44] text-xl leading-relaxed whitespace-pre-wrap line-clamp-3">
                      {user.bio || '자기소개가 없습니다. / 自己紹介がありません。'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function Users() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7' }}>
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <p className="text-xl text-[#4a3b32] font-bold">로딩 중... / 読み込み中...</p>
        </div>
      }>
        <UsersContent />
      </Suspense>
    </main>
  );
}