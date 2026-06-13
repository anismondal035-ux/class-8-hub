import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

const SYSTEM_PROMPT_BASE = `You are "Class 8 B Buddy" — a friendly study helper for Class 8 students.

Style rules (very important):
- Reply in clean, plain English. Always use proper grammar and complete sentences.
- Output MUST be valid Markdown only. Use **bold**, *italic*, bullet lists with "-", numbered lists, and ## headings when helpful.
- NEVER output stray symbols, broken JSON, raw HTML tags, or code-block fences unless the student asked for code. NEVER paste tool/function call syntax.
- Keep answers concise and well-formatted. Short paragraphs. Bullet points for lists.
- Be warm, encouraging, like a helpful older sibling. No lectures, no "as an AI" disclaimers.

Knowledge rules:
- For current/factual questions (sports, news, scores, winners, recent events, prices) ALWAYS use Google Search and base your answer on the latest results, not memory.
- When you searched, start with "🔎 " on its own short opening line, then give the answer with the year mentioned (e.g. "RCB won IPL 2025").
- For homework, show short logical steps so the student actually learns. Don't just dump the answer.

You belong to Class 8 B. Be proud of it.`;

function wantsImage(text: string) {
  const t = text.toLowerCase();
  return /^(\/image|\/img|\/draw|\/picture)\b/.test(t)
    || /\b(draw|generate|make|create|paint|sketch|show me)\b.*\b(image|picture|drawing|poster|illustration|photo|art)\b/.test(t)
    || /\b(image|picture|poster|illustration) of\b/.test(t);
}

async function generateImage(apiKey: string, prompt: string): Promise<string | null> {
  const cleaned = prompt.replace(/^\/(image|img|draw|picture)\s*/i, "").trim() || prompt;
  const fullPrompt = `Create a clean, vivid, school-friendly illustration. High quality, sharp details, no text overlays. Subject: ${cleaned}`;

  // Primary: dedicated images endpoint (more reliable, normalized response).
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        prompt: fullPrompt,
        n: 1,
      }),
    });
    if (res.ok) {
      const j = await res.json();
      const b64 = j?.data?.[0]?.b64_json;
      if (b64) return `data:image/png;base64,${b64}`;
      const url = j?.data?.[0]?.url;
      if (typeof url === "string" && url.length > 0) return url;
    } else {
      console.warn("image gen v1/images failed", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("image gen v1/images threw", e);
  }

  // Fallback: chat-completions image shape.
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
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
        // Embed a marker so the chat UI can render a rich image card (zoom/download/regen).
        return {
          reply: `__IMAGE__${JSON.stringify({ url, prompt: last.content })}__IMAGE__`,
          error: false,
        };
      }
      return { reply: "I couldn't generate that image — the image service didn't respond. Please try again.", error: true };
    }

    // Inject today's real date so the model knows what "latest" means.
    const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const SYSTEM_PROMPT = `${SYSTEM_PROMPT_BASE}\n\nToday's date is ${today}. Treat anything before today as past. Always Google for current facts.`;

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
