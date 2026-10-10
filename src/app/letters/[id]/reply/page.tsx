'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

const MAX_LETTERS_PER_MONTH = 10;

export default function ReplyLetterPage() {
  const router = useRouter();
  const params = useParams();
  const letterId = params.id as string;
  const supabase = createClient();
  
  const [receiverId, setReceiverId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverNative, setReceiverNative] = useState(''); // 💡 宛先の言語を保存するステート
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);

  const CONTENT_MAX_CHARS = 400;

  // 開発確認用のダミーデータ
  const dummyData: Record<string, any> = {
    'dummy-1': { sender_id: 'dummy-sender-1', sender_name: '지은 (Ji-eun)', sender_native: 'ko' },
    'dummy-2': { sender_id: 'dummy-sender-2', sender_name: '민수 (Min-su)', sender_native: 'ko' },
    'dummy-3': { sender_id: 'dummy-sender-3', sender_name: '켄타 (Kenta)', sender_native: 'ja' }
  };

  useEffect(() => {
    const fetchOriginalLetterAndSender = async () => {
      try {
        // 1. ダミーデータの場合の処理
        if (letterId.startsWith('dummy-')) {
          const dummyInfo = dummyData[letterId];
          if (dummyInfo) {
            setReceiverId(dummyInfo.sender_id);
            setReceiverName(dummyInfo.sender_name);
            setReceiverNative(dummyInfo.sender_native);
          } else {
            setReceiverName('테스트 유저 / テストユーザー');
            setReceiverNative('ko');
          }
          setRemainingCount(MAX_LETTERS_PER_MONTH);
          setLoading(false);
          return;
        }

        // 2. 本番のデータベースから取得
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          alert('로그인 세션이 없습니다. / ログインセッションがありません。');
          router.push('/');
          return;
        }

        // 返信先（元の手紙の送信者）を特定
        const { data: letterData, error: letterError } = await supabase
          .from('letters')
          .select('sender_id')
          .eq('id', letterId)
          .single();

        if (letterError || !letterData) {
          throw new Error('원본 편지를 찾을 수 없습니다. / 元の手紙が見つかりません。');
        }

        setReceiverId(letterData.sender_id);

        // 💡 返信先のプロフィールから native_language も取得
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nickname, native_language')
          .eq('id', letterData.sender_id)
          .single();

        setReceiverName(profileData?.nickname || '이름 없음 (名無し)');
        setReceiverNative(profileData?.native_language || 'ko');

        // 3. 今月の送信件数をカウント
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
        router.push('/letters');
      } finally {
        setLoading(false);
      }
    };

    if (letterId) {
      fetchOriginalLetterAndSender();
    }
  }, [letterId, supabase, router]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('답장 내용을 입력해주세요. / 返事の内容を入力してください。');
      return;
    }

    if (content.length > CONTENT_MAX_CHARS) {
      alert('글자 수 제한을 초과했습니다. / 文字数制限を超えています。');
      return;
    }

    if (remainingCount !== null && remainingCount <= 0) {
      alert('이번 달 편지 발송 한도를 모두 사용했습니다. / 今月の手紙送信上限に達しました。');
      return;
    }

    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('【개발 모드】 답장 전송을 시뮬레이션했습니다! / 【開発モード】返事の送信をシミュレートしました！');
      router.push('/letters');
      return;
    }

    const { error } = await supabase
      .from('letters')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
      });

    if (error) {
      alert(`전송 에러 / 送信エラー: ${error.message}`);
      setSending(false);
    } else {
      alert('답장을 보냈습니다! / 返事を送信しました！');
      router.push('/letters');
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-xl text-[#4a3b32] font-bold">수신자 정보 불러오는 중... / 宛先情報を読み込み中...</p>
      </main>
    );
  }

  const isOverLimit = remainingCount !== null && remainingCount <= 0;

  // 💡 国旗の絵文字を判定
  const isKo = receiverNative === 'ko' || receiverNative === 'Korean';
  const isJa = receiverNative === 'ja' || receiverNative === 'Japanese';
  const flagEmoji = isKo ? '🇰🇷' : isJa ? '🇯🇵' : '☕';

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
          onClick={() => router.push('/users')}
        >
          순카페 (純喫茶)
        </h1>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Button 
            variant="outline" 
            className="border-[#4a3b32] text-[#4a3b32] font-bold hover:bg-[#efebe3] text-lg px-6 py-3 h-auto"
            onClick={() => router.back()}
          >
            취소 / キャンセル
          </Button>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-[#e6dfd5]">
          <h2 className="text-3xl font-bold text-[#4a3b32]">
            답장 쓰기 / 返事を書く
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
        
        <form onSubmit={handleSend} className="bg-white p-8 rounded-2xl shadow-sm border border-[#e6dfd5] space-y-8">
          
          <div className="bg-[#f4efe8] p-4 rounded-lg border border-[#e6dfd5] flex items-center gap-4">
            {/* 💡 国旗を表示 */}
            <span className="text-4xl drop-shadow-sm">{flagEmoji}</span>
            <div>
              <p className="text-sm font-bold text-[#a39891] mb-1">To.</p>
              <p className="text-2xl font-bold text-[#4a3b32]">{receiverName}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="block text-xl font-bold text-[#4a3b32]">
                내용 / 本文
              </label>
              <span className={`text-sm font-medium ${content.length >= CONTENT_MAX_CHARS ? 'text-red-600 font-bold' : 'text-[#a39891]'}`}>
                {content.length} / {CONTENT_MAX_CHARS}
              </span>
            </div>
            <textarea 
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={CONTENT_MAX_CHARS}
              required
              disabled={isOverLimit}
              className="w-full px-6 py-5 border border-[#d3c9c1] rounded-lg text-xl text-[#5c4d44] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#879977] resize-none bg-[#fdfbf7] disabled:bg-[#f0e6dd] disabled:cursor-not-allowed"
              placeholder="답장을 작성해보세요. / 返事を書いてみましょう。"
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={sending || content.length === 0 || content.length > CONTENT_MAX_CHARS || isOverLimit} 
              className="w-full bg-[#879977] hover:bg-[#738563] disabled:bg-[#d3c9c1] disabled:text-[#f4efe8] text-white font-bold text-2xl px-6 py-6 h-auto shadow-sm rounded-lg transition-colors"
            >
              {sending ? '전송 중... / 送信中...' : '답장 보내기 / 返事を送信する'}
            </Button>
          </div>

        </form>
      </div>
    </main>
  );
}