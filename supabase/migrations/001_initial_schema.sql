-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from auth.users via trigger, or minimal for MVP)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read/update own row
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'email',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tone presets
CREATE TABLE IF NOT EXISTS public.tone_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  preset_type TEXT NOT NULL DEFAULT 'custom' CHECK (preset_type IN ('system', 'custom')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tone_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own presets" ON public.tone_presets
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_tone_presets_user_id ON public.tone_presets(user_id);

-- Tone preset examples
CREATE TABLE IF NOT EXISTS public.tone_preset_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  preset_id UUID NOT NULL REFERENCES public.tone_presets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tone_preset_examples ENABLE ROW LEVEL SECURITY;

-- Access via preset's user_id
CREATE POLICY "Users can manage preset examples" ON public.tone_preset_examples
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tone_presets
      WHERE id = tone_preset_examples.preset_id
      AND user_id = auth.uid()
    )
  );

CREATE INDEX idx_tone_preset_examples_preset_id ON public.tone_preset_examples(preset_id);
