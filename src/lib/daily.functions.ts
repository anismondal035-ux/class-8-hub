import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const inputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

async function generateText(apiKey: string, dateISO: string) {
  // Use day-of-year as a varied seed so every day across the year is different.
  const d = new Date(dateISO + "T00:00:00Z");
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start) / 86400000);

  const prompt = `Pick a Word of the Day and a Thought of the Day for a school assembly for Class 8 students.
Date: ${dateISO} (day ${dayOfYear} of the year).
Rules:
- The WORD must be a useful, slightly advanced English vocabulary word a 13-14 year old should learn (not too obscure, not too basic). Make it different from common picks.
- Give a short, clear meaning (max 18 words) in simple English.
- The THOUGHT must be a short, original-feeling motivational/philosophical quote (1-2 sentences, max 30 words). It should fit a morning school assembly. If it's by a famous person, give the author; otherwise leave author empty.
- Vary tone across days: sometimes about kindness, sometimes courage, learning, friendship, hard work, curiosity, gratitude, teamwork, honesty, dreams, perseverance.
Return ONLY valid JSON, no markdown:
{"word":"...","word_meaning":"...","thought":"...","thought_author":"..."}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
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
Top half: the word "${word}" written in big bold elegant typography.
Bottom half: the quote "${thought}" written in clean handwritten-style script.
Soft watercolor / flat illustration background, warm sunrise colors, motivational vibe, clean composition, no extra text, no logos, high quality.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    console.error("image gen failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  const j = await res.json();
  const url: string | undefined = j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  return url ?? null;
}

export const getDailyContent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => inputSchema.parse(i))
  .handler(async ({ data }) => {
    const { date } = data;
    const { data: existing } = await supabaseAdmin
      .from("daily_content")
      .select("*")
      .eq("date", date)
      .maybeSingle();

    if (existing) return existing as DailyRow;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        id: "fallback",
        date,
        word: "Diligent",
        word_meaning: "Showing care and effort in your work.",
        thought: "Small daily effort beats rare bursts of brilliance.",
        thought_author: null,
        image_url: null,
      } as DailyRow;
    }

    try {
      const text = await generateText(apiKey, date);
      const image_url = await generateImage(apiKey, text.word, text.thought);

      const { data: inserted, error } = await supabaseAdmin
        .from("daily_content")
        .insert({ date, ...text, image_url })
        .select("*")
        .single();
      if (error) {
        // race: someone inserted in parallel
        const { data: again } = await supabaseAdmin
          .from("daily_content").select("*").eq("date", date).maybeSingle();
        if (again) return again as DailyRow;
        throw error;
      }
      return inserted as DailyRow;
    } catch (e) {
      console.error("daily content gen error", e);
      return {
        id: "fallback",
        date,
        word: "Resilient",
        word_meaning: "Able to recover quickly from difficulties.",
        thought: "Falling down is part of learning to fly.",
        thought_author: null,
        image_url: null,
      } as DailyRow;
    }
  });
