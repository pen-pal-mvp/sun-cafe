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
      let user = null;
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          user = data.user;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!user) {
        window.location.href = '/';
        return;
      }
      
      setUserId(user.id);
      setLoading(false);
    };
    initProfile();
  }, [router, supabase]);

  const handleSaveAndCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      alert('닉네임을 입력해주세요. / ニックネームを入力してください。');
      return;
    }

    const sanitizedBio = bio.trim().replace(/\n{3,}/g, '\n\n');

    // 💡 外部連絡先・リンクのブロック処理（正規表現）
    const prohibitedRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(https?:\/\/[^\s]+)|(www\.[^\s]+)|((?:line|kakao|카톡|카카오|라인|ID)[\s:：-]*[a-zA-Z0-9_.-]+)/i;

    if (prohibitedRegex.test(trimmedNickname) || prohibitedRegex.test(sanitizedBio)) {
      alert('⚠️ 외부 연락처(이메일, SNS ID)나 링크 입력은 금지되어 있습니다.\n\n⚠️ 外部連絡先（メール、SNSのID）やリンクの記入は禁止されています。');
      return;
    }

    if (trimmedNickname.length > 20 || sanitizedBio.length > 144) {
       alert('글자 수 제한을 초과했습니다. / 文字数制限を超過しています。');
       return;
    }
    
    setSaving(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nickname: trimmedNickname,
        mbti: mbti,
        bio: sanitizedBio,
      })
      .eq('id', userId);

    if (profileError) {
      alert(`프로필 저장 에러 / プロフィール保存エラー: ${profileError.message}`);
      setSaving(false);
      return;
    }

    window.location.href = '/users';
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-xl text-[#4a3b32] font-bold">인증 확인 중... / 認証確認中...</p>
      </main>
    );
  }

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
              <optgroup label="Analyst / 分析가">
                <option value="INTJ">INTJ</option>
                <option value="INTP">INTP</option>
                <option value="ENTJ">ENTJ</option>
                <option value="ENTP">ENTP</option>
              </optgroup>
              <optgroup label="Diplomat / 외교관">
                <option value="INFJ">INFJ</option>
                <option value="INFP">INFP</option>
                <option value="ENFJ">ENFJ</option>
                <option value="ENFP">ENFP</option>
              </optgroup>
              <optgroup label="Sentinel / 관리자">
                <option value="ISTJ">ISTJ</option>
                <option value="ISFJ">ISFJ</option>
                <option value="ESTJ">ESTJ</option>
                <option value="ESFJ">ESFJ</option>
              </optgroup>
              <optgroup label="Explorer / 탐험가">
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