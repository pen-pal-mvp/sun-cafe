'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

export default function Letters() {
  const router = useRouter();
  const supabase = createClient();
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndFetchLetters = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (isMounted) setLoading(false);
          return;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          await supabase.auth.signOut();
          router.replace('/');
          return;
        }

        const localSignIn = new Date(session.user.last_sign_in_at || 0).getTime();
        const serverSignIn = new Date(user.last_sign_in_at || 0).getTime();

        if (serverSignIn > localSignIn + 2000) {
          alert('다른 기기에서 로그인이 감지되어 자동 로그아웃됩니다.\n\n別の端末でのログインが検知されたため、自動的にログアウトします。');
          await supabase.auth.signOut();
          window.location.href = '/';
          return;
        }

        const { data: myProfile } = await supabase
          .from('profiles')
          .select('is_deleted')
          .eq('id', user.id)
          .single();

        if (myProfile?.is_deleted) {
          alert('탈퇴한 계정입니다. 결제 페이지로 이동합니다.\n\n退会済みのアカウントです。決済ページへ移動します。');
          window.location.href = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '#';
          return;
        }

        const blockedIds = new Set<string>();
        const { data: blocks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id);
        if (blocks) blocks.forEach(block => blockedIds.add(block.blocked_id));

        const { data: lettersData, error: lettersError } = await supabase
          .from('letters')
          .select('*')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false });
        
        if (lettersError) throw new Error(lettersError.message);

        if (lettersData && lettersData.length > 0) {
          const filteredLetters = lettersData.filter(letter => !blockedIds.has(letter.sender_id));

          if (filteredLetters.length === 0) {
            if (isMounted) setLetters([]);
          } else {
            const senderIds = Array.from(new Set(filteredLetters.map(l => l.sender_id)));
            
            // 💡 native_language を取得するように変更
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, nickname, is_deleted, native_language')
              .in('id', senderIds);
              
            if (profilesError) throw new Error(profilesError.message);

            const profileMap: Record<string, { nickname: string, is_deleted: boolean, native_language: string }> = {};
            if (profilesData) {
              profilesData.forEach(p => {
                profileMap[p.id] = { nickname: p.nickname, is_deleted: p.is_deleted, native_language: p.native_language || 'ko' };
              });
            }

            const enrichedLetters = filteredLetters.map(letter => {
              const profile = profileMap[letter.sender_id];
              const senderName = profile?.is_deleted 
                ? '탈퇴한 유저 / 退会したユーザー' 
                : (profile?.nickname || '이름 없음 (名無し)');
                
              return { ...letter, sender_name: senderName, sender_native: profile?.native_language };
            });
            
            if (isMounted) setLetters(enrichedLetters);
          }
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuthAndFetchLetters();
    return () => { isMounted = false; };
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('정말로 탈퇴하시겠습니까? 결제가 취소되며, 더 이상 새로운 편지를 받을 수 없습니다.\n\n本当に退会しますか？決済がキャンセルされ、新しい手紙を受け取ることができなくなります。');
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsDeleting(false);
        return;
      }
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '탈퇴 처리 실패 / 退会処理に失敗しました');
      
      alert('탈퇴 처리가 완료되었습니다. 이용해 주셔서 감사합니다.\n\n退会処理が完了しました。ご利用ありがとうございました。');
      await supabase.auth.signOut();
      router.push('/');
    } catch (error: any) {
      console.error(error);
      alert(`탈퇴 실패 / 退会失敗: ${error.message}`);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const dateObj = new Date(dateString);
      return `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
    } catch { return '날짜 불명 / 日付不明'; }
  };

  if (isDeleting) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-xl text-red-600 font-bold animate-pulse">회원 탈퇴 처리 중입니다... / 退会処理を実行中です...</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7' }}>
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6 p-6 lg:px-8 bg-[#f4efe8] border-b border-[#e6dfd5]">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
          <h1 
            className="text-3xl font-bold text-[#4a3b32] cursor-pointer whitespace-nowrap" 
            onClick={() => router.push('/users')}
          >
            순카페 (純喫茶)
          </h1>
          <Button 
            variant="outline" 
            className="border-red-300 text-red-500 font-bold hover:bg-red-50 text-lg px-6 py-3 h-auto w-full sm:w-auto" 
            onClick={handleDeleteAccount}
          >
            회원 탈퇴 / 退会
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto flex-wrap justify-center">
          <Button 
            variant="outline" 
            className="border-[#4a3b32] text-[#4a3b32] font-bold hover:bg-[#efebe3] text-lg px-6 py-3 h-auto w-full sm:w-auto" 
            onClick={() => router.push('/users')}
          >
            펜팔 찾기 / 文通相手を探す
          </Button>
          <Button 
            variant="outline" 
            className="border-[#4a3b32] text-[#4a3b32] font-bold hover:bg-[#efebe3] text-lg px-6 py-3 h-auto w-full sm:w-auto" 
            onClick={() => router.push('/profile')}
          >
            프로필 설정 / プロフィール設定
          </Button>
          <Button 
            className="bg-[#4a3b32] hover:bg-[#362b24] text-white font-bold text-lg px-6 py-3 h-auto w-full sm:w-auto" 
            onClick={handleLogout}
          >
            로그아웃 / ログアウト
          </Button>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <h2 className="text-3xl font-bold text-[#4a3b32] mb-10 pb-6 border-b border-[#e6dfd5]">
          수신함 / 受信箱
        </h2>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-6 bg-white p-8 rounded-2xl border border-[#e6dfd5]">
                <div className="w-14 h-14 bg-[#f0e6dd] rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-4 py-2">
                  <div className="h-5 bg-[#f0e6dd] rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-[#f0e6dd] rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#e6dfd5] shadow-sm">
            <div className="text-7xl mb-6 drop-shadow-sm">📭</div>
            <h3 className="text-2xl font-bold text-[#4a3b32] mb-3">아직 도착한 편지가 없습니다.</h3>
            <p className="text-[#a39891] text-lg mb-10">まだ手紙は届いていません。</p>
            <Button onClick={() => router.push('/users')} className="bg-[#879977] hover:bg-[#738563] text-white font-bold text-lg px-8 py-4 h-auto rounded-full shadow-md">
              펜팔 찾기 / 新しい文通相手を探す
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {letters.map((letter) => {
              // 💡 native_language に基づいて国旗を設定
              const isKo = letter.sender_native === 'ko' || letter.sender_native === 'Korean';
              const isJa = letter.sender_native === 'ja' || letter.sender_native === 'Japanese';
              const flagEmoji = isKo ? '🇰🇷' : isJa ? '🇯🇵' : '☕';

              return (
                <div key={letter.id} className="group bg-white p-8 rounded-2xl shadow-sm border border-[#e6dfd5] hover:shadow-md hover:border-[#879977] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex gap-6 items-center" onClick={() => router.push(`/letters/${letter.id}`)}>
                  {/* 💡 国旗を表示 */}
                  <div className="w-14 h-14 bg-[#f4efe8] group-hover:bg-[#eaf0e6] transition-colors rounded-full flex items-center justify-center text-4xl flex-shrink-0 drop-shadow-sm">
                    {flagEmoji}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-[#4a3b32] text-2xl truncate pr-4">{letter.sender_name}</p>
                      <span className="text-[#879977] text-sm font-semibold tracking-widest font-mono flex-shrink-0">{formatDate(letter.created_at)}</span>
                    </div>
                    <p className="text-[#a39891] text-lg mt-2 font-medium">새로운 편지가 도착했습니다. / 新しい手紙が届きました ✉</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}