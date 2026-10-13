import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

describe('Row Level Security (RLS) Policies', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  let currentUserUid: string;

  beforeAll(async () => {
    // 認証バグを回避するため、API経由で正規ユーザーを動的生成してセッションを確立
    const uniqueEmail = `dynamic_${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: uniqueEmail,
      password: 'password123',
    });
    
    if (error) {
      throw new Error(`SignUp setup failed: ${error.message}`);
    }
    currentUserUid = data.user!.id;

    // 生成したユーザーのプロフィールを挿入（DBトリガーで自動生成される環境も考慮し、エラーは無視して進行）
    await supabase.from('profiles').insert({
      id: currentUserUid,
      email: uniqueEmail,
      nickname: 'DynamicUser',
      is_paid: false
    });
  });

  it('User can update their own profile', async () => {
    // 自身のUUIDに対する更新リクエスト（許可されるべき）
    const { data, error } = await supabase
      .from('profiles')
      .update({ nickname: 'UpdatedNickname' })
      .eq('id', currentUserUid)
      .select();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    // RLSによって更新が遮断された場合は明確にエラーを投げる
    if (data?.length === 0) {
      throw new Error('Update blocked by RLS policy. Make sure UPDATE policy allows the owner.');
    }
    
    expect(data![0].nickname).toBe('UpdatedNickname');
  });

  it('User CANNOT update another user profile', async () => {
    // seed.sqlで作成済みの他者(User2)の固定UUIDに対する更新リクエスト（完全に遮断されるべき）
    const { data, error } = await supabase
      .from('profiles')
      .update({ nickname: 'HackedNickname' })
      .eq('id', '22222222-2222-2222-2222-222222222222')
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(0); // 遮断されて空配列が返ることを証明
  });
});