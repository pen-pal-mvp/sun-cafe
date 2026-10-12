import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { createClient } from '@/utils/supabase/server';

// 💡 Upstash Redisの設定（環境変数から読み込み）
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// 💡 レートリミットの設定：24시간（1일）につき3回まで (実質11回)
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(11, "24 h"),
});

export async function POST(req: Request) {
  try {
    // 1. ユーザー認証（誰がリクエストしているか特定するため）
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다. / ログインが必要です。' }, { status: 401 });
    }

    // 2. レートリミットのチェック（user.idをキーにしてカウント）
    const { success } = await ratelimit.limit(user.id);

    if (!success) {
      return NextResponse.json({ 
        error: '하루 번역 횟수(10회)를 모두 사용했습니다. 내일 다시 시도해주세요.\n1日の翻訳回数（10回）を使い切りました。明日またお試しください。' 
      }, { status: 429 });
    }

    // 3. テキストと「読み手の母国語」のバリデーション
    const { text, target_language } = await req.json();

    if (!text) {
      return NextResponse.json({ error: '번역할 텍스트가 없습니다. / 翻訳するテキストがありません。' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다. / APIキーが設定されていません。' }, { status: 500 });
    }

    // ターゲット言語を明確な英語名にマッピング
    const targetLangName = (target_language === 'ko' || target_language === 'Korean') ? 'Korean' : 'Japanese';

    // 4. OpenAI API にリクエストを送信 (AIの要約・省略を禁止する強力なプロンプト)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a highly accurate translation assistant for a pen-pal app. 
Target Language: ${targetLangName}
Strict Rule 1: Translate the input text into the Target Language line-by-line, strictly preserving the original structure and line breaks.
Strict Rule 2: If any part of the text is ALREADY in the Target Language, leave that part exactly as it is.
Strict Rule 3: DO NOT summarize, merge, or omit any sentences. Even if the original text contains the exact same meaning in both languages, you MUST output both sentences in the Target Language (do not remove duplicates).
Strict Rule 4: DO NOT add any extra conversational filler. Output ONLY the final text.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.1, // AIの勝手な創作を防ぐために低く設定
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API request failed');
    }

    const translatedText = data.choices[0].message.content;

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error('Translation Error:', error);
    return NextResponse.json({ error: '번역 서버 오류 / 翻訳サーバーエラー' }, { status: 500 });
  }
}