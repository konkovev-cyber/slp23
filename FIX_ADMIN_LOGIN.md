# 🔧 Восстановление входа в админку

## Проблема

При входе в админку страница "висит" - не происходит вход или редирект.

**Причина:** Функция `has_role()` в базе данных не работает корректно или отсутствует.

---

## Решение 1: Выполнить SQL миграцию

### Шаг 1: Откройте Supabase Dashboard

https://supabase.com/dashboard/project/qwuicyhadpesklhkjxpn/sql

### Шаг 2: Выполните SQL

Скопируйте и выполните содержимое файла:
`supabase/migrations/fix_admin_login.sql`

**Или выполните по частям:**

```sql
-- 1. Удаляем старые функции
DROP FUNCTION IF EXISTS public.has_role(uuid, text);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 2. Создаём функцию с text параметром
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
  SELECT p.role INTO user_role
  FROM public.profiles p
  WHERE p.auth_id = _user_id
  LIMIT 1;
  
  IF user_role IS NOT NULL AND user_role::text = _role THEN
    RETURN true;
  END IF;
  
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

-- 3. Создаём алиас для app_role
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

-- 4. Grant execute
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
```

### Шаг 3: Проверьте функцию

```sql
-- Тест функции
SELECT 
  public.has_role(
    (SELECT auth_id FROM public.profiles WHERE role = 'admin' LIMIT 1),
    'admin'
  ) as is_admin;
```

**Ожидаемый результат:** `true`

---

## Решение 2: Проверить таблицу profiles

### Шаг 1: Проверьте таблицу

```sql
SELECT auth_id, full_name, role, is_approved
FROM public.profiles
WHERE role = 'admin';
```

### Шаг 2: Если нет админа, создайте

```sql
-- 1. Войдите под любым пользователем через /school/login
-- 2. Узнайте его auth_id
-- 3. Обновите роль

UPDATE public.profiles
SET role = 'admin', is_approved = true
WHERE auth_id = 'YOUR_USER_ID';
```

---

## Решение 3: Проверить RLS политики

```sql
-- Проверка RLS на profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
```

Если политик нет или они блокируют доступ, выполните:

```sql
-- Разрешить чтение profiles всем авторизованным
CREATE POLICY "Profiles viewable by authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Разрешить обновление только себе и админам
CREATE POLICY "Profiles updateable by self/admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = auth_id 
  OR public.has_role(auth.uid(), 'admin')
);
```

---

## 🔍 Отладка

### Проверка сессии

Откройте консоль браузера (F12) и выполните:

```javascript
// Проверка сессии
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
```

### Проверка функции

```javascript
// Проверка has_role
const { data, error } = await supabase.rpc('has_role', {
  _user_id: 'YOUR_USER_ID',
  _role: 'admin'
});
console.log('Is admin:', data);
console.log('Error:', error);
```

### Логи Supabase

https://supabase.com/dashboard/project/qwuicyhadpesklhkjxpn/logs

Ищите ошибки при вызове `has_role`.

---

## ✅ Чек-лист

- [ ] SQL миграция выполнена
- [ ] Функция `has_role()` существует
- [ ] Таблица `profiles` имеет записи с ролью `admin`
- [ ] RLS политики настроены
- [ ] Вход в админку работает

---

## 📝 Контакты админа

**Email:** admin@slp23.ru (или другой из настроек)

**Пароль:** (установлен при создании)

Если забыли пароль админа, создайте нового:

```sql
-- 1. Зарегистрируйтесь через /school/signup
-- 2. Найдите свой auth_id
SELECT auth_id, email FROM auth.users WHERE email = 'your@email.com';

-- 3. Назначьте роль admin
UPDATE public.profiles
SET role = 'admin', is_approved = true
WHERE auth_id = 'YOUR_AUTH_ID';

-- 4. Войдите через /admin
```

---

**Создано:** 19 февраля 2026  
**Статус:** ⏳ Ожидает выполнения
