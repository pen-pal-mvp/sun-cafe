'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NewProfile() {
  const [nickname, setNickname] = useState('');
  const [mbti, setMbti] = useState('ENFP');
  const [bio, setBio] = useState('');
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // 未ログインの場合はトップへ戻す
        router.push('/');
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
    };
    initProfile();
  }, [router, supabase]);

  const handleSaveAndCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.length > 20 || bio.length > 144 || !userId) return;
    
    setSaving(true);

    // 💡 修正ポイント：Webhookが作成したデータを壊さないよう、.update() を使用する！
    // 言語情報はWebhookですでに保存されているため、ここでは送信しない
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nickname: nickname,
        mbti: mbti,
        bio: bio,
      })
      .eq('id', userId);

    if (profileError) {
      alert(`프로필 저장 에러 / プロフィール保存エラー: ${profileError.message}`);
      setSaving(false);
      return;
    }

    // 保存できたらユーザー一覧画面（/users）へ遷移！
    router.push('/users');
  };

  if (loading) return null;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', padding: '48px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e6dfd5' }}>
        
        <h1 className="text-3xl font-bold text-[#4a3b32] mb-8 pb-6 border-b border-[#e6dfd5] text-center">
          프로필 생성 / プロフィール作成
        </h1>

        <p className="text-center text-[#879977] font-bold mb-8 bg-[#eaf3e1] p-4 rounded-lg border border-[#879977]">
          결제가 완료되었습니다! 프로필을 완성해주세요.<br/>決済が完了しました！プロフィールを完成させてください。
        </p>

        <form onSubmit={handleSaveAndCheckout} className="space-y-8">
          
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="block text-xl font-bold text-[#4a3b32]">
                닉네임 / ニックネーム <span className="text-red-500">*</span>
              </label>
              <span className={`text-sm font-medium ${nickname.length >= 20 ? 'text-red-600 font-bold' : 'text-[#a39891]'}`}>
                {nickname.length} / 20
              </span>
            </div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              required
              className="w-full px-4 py-3 border border-[#d3c9c1] rounded-md text-lg text-[#4a3b32] focus:outline-none focus:ring-2 focus:ring-[#879977]"
              placeholder="예: SunCafe Taro / 例: SunCafe Taro"
            />
          </div>

          <div>
            <label className="block text-xl font-bold text-[#4a3b32] mb-3">
              MBTI
            </label>
            <select
              value={mbti}
              onChange={(e) => setMbti(e.target.value)}
              className="w-full px-4 py-3 border border-[#d3c9c1] rounded-md text-lg text-[#4a3b32] bg-white focus:outline-none focus:ring-2 focus:ring-[#879977]"
            >
              <optgroup label="Analyst / 分析家">
                <option value="INTJ">INTJ</option>
                <option value="INTP">INTP</option>
                <option value="ENTJ">ENTJ</option>
                <option value="ENTP">ENTP</option>
              </optgroup>
              <optgroup label="Diplomat / 外交官">
                <option value="INFJ">INFJ</option>
                <option value="INFP">INFP</option>
                <option value="ENFJ">ENFJ</option>
                <option value="ENFP">ENFP</option>
              </optgroup>
              <optgroup label="Sentinel / 番人">
                <option value="ISTJ">ISTJ</option>
                <option value="ISFJ">ISFJ</option>
                <option value="ESTJ">ESTJ</option>
                <option value="ESFJ">ESFJ</option>
              </optgroup>
              <optgroup label="Explorer / 探検家">
                <option value="ISTP">ISTP</option>
                <option value="ISFP">ISFP</option>
                <option value="ESTP">ESTP</option>
                <option value="ESFP">ESFP</option>
              </optgroup>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="block text-xl font-bold text-[#4a3b32]">
                자기소개 / 自己紹介
              </label>
              <span className={`text-sm font-medium ${bio.length >= 144 ? 'text-red-600 font-bold' : 'text-[#a39891]'}`}>
                {bio.length} / 144
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={144}
              rows={5}
              className="w-full px-4 py-3 border border-[#d3c9c1] rounded-md text-lg text-[#4a3b32] bg-white focus:outline-none focus:ring-2 focus:ring-[#879977] resize-none"
              placeholder="취미나 좋아하는 것에 대해 적어보세요! / 趣味や好きなことについて書いてみましょう！"
            ></textarea>
          </div>

          <div className="pt-6">
            <Button 
              type="submit" 
              disabled={saving} 
              className="w-full bg-[#879977] hover:bg-[#738563] text-white font-bold text-2xl px-6 py-6 h-auto shadow-sm rounded-lg"
            >
              {saving ? '처리 중... / 処理中...' : '완료하고 시작하기 / 完了して始める'}
            </Button>
          </div>
        </form>

      </div>
    </main>
  );
}