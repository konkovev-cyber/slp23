-- Таблица заявок с формы обратной связи.
-- Записи создаёт только Edge Function contact-request (service role обходит
-- RLS), у anon/публичных прямой INSERT запрещён: нет политик — нет доступа.
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  child_age TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'web',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (без политик: только service role через edge function)
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contact_requests_created_at ON public.contact_requests(created_at DESC);
