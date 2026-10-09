'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const fetchRecentUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('is_deleted', true)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) {
        console.error('사용자 목록 가져오기 에러:', error);
      } else if (data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchRecentUsers();
  }, [supabase]);

  const handleLogin = async () => {
    if (!email) {
      alert('이메일을 입력해주세요. / メールアドレスを入力してください。');
      return;
    }

    setAuthLoading(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_deleted')
        .eq('email', email)
        .maybeSingle();

      // 💡 デフォルトの遷移先は受信箱
      let redirectPath = '/letters';

      // 💡 退会済みユーザーへの特別な「おかえりなさい」フロー
      if (profile && profile.is_deleted) {
        const confirmReactivate = confirm('탈퇴한 계정입니다. 다시 결제하고 계정을 복구하시겠습니까?\n/ 退会済みのアカウントです。もう一度決済してアカウントを復帰させますか？');
        
        if (!confirmReactivate) {
          setAuthLoading(false);
          return; // キャンセルした場合はここでストップ
        }
        // 💡 復帰する場合は、確実にStripe決済への強制送還ガードがある /users へ飛ばす
        redirectPath = '/users';
      }

      // 問題なければマジックリンク送信
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
          shouldCreateUser: false, 
        },
      });

      if (error) {
        alert('등록되지 않은 이메일입니다. 신규가입을 진행해주세요.\n/ 登録されていないメールアドレスです。「新規登録」を行ってください。');
      } else {
        alert('✨ 메일함을 확인해주세요! 로그인 링크를 보냈습니다.\n/ メールをご確認ください！ログインリンクを送信しました。');
        setEmail('');
      }
    } catch (error: any) {
      console.error(error);
      alert(`오류 발생 / エラー: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/terms');
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7' }}>
      
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 md:px-8 bg-[#f4efe8] border-b border-[#e6dfd5]">
        <h1 className="text-3xl font-bold text-[#4a3b32] whitespace-nowrap">
          순카페 (純喫茶)
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <input 
            type="email" 
            placeholder="이메일 / メールアドレス" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            className="px-4 py-3 border border-[#d3c9c1] rounded-md text-lg text-[#4a3b32] focus:outline-none focus:ring-2 focus:ring-[#879977] w-full sm:w-64 bg-white placeholder-[#a39891]"
          />
          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
              type="button"
              onClick={handleLogin}
              disabled={authLoading}
              variant="outline" 
              className="flex-1 sm:flex-none border-[#4a3b32] text-[#4a3b32] font-bold hover:bg-[#efebe3] text-lg px-6 py-3 h-auto"
            >
              {authLoading ? '...' : '로그인 / ログイン'}
            </Button>
            <Button 
              type="button"
              onClick={handleSignUp}
              className="flex-1 sm:flex-none bg-[#879977] hover:bg-[#738563] text-white font-bold text-lg px-6 py-3 h-auto"
            >
              신규가입 / 新規登録
            </Button>
          </div>
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
              const isKo = user.native_language === 'ko' || user.native_language === 'Korean';
              const isJa = user.native_language === 'ja' || user.native_language === 'Japanese';
              const flagEmoji = isKo ? '🇰🇷' : isJa ? '🇯🇵' : '';
              
              const bgGradient = isKo 
                ? 'bg-gradient-to-br from-white to-blue-50/50' 
                : isJa 
                ? 'bg-gradient-to-br from-white to-red-50/50' 
                : 'bg-white';

              return (
                <div 
                  key={user.id} 
                  className={`relative overflow-hidden ${bgGradient} p-8 rounded-2xl shadow-sm border border-[#e6dfd5] hover:shadow-md transition-shadow flex items-center`}
                >
                  <div className="w-[200px] border-r border-[#efebe3] pr-6 mr-6 flex-shrink-0 flex flex-col gap-3 relative z-10">
                    {user.mbti && (
                      <span className="inline-block px-4 py-2 bg-[#f0e6dd] text-[#7a5c4d] font-bold rounded-full text-center text-lg w-fit shadow-sm">
                        {user.mbti}
                      </span>
                    )}
                    <span className="font-bold text-[#4a3b32] text-2xl truncate" title={user.nickname}>
                      {user.nickname}
                    </span>
                  </div>
                  
                  {flagEmoji && (
                    <div className="text-[64px] z-10 mr-8 flex-shrink-0 drop-shadow-sm">
                      {flagEmoji}
                    </div>
                  )}

                  <div className="flex-1 relative z-10">
                    <p className="text-[#5c4d44] text-xl leading-relaxed whitespace-pre-wrap">
                      {user.bio || '자기소개가 없습니다. / 自己紹介がありません。'}
                    </p>
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