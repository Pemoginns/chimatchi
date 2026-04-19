const frenchVocabulary = [
  { french: "chien", english: "dog" },
  { french: "chat", english: "cat" },
  { french: "maison", english: "house" },
  { french: "voiture", english: "car" },
  { french: "livre", english: "book" },
  { french: "eau", english: "water" },
  { french: "pain", english: "bread" },
  { french: "arbre", english: "tree" },
  { french: "soleil", english: "sun" },
  { french: "lune", english: "moon" },
  { french: "étoile", english: "star" },
  { french: "fleur", english: "flower" },
  { french: "oiseau", english: "bird" },
  { french: "poisson", english: "fish" },
  { french: "cheval", english: "horse" },
  { french: "vache", english: "cow" },
  { french: "cochon", english: "pig" },
  { french: "mouton", english: "sheep" },
  { french: "poulet", english: "chicken" },
  { french: "lapin", english: "rabbit" },
  { french: "rouge", english: "red" },
  { french: "bleu", english: "blue" },
  { french: "vert", english: "green" },
  { french: "jaune", english: "yellow" },
  { french: "noir", english: "black" },
  { french: "blanc", english: "white" },
  { french: "grand", english: "big" },
  { french: "petit", english: "small" },
  { french: "rapide", english: "fast" },
  { french: "lent", english: "slow" },
  { french: "manger", english: "to eat" },
  { french: "boire", english: "to drink" },
  { french: "dormir", english: "to sleep" },
  { french: "courir", english: "to run" },
  { french: "marcher", english: "to walk" },
  { french: "parler", english: "to speak" },
  { french: "lire", english: "to read" },
  { french: "écrire", english: "to write" },
  { french: "jouer", english: "to play" },
  { french: "travailler", english: "to work" },
  { french: "école", english: "school" },
  { french: "famille", english: "family" },
  { french: "ami", english: "friend" },
  { french: "temps", english: "time" },
  { french: "jour", english: "day" },
  { french: "nuit", english: "night" },
  { french: "matin", english: "morning" },
  { french: "soir", english: "evening" },
  { french: "semaine", english: "week" },
  { french: "mois", english: "month" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWrongAnswers(correct, pool, isEnglish, count = 2) {
  const others = pool.filter(w =>
    isEnglish ? w.english !== correct : w.french !== correct
  );
  return shuffle(others).slice(0, count).map(w => isEnglish ? w.english : w.french);
}

function buildRound(word, questionIndex) {
  const isEnglish = Math.random() < 0.5;
  const prompt = isEnglish ? word.french : word.english;
  const correctAnswer = isEnglish ? word.english : word.french;
  const wrongAnswers = getWrongAnswers(correctAnswer, frenchVocabulary, isEnglish);
  const choices = shuffle([correctAnswer, ...wrongAnswers]);
  return {
    prompt,
    direction: isEnglish ? "fr→en" : "en→fr",
    choices,
    correctAnswer,
    questionIndex,
  };
}

function generateRounds(count = 20) {
  const words = shuffle(frenchVocabulary).slice(0, count);
  return words.map((word, i) => buildRound(word, i));
}

module.exports = { generateRounds };
