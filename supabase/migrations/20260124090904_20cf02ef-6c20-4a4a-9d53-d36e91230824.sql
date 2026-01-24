-- Ensure deterministic upsert target (unique constraint without predicate)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='posts_source_source_id_uniq'
  ) THEN
    EXECUTE 'DROP INDEX public.posts_source_source_id_uniq';
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE public.posts
  ADD CONSTRAINT posts_source_source_id_unique UNIQUE (source, source_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
