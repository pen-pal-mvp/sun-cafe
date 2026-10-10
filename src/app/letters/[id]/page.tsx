'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

export default function LetterDetail() {
  const router = useRouter();
  const params = useParams();
  const letterId = params.id as string;
  const supabase = createClient();

  const [letter, setLetter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  const dummyData: Record<string, any> = {
    'dummy-1': {
      id: 'dummy-1',
      sender_id: 'dummy-sender-1',
      sender_name: '지은 (Ji-eun)',
      sender_native: 'ko', // ダミーデータにも言語を追加
      created_at: new Date().toISOString(),
      content: '안녕하세요! 일본 문화에 관심이 많아요. 같이 언어 교환해요! / こんにちは！日本文化に興味があります。一緒に言語交換しましょう！\n\n앞으로 잘 부탁드립니다. / これからよろしくお願いします。',
      is_deleted: false
    },
    'dummy-2': {
      id: 'dummy-2',
      sender_id: 'dummy-sender-2',
      sender_name: '민수 (Min-su)',
      sender_native: 'ko',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      content: '도쿄 여행을 계획 중입니다. 맛집을 추천해주실 수 있나요? / 東京旅行を計画中です。美味しいお店をおすすめしてもらえますか？\n\n스시를 아주 좋아합니다! / 寿司が大好きです！',
      is_deleted: false
    },
    'dummy-3': {
      id: 'dummy-3',
      sender_id: 'dummy-sender-3',
      sender_name: '켄타 (Kenta)',
      sender_native: 'ja', // 켄타は日本語
      created_at: new Date(Date.now() - 172800000).toISOString(),
      content: '처음 뵙겠습니다! 최근 한국어 공부를 시작했습니다. / はじめまして！最近韓国語の勉強を始めました。\n\n아직 서툴지만 잘 부탁드립니다. / まだ下手ですがよろしくお願いします。',
      is_deleted: false
    }
  };

  useEffect(() => {
    const fetchLetterDetail = async () => {
      try {
        if (letterId.startsWith('dummy-')) {
          setLetter(dummyData[letterId] || null);
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          alert('로그인 세션이 없습니다. / ログインセッションがありません。');
          router.push('/');
          return;
        }

        const { data: letterData, error: letterError } = await supabase
          .from('letters')
          .select('*')
          .eq('id', letterId)
          .eq('receiver_id', user.id)
          .single();

        if (letterError || !letterData) {
          throw new Error('편지를 찾을 수 없습니다. / 手紙が見つかりません。');
        }

        // 💡 native_languageも取得！
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nickname, is_deleted, native_language')
          .eq('id', letterData.sender_id)
          .single();

        setLetter({
          ...letterData,
          sender_name: profileData?.is_deleted ? '탈퇴한 유저 / 退会したユーザー' : (profileData?.nickname || '이름 없음 (名無し)'),
          is_deleted: profileData?.is_deleted || false,
          sender_native: profileData?.native_language || 'ko' // 言語情報もセット
        });

      } catch (error: any) {
        console.error(error);
        alert(error.message);
        router.push('/letters');
      } finally {
        setLoading(false);
      }
    };

    if (letterId) {
      fetchLetterDetail();
    }
  }, [letterId, supabase, router]);

  const handleBlock = async () => {
    if (!letter?.sender_id || letter.sender_id.startsWith('dummy-')) {
      alert('【개발 모드】 더미 데이터는 차단할 수 없습니다. / 【開発モード】ダミーデータはブロックできません。');
      return;
    }

    const confirmBlock = window.confirm(`정말로 ${letter.sender_name}님을 차단하시겠습니까? / 本当に ${letter.sender_name} さん을 ブロックしますか？`);
    if (!confirmBlock) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: letter.sender_id
        });

      if (error) {
        if (error.code === '23505') {
          alert('이미 차단한 사용자입니다. / すでにブロックしているユーザーです。');
        } else {
          throw error;
        }
      } else {
        alert('차단되었습니다. / ブロックしました。');
        router.push('/letters');
      }
    } catch (error: any) {
      console.error('Block Error:', error);
      alert(`차단 실패 / ブロック失敗: ${error.message}`);
    }
  };

  const handleTranslate = async () => {
    if (!letter?.content) return;
    
    setIsTranslating(true);
    
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: letter.content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '번역 요청에 실패했습니다. / 翻訳リクエストに失敗しました。');
      }

      setTranslatedText(data.translatedText);
    } catch (error: any) {
      console.error('Translate API Error:', error);
      alert(error.message || '번역 중 오류가 발생했습니다. / 翻訳中にエラーが発生しました。');
    } finally {
      setIsTranslating(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const dateObj = new Date(dateString);
      return `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '날짜 불명 / 日付不明';
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-xl text-[#4a3b32] font-bold">편지 읽어오는 중... / 手紙を読み込み中...</p>
      </main>
    );
  }

  if (!letter) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <p className="text-2xl text-[#4a3b32] font-bold">편지를 찾을 수 없습니다. / 手紙が見つかりません。</p>
        <Button onClick={() => router.push('/letters')} className="bg-[#879977] text-white font-bold text-xl px-6 py-3 h-auto">
          수신함으로 돌아가기 / 受信箱へ戻る
        </Button>
      </main>
    );
  }

  // 💡 国旗の絵文字を判定
  const isKo = letter.sender_native === 'ko' || letter.sender_native === 'Korean';
  const isJa = letter.sender_native === 'ja' || letter.sender_native === 'Japanese';
  const flagEmoji = isKo ? '🇰🇷' : isJa ? '🇯🇵' : '☕';

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7' }}>
      <header className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 sm:px-8 bg-[#f4efe8] border-b border-[#e6dfd5]">
        <h1 
          className="text-3xl font-bold text-[#4a3b32] cursor-pointer whitespace-nowrap"
          onClick={() => router.push('/users')}
        >
          순카페 (純喫茶)
        </h1>
        
        <div className="flex gap-4 items-center w-full sm:w-auto">
          <Button 
            onClick={() => router.push('/letters')}
            className="w-full sm:w-auto bg-[#879977] hover:bg-[#738563] text-white font-bold text-lg px-6 py-3 h-auto"
          >
            수신함 / 受信箱
          </Button>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <h2 className="text-3xl font-bold text-[#4a3b32] mb-10 pb-6 border-b border-[#e6dfd5]">
          편지 읽기 / 手紙を読む
        </h2>

        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#e6dfd5] relative overflow-hidden flex flex-col min-h-[500px]">
          
          <div className="border-b-2 border-dashed border-[#e6dfd5] pb-6 mb-8 flex justify-between items-end flex-wrap gap-4">
            <div>
              <p className="text-sm font-bold text-[#a39891] mb-2">From.</p>
              <div className="flex items-center gap-3">
                {/* 💡 ☕️の代わりに国旗を表示 */}
                <span className="text-4xl drop-shadow-sm">{flagEmoji}</span>
                <p className={`text-2xl sm:text-3xl font-bold ${letter.is_deleted ? 'text-[#a39891]' : 'text-[#4a3b32]'}`}>
                  {letter.sender_name}
                </p>
              </div>
            </div>
            <p className="text-[#879977] text-base sm:text-lg font-mono font-semibold tracking-wide">
              {formatDate(letter.created_at)}
            </p>
          </div>

          <div className="flex-1">
            <p className="text-[#5c4d44] text-xl sm:text-2xl leading-[2.2] whitespace-pre-wrap font-medium">
              {letter.content}
            </p>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-dashed border-[#e6dfd5]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <p className="text-sm font-bold text-[#a39891]">번역 / 翻訳</p>
              </div>
              
              {!translatedText && (
                <Button 
                  onClick={handleTranslate} 
                  disabled={isTranslating || letter.is_deleted}
                  variant="outline"
                  className={`font-bold w-full sm:w-auto ${
                    letter.is_deleted 
                      ? 'border-[#e6dfd5] text-[#d3c9c1] cursor-not-allowed' 
                      : 'border-[#d3c9c1] text-[#7a5c4d] hover:bg-[#f4efe8]'
                  }`}
                >
                  {letter.is_deleted ? '번역 불가 / 翻訳不可' : (isTranslating ? '번역 중... / 翻訳中...' : '번역하기 / 翻訳する')}
                </Button>
              )}
            </div>

            {translatedText && (
              <div className="bg-[#fcf9f2] p-6 rounded-xl border border-[#efebe3]">
                <p className="text-[#7a5c4d] text-xl leading-[2.2] whitespace-pre-wrap font-medium">
                  {translatedText}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700 font-medium mb-4 leading-relaxed text-sm sm:text-base">
            ⚠️ <strong>"아직 직접 만나서 신뢰 관계가 형성되지 않은 상대"</strong>로부터 투자, 암호화폐(가상화폐), 부업, 공동 지갑, 금전적인 어려움 등 단 1원이라도 돈과 관련된 이야기가 나오면, 그 즉시 100% 사기라고 판단하고 차단하세요.
          </p>
          <p className="text-red-700 font-medium leading-relaxed text-sm sm:text-base">
            ⚠️ <strong>「まだ直接会って、信頼関係ができていない相手」</strong>から、投資、暗号資産（仮想通貨）、副業、共同財布、お金の困りごとなど、1円でも金銭が絡む話が出たら、その瞬間に100%詐欺だと判断してブロックする。
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline"
            onClick={handleBlock}
            disabled={letter.is_deleted}
            className={`w-full sm:w-1/3 border-[#d3c9c1] font-bold text-xl sm:text-2xl px-6 py-6 h-auto rounded-lg flex items-center justify-center gap-2 ${
              letter.is_deleted ? 'text-[#d3c9c1] cursor-not-allowed' : 'text-[#a39891] hover:bg-[#f4efe8] hover:text-[#4a3b32]'
            }`}
          >
            <span>🚫</span> 차단 / ブロック
          </Button>
          
          <Button 
            onClick={() => router.push(`/letters/${letterId}/reply`)}
            disabled={letter.is_deleted}
            className={`w-full sm:w-2/3 font-bold text-xl sm:text-2xl px-6 py-6 h-auto shadow-sm rounded-lg flex items-center justify-center gap-2 transition-colors ${
              letter.is_deleted ? 'bg-[#d3c9c1] text-[#f4efe8] cursor-not-allowed' : 'bg-[#879977] hover:bg-[#738563] text-white'
            }`}
          >
            <span>✉</span> {letter.is_deleted ? '답장 불가 / 返信不可' : '답장 쓰기 / 返事を書く'}
          </Button>
        </div>

      </div>
    </main>
  );
}