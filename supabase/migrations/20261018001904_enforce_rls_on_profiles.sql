-- profilesテーブルのRLSセキュリティゲートウェイを強制有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 自身のUUIDと一致する場合のみプロフィール更新を許可するポリシーを確定
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 自身のUUIDと一致する場合のみプロフィール作成を許可するポリシーを確定
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);