import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "@/components/Chat";
import { Bot, Search, ImageIcon, Sparkles } from "lucide-react";

export const Route = createFileRoute("/assistant")({
  component: AssistantPage,
  head: () => ({
    meta: [
      { title: "AI Assistant — Class 8 B" },
      { name: "description", content: "Smart AI study assistant for Class 8 B. Asks Google for fresh facts, can draw pictures, and helps with homework." },
    ],
  }),
});

function AssistantPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold"><span className="text-gradient">AI</span> Assistant</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Your personal study buddy. Ask anything — homework, science, history, current events.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 justify-center text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass"><Search className="w-3 h-3 text-primary" /> Real-time Google search</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass"><ImageIcon className="w-3 h-3 text-primary" /> Image generation</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass"><Bot className="w-3 h-3 text-primary" /> Saved history</span>
        </div>
      </div>
      <Chat />
    </div>
  );
}
