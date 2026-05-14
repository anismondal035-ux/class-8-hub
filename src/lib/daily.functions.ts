import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { pickFromBank } from "./word-bank";

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const shuffleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seed: z.number().int().min(0).max(1_000_000).optional(),
});

const imageReqSchema = z.object({
  word: z.string().min(1).max(60),
  thought: z.string().min(1).max(400),
});

type DailyRow = {
  id: string;
  date: string;
  word: string;
  word_meaning: string;
  thought: string;
  thought_author: string | null;
  image_url: string | null;
};

async function generateText(apiKey: string, dateISO: string, seed = 0) {
  const d = new Date(dateISO + "T00:00:00Z");
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start) / 86400000);
  const themes = [
    "kindness", "courage", "learning", "friendship", "hard work", "curiosity",
    "gratitude", "teamwork", "honesty", "dreams", "perseverance", "patience",
    "creativity", "respect", "responsibility", "humility", "discipline",
  ];
  const theme = themes[(dayOfYear + seed) % themes.length];

  const prompt = `Pick a fresh "Word of the Day" and "Thought of the Day" for a Class 8 school assembly.
Date: ${dateISO}, day-of-year ${dayOfYear}, variation seed ${seed}, theme hint: ${theme}.
Rules:
- WORD: a useful, slightly advanced English vocabulary word for a 13-14 year old. Not too obscure, not basic. Different from common picks like "happy", "diligent", "curious".
- WORD_MEANING: clear, simple, max 18 words.
- THOUGHT: short motivational/philosophical line (1-2 sentences, max 30 words). Fits a morning assembly.
- thought_author: name if it is by a real famous person, otherwise empty string.
Return ONLY JSON:
{"word":"...","word_meaning":"...","thought":"...","thought_author":"..."}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`text gen failed ${res.status}`);
  const j = await res.json();
  const content = j?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return {
    word: String(parsed.word ?? "Curiosity"),
    word_meaning: String(parsed.word_meaning ?? "A strong desire to learn or know something."),
    thought: String(parsed.thought ?? "Stay curious — every question is a doorway."),
    thought_author: parsed.thought_author ? String(parsed.thought_author) : null,
  };
}

async function generateImage(apiKey: string, word: string, thought: string) {
  const prompt = `A bright, friendly, school-assembly style illustrated poster.
Top half: the word "${word}" in big bold elegant typography.
Bottom half: the quote "${thought}" in clean handwritten script.
Soft watercolor illustration, warm sunrise colors, motivational vibe, no extra text.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return (j?.choices?.[0]?.message?.images?.[0]?.image_url?.url as string) ?? null;
}

// FAST: returns word + thought immediately. Image generated separately.
export const getDailyContent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => dateSchema.parse(i))
  .handler(async ({ data }) => {
    const { date } = data;
    const { data: existing } = await supabaseAdmin
      .from("daily_content").select("*").eq("date", date).maybeSingle();
    if (existing) return existing as DailyRow;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        id: "fallback", date,
        word: "Diligent", word_meaning: "Showing care and effort in your work.",
        thought: "Small daily effort beats rare bursts of brilliance.",
        thought_author: null, image_url: null,
      } as DailyRow;
    }

    try {
      const text = await generateText(apiKey, date, 0);
      const { data: inserted, error } = await supabaseAdmin
        .from("daily_content")
        .insert({ date, ...text, image_url: null })
        .select("*").single();
      if (error) {
        const { data: again } = await supabaseAdmin
          .from("daily_content").select("*").eq("date", date).maybeSingle();
        if (again) return again as DailyRow;
        throw error;
      }
      return inserted as DailyRow;
    } catch (e) {
      console.error("daily text gen error", e);
      return {
        id: "fallback", date,
        word: "Resilient", word_meaning: "Able to recover quickly from difficulties.",
        thought: "Falling down is part of learning to fly.",
        thought_author: null, image_url: null,
      } as DailyRow;
    }
  });

// SLOW: generates the poster image lazily. Called after first paint.
export const ensureDailyImage = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => dateSchema.parse(i))
  .handler(async ({ data }) => {
    const { date } = data;
    const { data: row } = await supabaseAdmin
      .from("daily_content").select("*").eq("date", date).maybeSingle();
    if (!row) return { image_url: null };
    if (row.image_url) return { image_url: row.image_url };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { image_url: null };

    const url = await generateImage(apiKey, row.word, row.thought);
    if (url) {
      await supabaseAdmin.from("daily_content").update({ image_url: url }).eq("date", date);
    }
    return { image_url: url };
  });

// INSTANT shuffle from a curated local bank — no AI call, no waiting.
export const shuffleDaily = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => shuffleSchema.parse(i))
  .handler(async ({ data }) => {
    const seed = data.seed ?? Math.floor(Math.random() * 1_000_000);
    return pickFromBank(data.date, seed);
  });

// Generate a poster on demand (used by shuffle so the image actually changes).
export const generatePoster = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => imageReqSchema.parse(i))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { image_url: null };
    const url = await generateImage(apiKey, data.word, data.thought);
    return { image_url: url };
  });
