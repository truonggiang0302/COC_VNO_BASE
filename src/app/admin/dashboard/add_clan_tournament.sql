-- ============================================================
-- COC Clan Tournament - schema additions
-- Chạy 1 lần trong Supabase SQL Editor (supabase CLI / Tooltips)
-- ============================================================

-- 0. Bật extension pgcrypto (cần cho gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Cột tag cho profiles (nhập tag của người chơi / tag clan)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tag text;

-- 2. Cấu hình API (endpoint + api key)
CREATE TABLE IF NOT EXISTS public.api_configs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  base_url   text NOT NULL,
  api_key    text NOT NULL,
  enabled    boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Lịch sử đăng ký giải đấu (tag clan + danh sách thành viên)
CREATE TABLE IF NOT EXISTS public.registered_clans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  clan_tag      text NOT NULL,
  clan_name     text,
  participants  jsonb DEFAULT '[]'::jsonb,
  created_at    timestamp with time zone DEFAULT now(),
  updated_at    timestamp with time zone DEFAULT now()
);

-- 4. Quyền truy cập
GRANT ALL ON api_configs TO service_role;
GRANT ALL ON registered_clans TO service_role;

ALTER TABLE public.api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_clans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.api_configs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.registered_clans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Super admin đọc/ghi
CREATE POLICY "Super admin read/write" ON public.api_configs
  FOR ALL TO authenticated
  USING ( EXISTS ( SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin' ) )
  WITH CHECK ( EXISTS ( SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin' ) );

CREATE POLICY "Super admin read/write" ON public.registered_clans
  FOR ALL TO authenticated
  USING ( EXISTS ( SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin' ) )
  WITH CHECK ( EXISTS ( SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin' ) );

-- Người dùng thông thường chỉ đọc/ghi tag của chính họ
CREATE POLICY "User read own" ON public.registered_clans
  FOR SELECT TO authenticated USING ( user_id = auth.uid() );

CREATE POLICY "User insert own" ON public.registered_clans
  FOR INSERT TO authenticated
  WITH CHECK ( user_id = auth.uid() );
a
CREATE POLICY "User update own" ON public.registered_clans
  FOR UPDATE TO authenticated
  USING ( user_id = auth.uid() );

-- ============================================
-- Cập nhật lại RLS mềm cho profiles (tag)
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can read all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- 5. Cho phép user tự cập nhật đúng dòng profile của mình
--    (cần để user tự lưu cột tag khi đăng ký giải đấu)
--    LƯU Ý: chỉ cấp quyền ở mức CỘT `tag` để user không tự nâng quyền `role`.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (tag) ON public.profiles TO authenticated;
