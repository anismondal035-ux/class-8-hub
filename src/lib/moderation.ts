// Lightweight client-side profanity filter for EN / HI / BN.
// We use simple substring + word-boundary checks. False positives are minimized
// by requiring a word boundary OR an exact-token match for short words.

const BAD_EN = [
  "fuck","fucker","fucking","fck","f u c k","shit","bullshit","bitch","bastard","asshole","arsehole",
  "dick","pussy","cunt","slut","whore","retard","retarded","nigger","nigga","faggot","motherfucker","mf",
  "wtf","stfu","gtfo",
];
const BAD_HI = [
  "chutiya","chutiye","gandu","gaand","madarchod","mc","behenchod","bc","bhosdi","bhosdike","bhosadi",
  "lund","lavde","lawde","randi","raand","chod","saala","saale","kamina","kaminey","harami","kutta","kutiya",
  "kaminae",
];
const BAD_BN = [
  "magi","magir","khanki","khankir","chudi","chudir","baal","baler","khankipula","banchot","banchod",
  "kuttar bachcha","sala","shala","shuorer","shuor",
];
const BAD = [...BAD_EN, ...BAD_HI, ...BAD_BN].map(s => s.toLowerCase());

// pre-build regexes with word boundaries (or whitespace), case-insensitive
const PATTERNS = BAD.map(w => {
  // escape regex chars
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-zA-Z0-9\u0900-\u097F\u0980-\u09FF])${esc}([^a-zA-Z0-9\u0900-\u097F\u0980-\u09FF]|$)`, "i");
});

export function findProfanity(text: string): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  for (let i = 0; i < PATTERNS.length; i++) {
    if (PATTERNS[i].test(t)) return BAD[i];
  }
  return null;
}

export function isClean(text: string) {
  return findProfanity(text) === null;
}
