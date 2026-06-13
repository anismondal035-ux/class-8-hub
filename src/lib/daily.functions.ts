import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { pickFromBank, pickForDate, WORDS } from "./word-bank";

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const shuffleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seed: z.number().int().min(0).max(1_000_000).optional(),
});

const imageReqSchema = z.object({
  word: z.string().min(1).max(60),
  word_meaning: z.string().min(1).max(300).optional(),
  thought: z.string().min(1).max(400),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const overrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  word: z.string().min(1).max(60).optional(),
  word_meaning: z.string().min(1).max(300).optional(),
  word_example: z.string().min(1).max(300).optional(),
  thought: z.string().min(1).max(400).optional(),
  thought_author: z.string().max(120).nullable().optional(),
});

type DailyRow = {
  id: string;
  date: string;
  word: string;
  word_meaning: string;
  word_example?: string | null;
  thought: string;
  thought_author: string | null;
  image_url: string | null;
};

function findExample(word: string): string {
  const w = WORDS.find((x) => x.word.toLowerCase() === word.toLowerCase());
  return w?.example ?? `Try to use the word "${word}" in your own sentence today.`;
}

function buildPosterPrompt(opts: {
  word: string;
  meaning?: string;
  thought: string;
  date?: string;
}) {
  const dateLine = opts.date
    ? new Date(opts.date + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "";
  return `Design a beautiful, premium "Daily Inspiration" poster for a school assembly.
Style: modern, elegant, soft purple-to-indigo gradient background, warm glow, clean typography, motivational vibe, suitable for students aged 13-14. 4K quality.

Compose the poster with these elements clearly visible and well-spaced:
- Top: "DAILY INSPIRATION"${dateLine ? ` and the date "${dateLine}"` : ""} in clean small caps
- Center large: the WORD "${opts.word}" in big bold elegant typography
${opts.meaning ? `- Below the word, smaller italic meaning: "${opts.meaning}"` : ""}
- Bottom half: the quote "${opts.thought}" in elegant handwritten script
- Subtle decorative elements: stars, soft light rays, gentle sparkles

No watermark. No extra unrelated text. Sharp readable lettering. Portrait orientation.`;
}

async function generateImage(apiKey: string, prompt: string): Promise<string | null> {
  // Try the dedicated image endpoint with the new fast image model.
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        prompt,
        n: 1,
      }),
    });
    if (res.ok) {
      const j = await res.json();
      const b64 = j?.data?.[0]?.b64_json;
      if (b64) return `data:image/png;base64,${b64}`;
      const url = j?.data?.[0]?.url;
      if (url) return url;
    } else {
      console.warn("image gen v1/images failed", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("image gen v1/images threw", e);
  }

  // Fallback: chat-completions image shape (older nano banana).
  try {
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
    const url = j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (typeof url === "string" && url.length > 0) return url;
    const b64 = j?.choices?.[0]?.message?.images?.[0]?.b64_json;
    if (b64) return `data:image/png;base64,${b64}`;
    return null;
  } catch (e) {
    console.warn("image gen fallback threw", e);
    return null;
  }
}

// FAST: returns the day's word + thought immediately (from curated bank, no AI cost).
export const getDailyContent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => dateSchema.parse(i))
  .handler(async ({ data }) => {
    const { date } = data;
    const { data: existing } = await supabaseAdmin
      .from("daily_content").select("*").eq("date", date).maybeSingle();
    if (existing) {
      const row = existing as DailyRow;
      if (!row.word_example) {
        row.word_example = findExample(row.word);
      }
      return row;
    }

    // Auto pick from bank (rotates daily by date hash).
    const pick = pickForDate(date);
    const insertPayload = {
      date,
      word: pick.word,
      word_meaning: pick.word_meaning,
      thought: pick.thought,
      thought_author: pick.thought_author,
      image_url: null as string | null,
    };

    try {
      const { data: inserted, error } = await supabaseAdmin
        .from("daily_content")
        .insert(insertPayload)
        .select("*").single();
      if (error) {
        const { data: again } = await supabaseAdmin
          .from("daily_content").select("*").eq("date", date).maybeSingle();
        if (again) {
          const row = again as DailyRow;
          row.word_example = row.word_example ?? findExample(row.word);
          return row;
        }
        throw error;
      }
      const row = inserted as DailyRow;
      row.word_example = pick.word_example;
      return row;
    } catch (e) {
      console.error("daily save error", e);
      return {
        id: "fallback",
        date,
        word: pick.word,
        word_meaning: pick.word_meaning,
        word_example: pick.word_example,
        thought: pick.thought,
        thought_author: pick.thought_author,
        image_url: null,
      } as DailyRow;
    }
  });

// SLOW: generates the poster image lazily.
export const ensureDailyImage = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => dateSchema.parse(i))
  .handler(async ({ data }) => {
    const { date } = data;
    const { data: row } = await supabaseAdmin
      .from("daily_content").select("*").eq("date", date).maybeSingle();
    if (!row) return { image_url: null as string | null };
    if (row.image_url) return { image_url: row.image_url as string };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { image_url: null };

    const prompt = buildPosterPrompt({
      word: row.word,
      meaning: row.word_meaning,
      thought: row.thought,
      date,
    });
    const url = await generateImage(apiKey, prompt);
    if (url) {
      await supabaseAdmin.from("daily_content").update({ image_url: url }).eq("date", date);
    }
    return { image_url: url };
  });

// INSTANT shuffle from local bank — no AI call.
export const shuffleDaily = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => shuffleSchema.parse(i))
  .handler(async ({ data }) => {
    const seed = data.seed ?? Math.floor(Math.random() * 1_000_000);
    return pickFromBank(data.date, seed);
  });

// Generate a poster on demand (also used by shuffle so the image changes).
export const generatePoster = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => imageReqSchema.parse(i))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { image_url: null as string | null };
    const prompt = buildPosterPrompt({
      word: data.word,
      meaning: data.word_meaning,
      thought: data.thought,
      date: data.date,
    });
    const url = await generateImage(apiKey, prompt);
    return { image_url: url };
  });

// Manual override (write to DB, clear image so it regenerates).
export const setDailyOverride = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => overrideSchema.parse(i))
  .handler(async ({ data }) => {
    const { date, ...patch } = data;
    const { data: existing } = await supabaseAdmin
      .from("daily_content").select("*").eq("date", date).maybeSingle();

    const merged = {
      date,
      word: patch.word ?? existing?.word ?? "Resilient",
      word_meaning: patch.word_meaning ?? existing?.word_meaning ?? "Able to recover quickly from difficulties.",
      thought: patch.thought ?? existing?.thought ?? "Stars can't shine without darkness.",
      thought_author: patch.thought_author ?? existing?.thought_author ?? null,
      image_url: null as string | null, // clear so it regenerates
    };

    if (existing) {
      await supabaseAdmin.from("daily_content").update(merged).eq("date", date);
    } else {
      await supabaseAdmin.from("daily_content").insert(merged);
    }
    return { ok: true };
  });
