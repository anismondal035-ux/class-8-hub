
CREATE TABLE public.daily_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  word TEXT NOT NULL,
  word_meaning TEXT NOT NULL,
  thought TEXT NOT NULL,
  thought_author TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily content"
  ON public.daily_content FOR SELECT
  USING (true);

CREATE INDEX idx_daily_content_date ON public.daily_content(date DESC);
