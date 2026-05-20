'use strict';



/**
 * Normalizes a word by converting it to lowercase, removing punctuation, and trimming.
 *
 * @param {string} word - The word to normalize.
 * @returns {string} - The normalized word.
 */
function normalizeWord(word) {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\"'’]/g, '')
    .trim();
}

// Equivalence mappings to support highly accurate English reading assessment.
const CONTRACTIONS = {
  "dont": "do not",
  "cant": "cannot",
  "wont": "will not",
  "im": "i am",
  "hes": "he is",
  "shes": "she is",
  "its": "it is",
  "theyre": "they are",
  "youre": "you are",
  "weare": "we are",
  "ive": "i have",
  "youve": "you have",
  "weve": "we have",
  "theyve": "they have",
  "id": "i would",
  "youd": "you would",
  "hed": "he would",
  "shed": "she would",
  "wed": "we would",
  "theyd": "they would",
  "ill": "i will",
  "youll": "you will",
  "hell": "he will",
  "shell": "she will",
  "well": "we will",
  "theyll": "they will",
  "isnt": "is not",
  "arent": "are not",
  "wasnt": "was not",
  "werent": "were not",
  "havent": "have not",
  "hasnt": "has not",
  "hadnt": "had not",
  "doesnt": "does not",
  "didnt": "did not",
  "couldnt": "could not",
  "shouldnt": "should not",
  "wouldnt": "would not"
};

const NUMBER_WORDS = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
  "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
  "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen",
  "14": "fourteen", "15": "fifteen", "16": "sixteen", "17": "seventeen",
  "18": "eighteen", "19": "nineteen", "20": "twenty"
};

const SPELLING_VARIANTS = {
  "colour": "color",
  "grey": "gray",
  "favourite": "favorite",
  "theatre": "theater",
  "realise": "realize",
  "organise": "organize",
  "labour": "labor",
  "neighbour": "neighbor",
  "neighbourhood": "neighborhood",
  "learnt": "learned",
  "dreamt": "dreamed"
};

/**
 * Checks if two normalized words are equivalent for reading assessment purposes.
 * Supports exact matching, contractions, spelling variants, and basic numbers.
 */
function areWordsEquivalent(w1, w2) {
  const n1 = normalizeWord(w1);
  const n2 = normalizeWord(w2);
  if (n1 === n2) return true;
  if (!n1 || !n2) return false;

  // 1. Regional spelling variants
  const c1 = SPELLING_VARIANTS[n1] || n1;
  const c2 = SPELLING_VARIANTS[n2] || n2;
  if (c1 === c2) return true;
  
  // Reverse spelling variants lookup
  const revSpelling = {};
  for (const [k, v] of Object.entries(SPELLING_VARIANTS)) {
    revSpelling[v] = k;
  }
  const rc1 = revSpelling[n1] || n1;
  const rc2 = revSpelling[n2] || n2;
  if (rc1 === rc2) return true;

  // 2. Numerical representations
  const num1 = NUMBER_WORDS[n1] || n1;
  const num2 = NUMBER_WORDS[n2] || n2;
  if (num1 === num2) return true;
  
  const revNumber = {};
  for (const [k, v] of Object.entries(NUMBER_WORDS)) {
    revNumber[v] = k;
  }
  const rnum1 = revNumber[n1] || n1;
  const rnum2 = revNumber[n2] || n2;
  if (rnum1 === rnum2) return true;

  // 3. Common contractions
  const cont1 = CONTRACTIONS[n1] || n1;
  const cont2 = CONTRACTIONS[n2] || n2;
  if (cont1 === cont2) return true;
  
  const revContraction = {};
  for (const [k, v] of Object.entries(CONTRACTIONS)) {
    revContraction[v] = k;
  }
  const rcont1 = revContraction[n1] || n1;
  const rcont2 = revContraction[n2] || n2;
  if (rcont1 === rcont2) return true;

  return false;
}

/**
 * Calculates the character-level Levenshtein edit distance between two strings.
 * Used internally for DP path tie-breaking or phonetic check fallbacks.
 */
function charLevenshtein(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return dp[m][n];
}

/**
 * Aligns original article words with ASR transcribed words using dynamic programming.
 *
 * @param {Array<string>} originalWords - Array of original words in order.
 * @param {Array<{word: string, start: number, end: number}>} asrWords - ASR transcribed words with timestamps.
 * @returns {Array<Object>} - The alignment results.
 */
function alignWords(originalWords, asrWords) {
  const N = originalWords.length;
  const M = asrWords.length;
  
  // DP matrix to find minimum edit distance
  const dp = Array.from({ length: N + 1 }, () => Array(M + 1).fill(0));
  const path = Array.from({ length: N + 1 }, () => Array(M + 1).fill(''));

  for (let i = 1; i <= N; i++) {
    dp[i][0] = i * 1.0;
    path[i][0] = 'up'; // deletion (original word skipped)
  }
  for (let j = 1; j <= M; j++) {
    dp[0][j] = j * 1.0;
    path[0][j] = 'left'; // insertion (extra word spoken)
  }

  for (let i = 1; i <= N; i++) {
    const origNorm = normalizeWord(originalWords[i - 1]);
    for (let j = 1; j <= M; j++) {
      const asrNorm = normalizeWord(asrWords[j - 1].word);

      let costDiag = 1.0;
      if (areWordsEquivalent(origNorm, asrNorm)) {
        costDiag = 0.0;
      }

      const scoreDiag = dp[i - 1][j - 1] + costDiag;
      const scoreUp = dp[i - 1][j] + 1.0;
      const scoreLeft = dp[i][j - 1] + 1.0;

      const minScore = Math.min(scoreDiag, scoreUp, scoreLeft);
      dp[i][j] = minScore;

      if (minScore === scoreDiag) {
        path[i][j] = 'diag';
      } else if (minScore === scoreUp) {
        path[i][j] = 'up';
      } else {
        path[i][j] = 'left';
      }
    }
  }

  // Backtrace to get alignment
  const alignment = [];
  let i = N;
  let j = M;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && path[i][j] === 'diag') {
      const origWord = originalWords[i - 1];
      const asrWordObj = asrWords[j - 1];
      const origNorm = normalizeWord(origWord);
      const asrNorm = normalizeWord(asrWordObj.word);

      let type = 'substitution';
      if (areWordsEquivalent(origNorm, asrNorm)) {
        type = 'match';
      }

      alignment.push({
        type,
        originalIndex: i - 1,
        originalWord: origWord,
        asrIndex: j - 1,
        asrWord: asrWordObj.word,
        start: asrWordObj.start,
        end: asrWordObj.end
      });
      i--;
      j--;
    } else if (i > 0 && (j === 0 || path[i][j] === 'up')) {
      alignment.push({
        type: 'deletion', // original word deleted (omitted by student)
        originalIndex: i - 1,
        originalWord: originalWords[i - 1],
        asrIndex: null,
        asrWord: null,
        start: null,
        end: null
      });
      i--;
    } else {
      alignment.push({
        type: 'insertion', // extra word spoken
        originalIndex: null,
        originalWord: null,
        asrIndex: j - 1,
        asrWord: asrWords[j - 1].word,
        start: asrWords[j - 1].start,
        end: asrWords[j - 1].end
      });
      j--;
    }
  }

  alignment.reverse();
  return alignment;
}

/**
 * Detects pauses in speech based on word timestamps.
 * A pause is defined as a silence duration between words that exceeds a threshold.
 *
 * @param {Array<{word: string, start: number, end: number}>} asrWords - The ASR transcribed words.
 * @param {number} thresholdMs - Silence duration threshold in milliseconds (default: 2000).
 * @returns {Array<Object>} - The detected pauses with reference to ASR word index.
 */
function detectPauses(asrWords, thresholdMs = 2000) {
  const pauses = [];
  if (asrWords.length < 2) return pauses;

  for (let k = 1; k < asrWords.length; k++) {
    const prev = asrWords[k - 1];
    const curr = asrWords[k];
    
    // Convert seconds to ms
    const gapMs = (curr.start - prev.end) * 1000;
    if (gapMs >= thresholdMs) {
      pauses.push({
        afterAsrIndex: k - 1,
        durationMs: Math.round(gapMs),
        startSec: prev.end,
        endSec: curr.start
      });
    }
  }
  return pauses;
}

/**
 * Orchestrates the full reading analysis by splitting the original text, aligning it with ASR,
 * and identifying pauses.
 *
 * @param {string} articleContent - The raw original article text.
 * @param {{text: string, words: Array}} asrResult - The ASR transcription result.
 * @param {number} pauseThresholdMs - The pause threshold in milliseconds.
 * @returns {Object} - The comprehensive analysis results.
 */
function analyzeReading(articleContent, asrResult, pauseThresholdMs = 2000) {
  // Split article into words while preserving punctuation in the tokens.
  // We match words plus optional trailing punctuation.
  const originalWords = articleContent.match(/[a-zA-Z0-9'’]+(?:[.,\/#!$%\^&\*;:{}=\-_`~()?\"'’]+)?/g) || [];
  const asrWords = asrResult.words || [];

  // Align original words with ASR words
  const alignment = alignWords(originalWords, asrWords);

  // Detect pauses in the ASR words
  const rawPauses = detectPauses(asrWords, pauseThresholdMs);

  // Map pauses from ASR indices back to original words index
  const pauses = rawPauses.map(pause => {
    // Find the alignment entry matching afterAsrIndex
    const alignEntry = alignment.find(e => e.asrIndex === pause.afterAsrIndex);
    return {
      durationMs: pause.durationMs,
      afterOriginalIndex: alignEntry ? alignEntry.originalIndex : null,
      afterWord: alignEntry ? alignEntry.originalWord : null,
      startSec: pause.startSec,
      endSec: pause.endSec
    };
  }).filter(p => p.afterOriginalIndex !== null); // Keep only pauses mapped to original words

  // Calculate statistics
  const totalWords = originalWords.length;
  
  // We compute statistics based on original words (alignment entries where originalIndex is not null)
  const origAlignment = alignment.filter(e => e.originalIndex !== null);
  
  const correctWords = origAlignment.filter(e => e.type === 'match').length;
  const misreadWords = origAlignment.filter(e => e.type === 'substitution').length;
  const skippedWords = origAlignment.filter(e => e.type === 'deletion').length;
  
  const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

  return {
    alignment,
    pauses,
    stats: {
      totalWords,
      correctWords,
      misreadWords,
      skippedWords,
      accuracy
    }
  };
}

module.exports = {
  normalizeWord,
  charLevenshtein,
  alignWords,
  detectPauses,
  analyzeReading
};
