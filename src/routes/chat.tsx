import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Search, Reply, X, Trash2, LogIn, Smile } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: ClassChatPage,
  head: () => ({
    meta: [
      { title: "Class Chat — Class 8 B" },
      { name: "description", content: "Real-time chat for Class 8 B students." },
    ],
  }),
});

type Msg = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  content: string;
  reply_to: string | null;
  created_at: string;
};

const EMOJIS = ["😀","😂","🥲","😍","🤩","🤔","😎","🙌","🔥","💯","🎉","❤️","👍","👏","✨","💜"];

function ChatBubble({ m, mine, all, onReply, onDelete }: { m: Msg; mine: boolean; all: Msg[]; onReply: (m: Msg) => void; onDelete: () => void }) {
  const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const replied = m.reply_to ? all.find((x) => x.id === m.reply_to) : null;
  return (
    <div className={`flex gap-2.5 group animate-float-up ${mine ? "flex-row-reverse" : ""}`}>
      {m.avatar_url ? (
        <img src={m.avatar_url} alt="" className="w-9 h-9 rounded-full shrink-0 border border-primary/30" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-hero text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
          {m.display_name[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      <div className={`max-w-[78%] min-w-0 ${mine ? "items-end" : "items-start"} flex flex-col`}>
        <div className="text-[11px] text-muted-foreground mb-0.5 px-1">{m.display_name} · {time}</div>
        <div className={`rounded-2xl px-4 py-2.5 text-[15px] break-words ${mine ? "bg-hero text-primary-foreground rounded-tr-sm shadow-soft-glow" : "glass rounded-tl-sm"}`}>
          {replied && (
            <div className="text-[11px] opacity-80 border-l-2 border-current pl-2 mb-1.5 truncate">
              ↪ {replied.display_name}: {replied.content.slice(0, 60)}
            </div>
          )}
          <p className="whitespace-pre-wrap">{m.content}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1 px-1">
          <button onClick={() => onReply(m)} className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-0.5"><Reply className="w-3 h-3" /> Reply</button>
          {mine && <button onClick={onDelete} className="text-[10px] text-muted-foreground hover:text-destructive inline-flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> Delete</button>}
        </div>
      </div>
    </div>
  );
}

function ClassChatPage() {
  const { user, profile, signInWithGoogle } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<Msg | null>(null);
  const [search, setSearch] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial load + realtime
  useEffect(() => {
    let mounted = true;
    supabase.from("chat_messages").select("*").order("created_at", { ascending: true }).limit(500).then(({ data }) => {
      if (mounted && data) setMessages(data as Msg[]);
    });
    const ch = supabase
      .channel("class-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => {
        setMessages((m) => [...m, p.new as Msg]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (p) => {
        setMessages((m) => m.filter((x) => x.id !== (p.old as any).id));
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const content = input.trim();
    if (!content || !user) return;
    setInput(""); setEmojiOpen(false);
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      display_name: profile?.display_name || "Student",
      avatar_url: profile?.avatar_url ?? null,
      content,
      reply_to: reply?.id ?? null,
    });
    setReply(null);
    if (error) { toast.error("Couldn't send. Try again."); setInput(content); }
  }

  async function del(id: string) {
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) toast.error("Couldn't delete");
  }

  const filtered = search.trim()
    ? messages.filter((m) => `${m.display_name} ${m.content}`.toLowerCase().includes(search.toLowerCase()))
    : messages;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="text-center mb-5">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-3">
          <MessageSquare className="w-3.5 h-3.5" /> Real-time class chat
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold"><span className="text-gradient">Class Chat</span></h1>
      </div>

      <div className="glass-strong rounded-3xl shadow-card-soft overflow-hidden flex flex-col h-[75vh] min-h-[560px]">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages…" className="border-0 bg-transparent focus-visible:ring-0 h-8 px-0" />
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{search ? "No matching messages." : "Be the first to say hi! 👋"}</p>
            </div>
          )}
          {filtered.map((m) => (
            <ChatBubble key={m.id} m={m} mine={m.user_id === user?.id} all={messages} onReply={setReply} onDelete={() => del(m.id)} />
          ))}
        </div>

        {reply && (
          <div className="px-4 py-2 border-t border-border bg-primary/5 flex items-center justify-between gap-2">
            <p className="text-xs truncate"><b>Replying to {reply.display_name}:</b> {reply.content}</p>
            <button onClick={() => setReply(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        )}

        {emojiOpen && (
          <div className="px-4 py-2 border-t border-border flex flex-wrap gap-1">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setInput((v) => v + e)} className="text-2xl hover:scale-125 transition-transform">{e}</button>
            ))}
          </div>
        )}

        <div className="border-t border-border p-3">
          {!user ? (
            <div className="flex items-center justify-between gap-3 px-2">
              <p className="text-sm text-muted-foreground">Sign in with Google to chat. Messages are saved permanently.</p>
              <Button onClick={signInWithGoogle} className="bg-hero shadow-soft-glow"><LogIn className="w-4 h-4 mr-1.5" /> Sign in</Button>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <button onClick={() => setEmojiOpen((v) => !v)} className="p-3 rounded-lg hover:bg-secondary text-muted-foreground" aria-label="Emojis">
                <Smile className="w-5 h-5" />
              </button>
              <Textarea
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Message as ${profile?.display_name || "you"}…`}
                rows={1} className="resize-none min-h-[48px] max-h-32 text-base"
              />
              <Button onClick={send} disabled={!input.trim()} size="lg" className="h-[48px] px-5 bg-hero shadow-soft-glow">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
