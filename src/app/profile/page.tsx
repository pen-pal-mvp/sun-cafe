'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

export default function Profile() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    nickname: '',
    mbti: 'ENFP',
    bio: ''
  });

  const NICKNAME_MAX_CHARS = 20;
  const BIO_MAX_CHARS = 144;

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut();
        window.location.href = '/';
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('nickname, mbti, bio, is_deleted')
        .eq('id', user.id)
        .maybeSingle();

      // 💡 未決済（profilesにデータが存在しない）または退会済みの場合はトップページ(/)へ強制送還
      if (error || !data || data.is_deleted) {
        await supabase.auth.signOut();
        window.location.href = '/';
        return;
      }

      setProfile({
        nickname: data.nickname || '',
        mbti: data.mbti || 'ENFP',
        bio: data.bio || ''
      });
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNickname = profile.nickname.trim();
    if (!trimmedNickname) {
      alert('닉네임을 입력해주세요. / ニックネームを入力してください。');
      return;
    }

    const sanitizedBio = profile.bio.trim().replace(/\n{3,}/g, '\n\n');

    const prohibitedRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(https?:\/\/[^\s]+)|(www\.[^\s]+)|((?:line|kakao|카톡|카카오|라인|ID)[\s:：-]*[a-zA-Z0-9_.-]+)/i;

    if (prohibitedRegex.test(trimmedNickname) || prohibitedRegex.test(sanitizedBio)) {
      alert('⚠️ 외부 연락처(이메일, SNS ID)나 링크 입력은 금지되어 있습니다.\n\n⚠️ 外部連絡先（メール、SNSのID）やリンクの記入は禁止されています。');
      return;
    }

    if (trimmedNickname.length > NICKNAME_MAX_CHARS || sanitizedBio.length > BIO_MAX_CHARS) {
      alert('글자 수 제한을 초과했습니다. / 文字数制限を超えています。');
      return;
    }

    setSaving(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      await supabase.auth.signOut();
      window.location.href = '/';
      return;
    }

    const { data: updatedData, error } = await supabase
      .from('profiles')
      .update({
        nickname: trimmedNickname,
        mbti: profile.mbti,
        bio: sanitizedBio,
      })
      .eq('id', user.id)
      .select();

    if (error) {
      alert(`저장 중 오류가 발생했습니다 / 保存エラーが発生しました: ${error.message}`);
      setSaving(false);
      return;
    }

    if (!updatedData || updatedData.length === 0) {
      await supabase.auth.signOut();
      window.location.href = '/';
      return;
    }

    alert('저장되었습니다. / 保存されました。');
    router.push('/letters');
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-xl text-[#4a3b32] font-bold">로딩 중... / 読み込み中...</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7' }}>
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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <h2 className="text-3xl font-bold text-[#4a3b32] mb-10 pb-6 border-b border-[#e6dfd5]">프로필 설정 / プロフィール設定</h2>
        
        <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-[#e6dfd5] space-y-8">
          
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="block text-xl font-bold text-[#4a3b32]">닉네임 / ニックネーム</label>
              <span className={`text-sm font-medium ${profile.nickname.length >= NICKNAME_MAX_CHARS ? 'text-red-600 font-bold' : 'text-[#a39891]'}`}>
                {profile.nickname.length} / {NICKNAME_MAX_CHARS}
              </span>
            </div>
            <input 
              type="text"
              value={profile.nickname}
              onChange={(e) => setProfile({...profile, nickname: e.target.value})}
              maxLength={NICKNAME_MAX_CHARS}
              required
              className="w-full px-4 py-3 border border-[#d3c9c1] rounded-md text-lg text-[#4a3b32] focus:outline-none focus:ring-2 focus:ring-[#879977]"
              placeholder="닉네임을 입력하세요 / ニックネームを入力してください"
            />
          </div>

          <div>
            <label className="block text-xl font-bold text-[#4a3b32] mb-3">MBTI</label>
            <select 
              value={profile.mbti}
              onChange={(e) => setProfile({...profile, mbti: e.target.value})}
              className="w-full px-4 py-3 border border-[#d3c9c1] rounded-md text-lg text-[#4a3b32] focus:outline-none focus:ring-2 focus:ring-[#879977] bg-white"
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
              <label className="block text-xl font-bold text-[#4a3b32]">자기소개 / 自己紹介</label>
              <span className={`text-sm font-medium ${profile.bio.length >= BIO_MAX_CHARS ? 'text-red-600 font-bold' : 'text-[#a39891]'}`}>
                {profile.bio.length} / {BIO_MAX_CHARS}
              </span>
            </div>
            <textarea 
              rows={6}
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              maxLength={BIO_MAX_CHARS}
              className="w-full px-4 py-3 border border-[#d3c9c1] rounded-md text-lg text-[#4a3b32] focus:outline-none focus:ring-2 focus:ring-[#879977] resize-none"
              placeholder="자기소개를 입력하세요 / 自己紹介を入力してください"
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={saving} 
              className="w-full bg-[#879977] hover:bg-[#738563] text-white font-bold text-2xl px-6 py-6 h-auto shadow-sm rounded-lg"
            >
              {saving ? '저장 중... / 保存中...' : '저장하기 / 保存する'}
            </Button>
          </div>

        </form>
      </div>
    </main>
  );
}
