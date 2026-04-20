const path = require("path");

const VOCAB_FILES = {
  french: "../french_vocabulary.json",
  irish: "../irish_vocabulary.json",
  spanish: "../spanish_vocabulary.json",
};

const LANG_CODES = {
  french: "fr",
  irish: "ga",
  spanish: "es",
};

const loaded = {};

function getVocab(language) {
  if (!loaded[language]) {
    const file = VOCAB_FILES[language] || VOCAB_FILES.french;
    loaded[language] = require(path.join(__dirname, file));
  }
  return loaded[language];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWrongAnswers(correct, pool, goingToEnglish, langKey, count = 2) {
  const others = pool.filter(w =>
    goingToEnglish ? w.english !== correct : w[langKey] !== correct
  );
  return shuffle(others).slice(0, count).map(w => goingToEnglish ? w.english : w[langKey]);
}

function buildRound(word, questionIndex, pool, language) {
  const langKey = language;
  const langCode = LANG_CODES[language] || language;
  const goingToEnglish = Math.random() < 0.5;
  const prompt = goingToEnglish ? word[langKey] : word.english;
  const correctAnswer = goingToEnglish ? word.english : word[langKey];
  const wrongAnswers = getWrongAnswers(correctAnswer, pool, goingToEnglish, langKey);
  const choices = shuffle([correctAnswer, ...wrongAnswers]);
  return {
    prompt,
    direction: goingToEnglish ? `${langCode}→en` : `en→${langCode}`,
    language,
    choices,
    correctAnswer,
    questionIndex,
  };
}

function generateRounds(count = 20, difficulty = 1, language = "french") {
  const allWords = getVocab(language);
  const pool = allWords.filter(w => w.difficulty === difficulty);
  const words = shuffle(pool).slice(0, count);
  return words.map((word, i) => buildRound(word, i, pool, language));
}

module.exports = { generateRounds };
