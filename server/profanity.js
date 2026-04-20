// Word-boundary matching — won't block "class" due to "ass", etc.
const BLOCKED = [
  // F-word family
  "fuck", "fucker", "fucked", "fucking", "fucks", "motherfucker", "motherfucking",
  // S-word family
  "shit", "shitting", "shitter", "shitty", "bullshit", "horseshit",
  // B-word
  "bitch", "bitches", "bitching", "bitchy",
  // C-words
  "cunt", "cunts",
  "cock", "cocks", "cocksucker",
  // D-word
  "dick", "dicks", "dickhead", "dickface",
  // P-word
  "pussy", "pussies",
  // A-word
  "asshole", "arsehole", "asshat",
  // Other common
  "bastard", "bastards",
  "twat", "twats",
  "wanker", "wankers", "wanking",
  "bollocks",
  "prick", "pricks",
  "slut", "sluts", "slutty",
  "whore", "whores",
  // Racial slurs (several forms)
  "nigger", "niggers", "nigga", "niggas",
  "chink", "chinks",
  "spic", "spics",
  "kike", "kikes",
  "wetback",
  "gook", "gooks",
  // Homophobic / transphobic slurs
  "faggot", "faggots", "fag", "fags",
  "dyke", "dykes",
  "tranny", "trannies",
  // Ableist slurs
  "retard", "retards", "retarded",
  "spastic",
];

// Compile to regex patterns with word boundaries
const PATTERNS = BLOCKED.map(w => new RegExp(`\\b${w}\\b`, "i"));

function containsProfanity(text) {
  if (!text) return false;
  return PATTERNS.some(p => p.test(text));
}

module.exports = { containsProfanity };
