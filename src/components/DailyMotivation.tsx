import { useEffect, useMemo, useState } from "react";
import { Quote, RefreshCw } from "lucide-react";

type Q = { quote: string; author: string; image: string };

// Public Wikimedia Commons portraits (stable URLs)
const QUOTES: Q[] = [
  { quote: "Dream is not that which you see while sleeping, it is something that does not let you sleep.", author: "A.P.J. Abdul Kalam",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/A._P._J._Abdul_Kalam.jpg/320px-A._P._J._Abdul_Kalam.jpg" },
  { quote: "If you want to shine like a sun, first burn like a sun.", author: "A.P.J. Abdul Kalam",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/A._P._J._Abdul_Kalam.jpg/320px-A._P._J._Abdul_Kalam.jpg" },
  { quote: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Swami_Vivekananda-1893-09-signed.jpg/320px-Swami_Vivekananda-1893-09-signed.jpg" },
  { quote: "Take up one idea. Make that one idea your life — and the path to greatness is open.", author: "Swami Vivekananda",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Swami_Vivekananda-1893-09-signed.jpg/320px-Swami_Vivekananda-1893-09-signed.jpg" },
  { quote: "Imagination is more important than knowledge.", author: "Albert Einstein",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/320px-Albert_Einstein_Head.jpg" },
  { quote: "Try not to become a person of success, but rather try to become a person of value.", author: "Albert Einstein",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/320px-Albert_Einstein_Head.jpg" },
  { quote: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Portrait_Gandhi.jpg/320px-Portrait_Gandhi.jpg" },
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Portrait_Gandhi.jpg/320px-Portrait_Gandhi.jpg" },
  { quote: "Where the mind is without fear and the head is held high, into that heaven of freedom, let my country awake.", author: "Rabindranath Tagore",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Rabindranath_Tagore_in_1909.jpg/320px-Rabindranath_Tagore_in_1909.jpg" },
  { quote: "You can't cross the sea merely by standing and staring at the water.", author: "Rabindranath Tagore",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Rabindranath_Tagore_in_1909.jpg/320px-Rabindranath_Tagore_in_1909.jpg" },
  { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/320px-Nelson_Mandela_1994.jpg" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/320px-Nelson_Mandela_1994.jpg" },
  { quote: "Not all of us can do great things. But we can do small things with great love.", author: "Mother Teresa",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/MotherTeresa_094.jpg/320px-MotherTeresa_094.jpg" },
  { quote: "Stay hungry. Stay foolish.", author: "Steve Jobs",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/320px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg" },
  { quote: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/320px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg" },
  { quote: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Bill_Gates_2018.jpg/320px-Bill_Gates_2018.jpg" },
  { quote: "It's fine to celebrate success, but it is more important to heed the lessons of failure.", author: "Bill Gates",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Bill_Gates_2018.jpg/320px-Bill_Gates_2018.jpg" },
];

function dayIndex() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function DailyMotivation() {
  const todayQuote = useMemo(() => QUOTES[dayIndex() % QUOTES.length], []);
  const [q, setQ] = useState<Q>(todayQuote);
  const [key, setKey] = useState(0);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => { setImgOk(true); }, [q]);

  function shuffle() {
    let next = q;
    while (next.quote === q.quote) next = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQ(next); setKey(k => k + 1);
  }

  return (
    <section className="relative overflow-hidden glass-strong rounded-[2rem] shadow-card-soft p-6 sm:p-10">
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div key={`img-${key}`} className="shrink-0 animate-float-up">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-glow bg-secondary">
            {imgOk ? (
              <img src={q.image} alt={q.author} className="w-full h-full object-cover" onError={() => setImgOk(false)} loading="lazy" />
            ) : (
              <div className="w-full h-full bg-hero text-primary-foreground flex items-center justify-center text-3xl font-bold">
                {q.author.split(" ").map(w => w[0]).slice(0,2).join("")}
              </div>
            )}
          </div>
        </div>
        <div key={`text-${key}`} className="flex-1 min-w-0 animate-float-up text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            <Quote className="w-3.5 h-3.5" /> Daily Motivation
          </div>
          <p className="text-lg sm:text-2xl font-semibold leading-snug text-foreground">
            "{q.quote}"
          </p>
          <p className="mt-3 text-sm sm:text-base text-primary font-semibold">— {q.author}</p>
        </div>
        <button onClick={shuffle} className="shrink-0 p-3 rounded-xl glass hover:bg-primary/20 transition-colors" aria-label="Another quote">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
