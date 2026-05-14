import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

const SYSTEM_PROMPT_BASE = `You are "Class 8 B Buddy" — a friendly, super-smart AI helper for students of Class 8 B.

How you behave:
- Understand broken English, Hinglish, Banglish or any messy typing. Always reply in clear simple English (or whatever language the student uses).
- Be like a helpful older brother: warm, patient, never preachy.
- For ANY factual question (sports, news, scores, winners, prices, who/what/when, current events, recent results) you MUST use the Google Search tool first and base your answer ONLY on what the search returns. Never guess from memory — your training data is out of date.
- After searching, start the answer with a short line like "🔎 Google says:" then give the fact. Cite the year if relevant (e.g. "RCB won IPL 2025").
- For homework, show short steps so the student learns — don't just dump the answer.
- Use **bold** for key terms, short paragraphs and bullet points. Render LaTeX math with $...$.
- If a student asks for the Word/Thought of the Day, tell them to check the home page card — they can hit "Another" for more.
- Never refuse safe school questions. Never lecture about being an AI.

You belong to Class 8 B. Be proud of it.`;

function wantsImage(text: string) {
  const t = text.toLowerCase();
  return /^(\/image|\/img|\/draw|\/picture)\b/.test(t)
    || /\b(draw|generate|make|create|paint|sketch|show me)\b.*\b(image|picture|drawing|poster|illustration|photo|art)\b/.test(t)
    || /\b(image|picture|poster|illustration) of\b/.test(t);
}

async function generateImage(apiKey: string, prompt: string): Promise<string | null> {
  const cleaned = prompt.replace(/^\/(image|img|draw|picture)\s*/i, "").trim() || prompt;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: `Create a clean, vivid, school-friendly illustration: ${cleaned}` }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return (j?.choices?.[0]?.message?.images?.[0]?.image_url?.url as string) ?? null;
}

export const chat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "AI is not configured yet. Ask Anis to set it up.", error: true };
    }

    const last = data.messages[data.messages.length - 1];
    const isImageRequest = last.role === "user" && wantsImage(last.content);

    if (isImageRequest) {
      const url = await generateImage(apiKey, last.content);
      if (url) {
        return { reply: `Here's what I made for you:\n\n![generated image](${url})\n\nWant a different style? Just say "draw it again as ..." and tell me what to change.`, error: false };
      }
      return { reply: "I tried to draw that but the image generator didn't respond. Try again in a few seconds.", error: true };
    }

    // Text reply with Google Search grounding so it can pull fresh facts.
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
        tools: [{ google_search: {} }],
      }),
    });

    if (!res.ok) {
      // Retry once without tools in case the gateway rejects the search tool.
      if (res.status === 400) {
        const retry = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
          }),
        });
        if (retry.ok) {
          const j = await retry.json();
          return { reply: j?.choices?.[0]?.message?.content ?? "No reply.", error: false };
        }
      }
      if (res.status === 429) return { reply: "Whoa — too many questions at once. Wait a few seconds and try again.", error: true };
      if (res.status === 402) return { reply: "AI credits ran out for now. Tell Anis to top them up in Lovable.", error: true };
      const t = await res.text().catch(() => "");
      console.error("AI gateway error", res.status, t);
      return { reply: "Something went wrong reaching the AI. Try again in a moment.", error: true };
    }

    const json = await res.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "No reply.";
    return { reply, error: false };
  });
