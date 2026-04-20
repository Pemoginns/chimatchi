const path = require("path");
const allWords = require(path.join(__dirname, "../french_vocabulary.json"));

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

function buildRound(word, questionIndex, pool) {
  const isEnglish = Math.random() < 0.5;
  const prompt = isEnglish ? word.french : word.english;
  const correctAnswer = isEnglish ? word.english : word.french;
  const wrongAnswers = getWrongAnswers(correctAnswer, pool, isEnglish);
  const choices = shuffle([correctAnswer, ...wrongAnswers]);
  return {
    prompt,
    direction: isEnglish ? "fr→en" : "en→fr",
    choices,
    correctAnswer,
    questionIndex,
  };
}

function generateRounds(count = 20, difficulty = 1) {
  const pool = allWords.filter(w => w.difficulty === difficulty);
  const words = shuffle(pool).slice(0, count);
  return words.map((word, i) => buildRound(word, i, pool));
}

module.exports = { generateRounds };
