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


/**
 * Strict exact-match word comparison for reading assessment.
 * Uses only normalized comparison. No spelling variants, no contractions, no number
 * substitutions — the student must read exactly what is written.
 */
function areWordsEquivalent(w1, w2) {
  const n1 = normalizeWord(w1);
  const n2 = normalizeWord(w2);
  return n1 === n2 && n1 !== '';
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

      // Slightly higher cost for substitution vs deletion so trailing
      // unmatched words prefer deletion (skipped) over substitution (misread).
      let costDiag = 1.001;
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
  alignWords,
  detectPauses,
  analyzeReading
};
