import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, RotateCcw } from "lucide-react";

const TRUTHS = [
  "What's your most embarrassing moment in school?",
  "If you could swap places with any teacher for a day, who would it be and why?",
  "What's a subject you secretly love but pretend not to?",
  "Who was your first best friend in school?",
  "What's the silliest excuse you've used for not doing homework?",
  "If you could rename your school, what would you call it?",
  "Who in our class makes you laugh the most?",
  "What's your dream career? Be honest!",
  "What's a small thing that makes your day better?",
  "Who do you copy notes from the most? (Don't lie!)",
  "What's the funniest nickname you've had?",
  "What superpower would you choose for school exams?",
  "What's the most boring class for you, honestly?",
  "If you had ₹1000 right now, what's the first thing you'd buy?",
  "What's your guilty-pleasure song that no one knows you love?",
  "Who was your celebrity crush in primary school?",
  "What's the weirdest thing in your school bag right now?",
  "Have you ever fallen asleep in class? When?",
  "What's a habit of yours that annoys your siblings?",
  "If you had to teach a class for one period, which subject would you pick?",
  "Which classmate would you want as your study partner forever?",
  "What's something you're really proud of but never talk about?",
  "What's your biggest fear about high school?",
  "What's the most childish thing you still do?",
  "Tell us about a time you got caught doing something silly.",
];

const DARES = [
  "Do your best impression of your favourite teacher.",
  "Speak in a British accent for the next 3 minutes.",
  "Sing the first verse of your favourite song out loud.",
  "Dance for 30 seconds with no music.",
  "Do 15 jumping jacks right now.",
  "Try to lick your elbow.",
  "Spell your full name backwards out loud.",
  "Recite the alphabet… backwards.",
  "Do a tongue twister three times fast: 'She sells sea shells…'",
  "Talk like a news anchor for 1 minute.",
  "Pretend you're a robot for the next 2 minutes.",
  "Hop on one foot while singing your favourite song.",
  "Do your best laugh and try to make everyone else laugh too.",
  "Call out your favourite cartoon's catchphrase loudly.",
  "Eat a spoonful of something sour without making a face. (with permission!)",
  "Imitate a celebrity until someone guesses correctly.",
  "Hold your breath for 20 seconds.",
  "Make up a short rap about your favourite subject.",
  "Speak only in questions for the next minute.",
  "Try to balance a book on your head for 30 seconds.",
  "Do your funniest selfie pose.",
  "Talk in slow motion for 1 minute.",
  "Use only emojis to describe your day so far (say them out loud).",
  "Do your best 'mom yelling at you' impression.",
  "Pretend to be a tour guide showing the room — be dramatic!",
];

export function TruthOrDare() {
  const [mode, setMode] = useState<"solo" | "party">("solo");
  const [players, setPlayers] = useState<string[]>(["Player 1", "Player 2"]);
  const [turn, setTurn] = useState(0);
  const [prompt, setPrompt] = useState<{ kind: "Truth" | "Dare"; text: string } | null>(null);
  const [adding, setAdding] = useState("");

  function pick(kind: "Truth" | "Dare") {
    const list = kind === "Truth" ? TRUTHS : DARES;
    const text = list[Math.floor(Math.random() * list.length)];
    setPrompt({ kind, text });
  }
  function next() {
    setPrompt(null);
    if (mode === "party") setTurn((t) => (t + 1) % Math.max(players.length, 1));
  }
  function addPlayer() {
    if (!adding.trim()) return;
    setPlayers([...players, adding.trim()]); setAdding("");
  }
  function removePlayer(i: number) {
    if (players.length <= 1) return;
    setPlayers(players.filter((_, j) => j !== i));
    setTurn(0);
  }

  return (
    <div className="glass rounded-3xl p-6 max-w-md mx-auto">
      <div className="flex justify-center gap-2 mb-5">
        <Button size="sm" variant={mode === "solo" ? "default" : "outline"} onClick={() => { setMode("solo"); setPrompt(null); }}>
          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Solo
        </Button>
        <Button size="sm" variant={mode === "party" ? "default" : "outline"} onClick={() => { setMode("party"); setPrompt(null); }}>
          <Users className="w-3.5 h-3.5 mr-1.5" /> Party
        </Button>
      </div>

      {mode === "party" && (
        <div className="mb-5">
          <p className="text-xs text-muted-foreground mb-2">Players:</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {players.map((p, i) => (
              <span key={i} className={`px-2.5 py-1 rounded-full text-xs ${i === turn ? "bg-hero text-primary-foreground font-semibold" : "bg-secondary"}`}>
                {p}{players.length > 1 && <button onClick={() => removePlayer(i)} className="ml-1.5 opacity-60 hover:opacity-100">×</button>}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Add player…"
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              className="flex-1 bg-secondary px-3 h-9 rounded-md text-sm border border-border" />
            <Button size="sm" onClick={addPlayer}>Add</Button>
          </div>
        </div>
      )}

      <div className="text-center">
        {mode === "party" && !prompt && (
          <p className="mb-3 text-lg"><b className="text-primary">{players[turn]}</b>, your turn!</p>
        )}
        {!prompt ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">Choose one:</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => pick("Truth")} className="bg-hero shadow-glow px-8">Truth</Button>
              <Button onClick={() => pick("Dare")} variant="outline" className="px-8">Dare</Button>
            </div>
          </div>
        ) : (
          <div className="animate-float-up">
            <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">{prompt.kind}</p>
            <p className="text-lg font-medium leading-snug mb-5">{prompt.text}</p>
            <Button onClick={next}><RotateCcw className="w-4 h-4 mr-1.5" /> Next</Button>
          </div>
        )}
      </div>

      <p className="mt-5 text-center text-[10px] text-muted-foreground">
        School-friendly only. All {TRUTHS.length} truths & {DARES.length} dares are safe for class.
      </p>
    </div>
  );
}
