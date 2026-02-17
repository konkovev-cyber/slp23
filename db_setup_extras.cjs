const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwuicyhadpesklhkjxpn.supabase.co';
const serviceRoleKey = 'sb_secret_HzH8nQFmVqlvM95VQGoJnQ_y2FfA5vC';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const sql = `
-- Add video_url and is_vibrant to teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create teacher_reviews table if not exists
CREATE TABLE IF NOT EXISTS public.teacher_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  rating INT DEFAULT 5,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for reviews
ALTER TABLE public.teacher_reviews ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reviews viewable by everyone') THEN
    CREATE POLICY "Reviews viewable by everyone" ON public.teacher_reviews FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage reviews') THEN
    CREATE POLICY "Admins can manage reviews" ON public.teacher_reviews FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;
`;

async function setup() {
    console.log('Setting up database extras...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
        console.error('Error executing SQL:', error.message);
        // If exec_sql doesn't work, we are in trouble. 
        // But usually it should if the project has it defined.
    } else {
        console.log('Successfully applied extra SQL.');
    }
}

setup();
