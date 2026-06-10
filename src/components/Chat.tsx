import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chat } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, User, Bot, Trash2, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

const STORAGE_KEY = "class8b-chat-history-v2";
type Msg = { role: "user" | "assistant"; content: string; ts: number };

const SUGGESTIONS = [
  "Explain Pythagoras theorem like I'm 13",
  "Who won the latest cricket match?",
  "Draw a picture of a futuristic Kolkata skyline",
  "Give me 5 tips to score well in Maths",
];

function MessageBubble({ m }: { m: Msg }) {
  const [copied, setCopied] = useState(false);
  const time = new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  function copy() {
    navigator.clipboard.writeText(m.content);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
    toast.success("Copied");
  }
  return (
    <div className={`flex gap-3 animate-float-up ${m.role === "user" ? "flex-row-reverse" : ""}`}>
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
        m.role === "user" ? "bg-accent text-accent-foreground" : "bg-hero text-primary-foreground shadow-glow"
      }`}>
        {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`group max-w-[85%] min-w-0 rounded-2xl px-4 py-3 text-[15px] ${
        m.role === "user"
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "glass text-foreground rounded-tl-sm"
      }`}>
        {m.role === "assistant" ? (
          <div className="md-body break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              img: ({ src, alt }) => <img src={src as string} alt={alt || ""} loading="lazy" />,
            }}>
              {m.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{m.content}</p>
        )}
        <div className="flex items-center justify-between gap-2 mt-1.5 opacity-60 text-[10px]">
          <span>{time}</span>
          <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100 p-1 rounded">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Chat() {
  const fn = useServerFn(chat);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) setMessages(p); }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))); } catch {}
  }, [messages]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const newMsgs: Msg[] = [...messages, { role: "user", content, ts: Date.now() }];
    setMessages(newMsgs); setInput(""); setLoading(true);
    try {
      const res = await fn({ data: { messages: newMsgs.map(({ role, content }) => ({ role, content })) } });
      setMessages((m) => [...m, { role: "assistant", content: res.reply, ts: Date.now() }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Couldn't reach the AI. Please try again.", ts: Date.now() }]);
      toast.error("AI error — please retry");
    } finally { setLoading(false); }
  }

  return (
    <div className="glass rounded-3xl shadow-card-soft overflow-hidden flex flex-col h-[70vh] min-h-[520px]">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-hero shadow-glow text-primary-foreground">
          <Sparkles className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold leading-tight truncate">Class 8 B Buddy</h3>
          <p className="text-xs text-muted-foreground truncate">Googles before answering · can draw pictures · understands Hinglish</p>
        </div>
        {messages.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { setMessages([]); try { localStorage.removeItem(STORAGE_KEY); } catch {} }}>
            <Trash2 className="w-3.5 h-3.5" />
            <span className="ml-1.5 text-xs hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto py-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">Hey, Class 8 B! 👋</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Your AI study buddy. Ask anything — homework, current events, even ask me to draw.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-left p-4 rounded-xl glass hover:border-primary/40 transition-colors text-sm">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} m={m} />)}
        {loading && (
          <div className="flex gap-3 animate-float-up">
            <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-hero text-primary-foreground shadow-glow">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass rounded-2xl px-4 py-3 inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 sm:p-4">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything…"
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
