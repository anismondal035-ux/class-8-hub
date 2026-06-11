
-- =================== PROFILES ===================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile when user signs up via Google
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Student'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =================== CHAT ===================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 4000),
  reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_created_at_idx ON public.chat_messages (created_at DESC);
GRANT SELECT ON public.chat_messages TO anon;
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat readable by all" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "auth users send chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own chat" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- =================== MEMORY PHOTOS ===================
CREATE TABLE public.memory_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploader_name TEXT NOT NULL DEFAULT 'Anonymous',
  storage_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  album TEXT NOT NULL DEFAULT 'General',
  year INT NOT NULL DEFAULT extract(year from now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX memory_photos_created_idx ON public.memory_photos (created_at DESC);
GRANT SELECT ON public.memory_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_photos TO authenticated;
GRANT ALL ON public.memory_photos TO service_role;
ALTER TABLE public.memory_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos readable by all" ON public.memory_photos FOR SELECT USING (true);
CREATE POLICY "auth users upload" ON public.memory_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own photo" ON public.memory_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.memory_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.memory_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.memory_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.memory_comments TO authenticated;
GRANT ALL ON public.memory_comments TO service_role;
ALTER TABLE public.memory_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments readable by all" ON public.memory_comments FOR SELECT USING (true);
CREATE POLICY "auth users comment" ON public.memory_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own comment" ON public.memory_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.memory_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.memory_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (length(emoji) BETWEEN 1 AND 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (photo_id, user_id, emoji)
);
GRANT SELECT ON public.memory_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.memory_reactions TO authenticated;
GRANT ALL ON public.memory_reactions TO service_role;
ALTER TABLE public.memory_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions readable by all" ON public.memory_reactions FOR SELECT USING (true);
CREATE POLICY "auth users react" ON public.memory_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own reaction" ON public.memory_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =================== HOMEWORK ===================
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX homework_due_idx ON public.homework (due_date);
GRANT SELECT ON public.homework TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hw readable by all" ON public.homework FOR SELECT USING (true);
CREATE POLICY "auth users add hw" ON public.homework FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own hw" ON public.homework FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users update own hw" ON public.homework FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =================== NOTES ===================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes readable by all" ON public.notes FOR SELECT USING (true);
CREATE POLICY "auth users add notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own notes" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own notes" ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =================== EVENTS ===================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_date_idx ON public.events (event_date);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events readable by all" ON public.events FOR SELECT USING (true);
CREATE POLICY "auth users add events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own events" ON public.events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =================== ANNOUNCEMENTS ===================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX announcements_created_idx ON public.announcements (created_at DESC);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann readable by all" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "auth users add ann" ON public.announcements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own ann" ON public.announcements FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own ann" ON public.announcements FOR DELETE TO authenticated USING (auth.uid() = user_id);
