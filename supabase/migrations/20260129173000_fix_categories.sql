-- Add 'Новости' to the allowed categories in the posts table
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_category_check;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_category_check 
CHECK (category IN ('Достижения', 'Мероприятия', 'Анонсы', 'Новости'));
