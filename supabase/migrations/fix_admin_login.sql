-- Миграция: Восстановление функции has_role
-- Дата: 2026-02-19
-- Описание: Исправление функции has_role для работы с текстовым типом

-- Удаляем старую функцию если существует
DROP FUNCTION IF EXISTS public.has_role(uuid, text);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Создаём функцию с поддержкой text
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
STABLE
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Проверяем таблицу profiles
  SELECT p.role INTO user_role
  FROM public.profiles p
  WHERE p.auth_id = _user_id
  LIMIT 1;
  
  -- Если роль найдена и совпадает
  IF user_role IS NOT NULL AND user_role::text = _role THEN
    RETURN true;
  END IF;
  
  -- Проверяем таблицу user_roles (если существует)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = _user_id
      AND ur.role::text = _role
      LIMIT 1
    );
  END IF;
  
  RETURN false;
END;
$$;

-- Создаём алиас для app_role типа
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
STABLE
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN public.has_role(_user_id, _role::text);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Проверка
SELECT 
  'has_role(text)' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND proargtypes = 'uuid text') 
    THEN 'OK' 
    ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'has_role(app_role)' as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND proargtypes = 'uuid 22498') 
    THEN 'OK' 
    ELSE 'MISSING' 
  END as status;
