import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chat } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, User, Bot } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain Pythagoras theorem like I'm 13",
  "Who won the latest cricket world cup?",
  "Draw a picture of a futuristic Kolkata skyline",
  "What is photosynthesis in simple words?",
];

function renderMarkdownLite(text: string) {
  // small markdown: images ![alt](url), **bold**, *italic*, `code`, bullets, line breaks
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const imgMatch = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+|data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+)\)\s*$/);
    if (imgMatch) {
      return (
        <img
          key={i}
          src={imgMatch[2]}
          alt={imgMatch[1] || "image"}
          className="rounded-xl border border-border max-w-full my-2"
          loading="lazy"
        />
      );
    }
    const bullet = /^\s*[-*]\s+/.test(line);
    const clean = line.replace(/^\s*[-*]\s+/, "");
    const html = clean
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl border border-border max-w-full my-2" />')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-sm">$1</code>');
    return (
      <div key={i} className={bullet ? "flex gap-2" : ""}>
        {bullet && <span className="text-primary mt-1">•</span>}
        <span dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} />
      </div>
    );
  });
}

export function Chat() {
  const fn = useServerFn(chat);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const newMsgs: Msg[] = [...messages, { role: "user", content }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fn({ data: { messages: newMsgs } });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Couldn't reach the AI. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-card border border-border shadow-card-soft overflow-hidden flex flex-col h-[70vh] min-h-[520px]">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-card-gradient">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-hero shadow-glow text-primary-foreground">
          <Sparkles className="w-5 h-5" />
        </span>
        <div>
          <h3 className="font-bold leading-tight">Class 8 B Buddy</h3>
          <p className="text-xs text-muted-foreground">Searches the web · can draw pictures · understands Hinglish</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto py-6">
              <h2 className="text-3xl font-bold text-gradient mb-2">Hey, Class 8 B! 👋</h2>
              <p className="text-muted-foreground">
                I'm your study buddy. Ask me anything — I'll explain it simply, even if you type fast and messy.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left p-4 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40 transition-colors text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                m.role === "user" ? "bg-accent text-accent-foreground" : "bg-hero text-primary-foreground shadow-glow"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed text-[15px] space-y-1 ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-secondary text-foreground rounded-tl-sm"
              }`}
            >
              {renderMarkdownLite(m.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-hero text-primary-foreground shadow-glow">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-secondary rounded-2xl px-4 py-3 inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 bg-card-gradient">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
            className="resize-none min-h-[52px] max-h-40 text-base"
            rows={1}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="lg" className="h-[52px] px-5 bg-hero shadow-glow">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
