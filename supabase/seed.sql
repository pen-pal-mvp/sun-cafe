-- 拡張機能 pgcrypto の有効化
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- テスト用ユーザーの作成（auth.users）
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'test1@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'test2@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

-- テスト用ユーザーのID登録（auth.identities）※現在のSupabaseのログイン仕様に必須
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'test1@example.com')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'test2@example.com')::jsonb, 'email', now(), now(), now());

-- テスト用プロフィールの作成（public.profiles）
INSERT INTO public.profiles (id, email, nickname, is_paid)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'test1@example.com', 'TestUser1', false),
  ('22222222-2222-2222-2222-222222222222', 'test2@example.com', 'TestUser2', false);