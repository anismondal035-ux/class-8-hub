import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

const SYSTEM_PROMPT = `You are "Class 8 B Buddy" — a friendly, super-smart AI helper for students of Class 8 B.

How you behave:
- Understand broken English, Hinglish, Banglish or any messy typing. Always reply in clear, simple English (or the language the student uses).
- Be like a helpful older brother: warm, patient, never condescending, never preachy.
- Answer EVERYTHING the student asks — homework (math, science, English, social studies, computer), general knowledge, definitions, "what is", "why", "how", history, current facts, life advice for school kids, project ideas, etc.
- For factual questions, share the most accurate, well-known info you have. Be specific (numbers, dates, names) instead of vague.
- For homework, show short steps so the student learns — don't just dump the answer.
- Keep replies focused and well-formatted. Use short paragraphs, bullet points and **bold** for key terms.
- If a student asks for the Word of the Day or Thought of the Day, tell them to check the home page card — it updates daily.
- Never refuse safe school questions. Never lecture about being an AI.

You belong to Class 8 B. Be proud of it.`;

export const chat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "AI is not configured yet. Ask Anis to set it up.", error: true };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return { reply: "Whoa — too many questions at once. Wait a few seconds and try again.", error: true };
      }
      if (res.status === 402) {
        return { reply: "AI credits ran out for now. Tell Anis to top them up in Lovable.", error: true };
      }
      const t = await res.text().catch(() => "");
      console.error("AI gateway error", res.status, t);
      return { reply: "Something went wrong reaching the AI. Try again in a moment.", error: true };
    }

    const json = await res.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "No reply.";
    return { reply, error: false };
  });
