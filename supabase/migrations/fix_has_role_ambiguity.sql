-- =============================================================================
-- FIX: устраняем двойственность has_role (PGRST203)
-- Выполнить в Supabase Studio → SQL Editor
-- =============================================================================

-- 1. Удаляем text-overload, который создала миграция 20261117180000
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role text);

-- 2. Оригинальная функция с app_role (из первой миграции) остаётся:
--    public.has_role(_user_id uuid, _role public.app_role)
-- Убеждаемся что она есть:
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- 3. Добавляем колонку role в profiles если её нет (для fallback)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- 4. Убеждаемся что у user_roles есть SELECT-политика для owner
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. Проверка: должна вернуть true для admin
-- SELECT public.has_role('32c0997b-17ff-4e37-8cac-d0398d6e7733'::uuid, 'admin'::public.app_role);
