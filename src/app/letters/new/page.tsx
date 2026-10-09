'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

const MAX_LETTERS_PER_MONTH = 10;

export default function NewLetter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const receiverId = searchParams.get('receiver_id');
  const supabase = createClient();

  const [receiver, setReceiver] = useState<any>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert('로그인이 필요합니다. / ログインが必要です。');
          router.push('/');
          return;
        }

        if (!receiverId) {
          alert('받는 사람이 지정되지 않았습니다. / 宛先が指定されていません。');
          router.push('/users');
          return;
        }

        // 1. 宛先のプロフィール取得
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, nickname')
          .eq('id', receiverId)
          .single();

        if (profileError || !profileData) {
          throw new Error('사용자를 찾을 수 없습니다. / ユーザーが見つかりません。');
        }
        setReceiver(profileData);

        // 2. 今月の送信件数をカウント
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { count, error: countError } = await supabase
          .from('letters')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', user.id)
          .gte('created_at', firstDayOfMonth);

        if (countError) throw countError;

        const sentCount = count || 0;
        setRemainingCount(Math.max(0, MAX_LETTERS_PER_MONTH - sentCount));

      } catch (error: any) {
        console.error(error);
        alert(error.message);
        router.push('/users');
      } finally {
        setLoading(false);
      }
    };

    fetchInitData();
  }, [receiverId, router, supabase]);

  const handleSend = async () => {
    if (!content.trim()) return;
    if (remainingCount !== null && remainingCount <= 0) {
      alert('이번 달 편지 발송 한도를 모두 사용했습니다. / 今月の手紙送信上限に達しました。');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인 세션이 없습니다. / ログインセッションがありません。');

      const { error } = await supabase
        .from('letters')
        .insert({
          sender_id: user.id,
          receiver_id: receiver.id,
          content: content.trim(),
        });

      if (error) throw error;

      alert('편지를 성공적으로 보냈습니다! / 手紙を無事に送信しました！');
      // 💡 ここを /letters から /users に変更したわ！
      router.push('/users');
    } catch (error: any) {
      console.error(error);
      alert(`전송 실패 / 送信失敗: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-xl text-[#4a3b32] font-bold">준비 중... / 準備中...</p>
      </main>
    );
  }

  const isOverLimit = remainingCount !== null && remainingCount <= 0;

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
        <h1 className="text-3xl font-bold text-[#4a3b32]">순카페 (純喫茶)</h1>
        <Button 
          variant="outline"
          onClick={() => router.back()}
          className="border-[#4a3b32] text-[#4a3b32] font-bold hover:bg-[#efebe3] text-lg px-6 py-3 h-auto"
        >
          취소 / キャンセル
        </Button>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        
        {/* 💡 タイトルと残数カウンターのレイアウト */}
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-[#e6dfd5]">
          <h2 className="text-3xl font-bold text-[#4a3b32]">
            새 편지 쓰기 / 新しい手紙を書く
          </h2>
          {remainingCount !== null && (
            <div className={`text-4xl font-bold ${isOverLimit ? 'text-red-600' : 'text-[#c97a7e]'}`}>
              {remainingCount} <span className="text-2xl text-[#a39891]">/ {MAX_LETTERS_PER_MONTH}</span>
            </div>
          )}
        </div>

        {isOverLimit && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md font-bold text-center">
            이번 달 보낼 수 있는 편지를 모두 소진했습니다. 다음 달에 다시 이용해주세요. <br />
            今月送信できる手紙の上限に達しました。来月またご利用ください。
          </div>
        )}

        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#e6dfd5]">
          <div className="bg-[#f4efe8] p-4 rounded-lg mb-8 flex items-center gap-4 border border-[#e6dfd5]">
            <span className="text-sm font-bold text-[#a39891] w-12 text-center">To.</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">☕️</span>
              <span className="text-2xl font-bold text-[#4a3b32]">{receiver?.nickname}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="font-bold text-[#4a3b32] text-lg">내용 / 本文</label>
              <span className={`text-sm font-mono font-bold ${content.length > 400 ? 'text-red-500' : 'text-[#a39891]'}`}>
                {content.length} / 400
              </span>
            </div>
            <textarea
              className="w-full h-[300px] p-6 border border-[#e6dfd5] rounded-xl bg-[#fdfbf7] text-[#5c4d44] text-xl leading-relaxed resize-none focus:outline-none focus:border-[#879977] focus:ring-1 focus:ring-[#879977] transition-colors"
              placeholder="상대방에게 따뜻한 인사를 건네보세요. / 相手に温かい挨拶を送ってみましょう。"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={400}
              disabled={isOverLimit}
            />
          </div>
        </div>

        <div className="mt-10">
          <Button 
            onClick={handleSend}
            disabled={isSubmitting || content.length === 0 || content.length > 400 || isOverLimit}
            className="w-full bg-[#879977] hover:bg-[#738563] disabled:bg-[#d3c9c1] disabled:text-[#f4efe8] text-white font-bold text-2xl px-6 py-6 h-auto shadow-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <span>✉️</span> {isSubmitting ? '전송 중... / 送信中...' : '편지 보내기 / 手紙を送る'}
          </Button>
        </div>
      </div>
    </main>
  );
}