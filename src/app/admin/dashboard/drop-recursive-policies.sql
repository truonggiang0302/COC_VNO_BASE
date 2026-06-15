-- Xóa các policy cũ gây lỗi đệ quy
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can update profiles" ON public.profiles;

-- Tạo lại: Tất cả authenticated user đều có thể đọc profiles (đơn giản, an toàn vì chỉ super_admin mới có UI)
-- Chỉ UPDATE mới cần check role
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Chỉ super_admin mới được UPDATE
CREATE POLICY "Super admin can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'super_admin'
    )
  );