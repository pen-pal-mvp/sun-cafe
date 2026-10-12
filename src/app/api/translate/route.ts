import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { createClient } from '@/utils/supabase/server';

// 💡 Upstash Redisの設定
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// 💡 レートリミットの設定
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(11, "24 h"),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다. / ログインが必要です。' }, { status: 401 });
    }

    const { success } = await ratelimit.limit(user.id);

    if (!success) {
      return NextResponse.json({ 
        error: '하루 번역 횟수(10회)를 모두 사용했습니다. 내일 다시 시도해주세요.\n1日の翻訳回数（10回）を使い切りました。明日またお試しください。' 
      }, { status: 429 });
    }

    const { text, target_language } = await req.json();

    if (!text) {
      return NextResponse.json({ error: '번역할 텍스트가 없습니다. / 翻訳するテキストがありません。' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다. / APIキーが設定されていません。' }, { status: 500 });
    }

    const targetLangName = (target_language === 'ko' || target_language === 'Korean') ? 'Korean' : 'Japanese';

    // 💡 解決策: テキストを改行で分割して配列にする
    const lines = text.split('\n');
    const translatedLines = [];

    // 💡 1行ずつ個別にOpenAIへリクエストを送る（並列処理）
    const translationPromises = lines.map(async (line: string) => {
      // 空白行は翻訳せずそのまま返す
      if (!line.trim()) {
        return line;
      }

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
              content: `You are a translation tool. Translate the input into ${targetLangName}. If it is already in ${targetLangName}, output it exactly as is. Output ONLY the translation, no extra words.`,
            },
            {
              role: 'user',
              content: line, // 1行だけを渡す
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    });

    // すべての行の翻訳が完了するのを待つ
    const results = await Promise.all(translationPromises);
    
    // 翻訳された行を再び改行で結合する
    const translatedText = results.join('\n');

    return NextResponse.json({ translatedText });

  } catch (error: any) {
    console.error('Translation Error:', error);
    return NextResponse.json({ error: '번역 서버 오류 / 翻訳サーバーエラー' }, { status: 500 });
  }
}