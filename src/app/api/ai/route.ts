import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/utils/redis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 1分間に5回までのアクセス制限を設定（防壁層）
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
});

export async function POST(req: Request) {
  try {
    // 簡易的にIPアドレスで制限をかける（認証実装後はユーザーIDでの制御を推奨）
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。' }, 
        { status: 429 }
      );
    }

    const { text } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // コストと速度のバランスが最適なモデル
      messages: [
        {
          role: 'system',
          content: 'あなたは日韓Web文通プラットフォーム「순카페(Sun Cafe)」のアシスタントです。ユーザーが入力した文章の意図を汲み取り、相手に伝わりやすい自然で温かみのある韓国語（または日本語）に推敲・翻訳してください。',
        },
        { role: 'user', content: text },
      ],
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error: any) {
    console.error('AI Processing Error:', error);
    return NextResponse.json({ error: 'AIの処理に失敗しました。' }, { status: 500 });
  }
}