'use strict';

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

/**
 * Initialize OpenAI or Groq client depending on configured environment keys.
 */
const getClient = () => {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const isGroqValid = groqKey && groqKey !== 'gsk_your_groq_api_key_here' && groqKey.trim() !== '';
  const isOpenAIValid = openaiKey && openaiKey !== 'sk-your-openai-api-key-here' && openaiKey.trim() !== '';

  if (isGroqValid) {
    console.log('Initializing client for Groq Whisper ASR...');
    return {
      client: new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: groqKey,
      }),
      model: 'whisper-large-v3',
      type: 'groq'
    };
  } else if (isOpenAIValid) {
    console.log('Initializing client for OpenAI Whisper ASR...');
    return {
      client: new OpenAI({
        apiKey: openaiKey,
      }),
      model: 'whisper-1',
      type: 'openai'
    };
  }

  return null;
};

/**
 * Generates a mock ASR result based on the original article content.
 * Used as a fail-safe fallback for local development when no API keys are present or ASR fails.
 */
function generateMockAsr(articleContent, recordId = 1) {
  if (!articleContent) {
    return {
      text: "the quick brown fox jumps over the lazy dog",
      words: [
        { word: "the", start: 0.5, end: 0.8 },
        { word: "quick", start: 0.9, end: 1.2 },
        { word: "brown", start: 1.3, end: 1.6 },
        { word: "fox", start: 1.7, end: 2.0 },
        { word: "jumps", start: 4.5, end: 4.8 }, // 2.5s pause
        { word: "over", start: 4.9, end: 5.2 },
        { word: "the", start: 5.3, end: 5.6 },
        { word: "lazy", start: 5.7, end: 6.0 },
        { word: "dog", start: 6.1, end: 6.4 }
      ],
      isMock: true
    };
  }

  // Split article into words while keeping punctuation for identification
  const originalWords = articleContent.match(/[a-zA-Z0-9'’]+(?:[.,\/#!$%\^&\*;:{}=\-_`~()?\"'’]+)?/g) || [];
  const words = [];
  let currentTimeSec = 0.5;
  const textArray = [];

  const total = originalWords.length;
  if (total === 0) return { text: "", words: [], isMock: true };

  // Use a pseudo-random seeded generator based on recordId to generate realistic, dynamic mock errors
  const seed = (Number(recordId) || 1) * 7919;
  const pseudoRandom = (offset) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  // For a typical article, let's randomly pick 1-2 words to misread, 1-2 words to skip, and 1-2 pauses.
  // We offset the choices to make them article-length specific and session-specific
  const misreadIndices = new Set([
    Math.floor(pseudoRandom(10) * (total - 4)) + 2,
    Math.floor(pseudoRandom(20) * (total - 4)) + 2
  ]);
  const skipIndices = new Set([
    Math.floor(pseudoRandom(30) * (total - 4)) + 2
  ]);
  const pauseIndices = new Set([
    Math.floor(pseudoRandom(40) * (total - 4)) + 2
  ]);

  // Clean up overlaps
  skipIndices.forEach(idx => {
    if (misreadIndices.has(idx)) misreadIndices.delete(idx);
  });

  originalWords.forEach((word, idx) => {
    // Clean trailing punctuation
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\"'’]/g, '');
    if (!cleanWord) return;

    // 1. Skip the word
    if (skipIndices.has(idx)) {
      console.log(`[Mock ASR Fallback] Simulating skipped word at index ${idx}: "${cleanWord}"`);
      return;
    }

    // 2. Misread the word (substitution)
    if (misreadIndices.has(idx)) {
      const heardWord = "mispronounced_" + cleanWord.toLowerCase();
      words.push({
        word: heardWord,
        start: currentTimeSec,
        end: currentTimeSec + 0.3
      });
      textArray.push(heardWord);
      currentTimeSec += 0.4;
      console.log(`[Mock ASR Fallback] Simulating misread word at index ${idx}: "${cleanWord}" -> "${heardWord}"`);
      return;
    }

    // Normal word
    words.push({
      word: cleanWord,
      start: currentTimeSec,
      end: currentTimeSec + 0.3
    });
    textArray.push(cleanWord);

    // 3. Pause
    if (pauseIndices.has(idx)) {
      const duration = 2.0 + Math.round(pseudoRandom(50 + idx) * 15) / 10; // 2.0s to 3.5s
      console.log(`[Mock ASR Fallback] Simulating ${duration}s pause after word index ${idx} ("${cleanWord}")`);
      currentTimeSec += (duration + 0.3);
    } else {
      currentTimeSec += 0.4;
    }
  });

  return {
    text: textArray.join(' '),
    words: words,
    isMock: true
  };
}

/**
 * Transcribe an audio file using Groq's or OpenAI's Whisper model.
 * Falls back dynamically to a Mock ASR generator if key is missing/invalid or service fails.
 *
 * @param {string} audioFilePath - Absolute or relative path to the audio file.
 * @param {string} [articleContent] - Optional article content to generate highly realistic mock data on failure.
 * @param {number} [recordId] - Optional reading record ID to seed the mock alignment generator.
 * @returns {Promise<{ text: string, words: Array<{ word: string, start: number, end: number }>, isMock: boolean }>}
 */
async function transcribeAudio(audioFilePath, articleContent = null, recordId = 1) {
  const resolvedPath = path.resolve(audioFilePath);
  const clientConfig = getClient();

  if (!clientConfig) {
    console.warn('[WARNING] No valid GROQ_API_KEY or OPENAI_API_KEY found in env. Falling back to Mock ASR Mode for local testing.');
    return generateMockAsr(articleContent, recordId);
  }

  if (!fs.existsSync(resolvedPath)) {
    console.warn(`[WARNING] Audio recording file not found: ${resolvedPath}. Generating mock ASR.`);
    return generateMockAsr(articleContent, recordId);
  }

  try {
    const { client, model, type } = clientConfig;
    const audioStream = fs.createReadStream(resolvedPath);

    console.log(`Sending audio file to ${type === 'groq' ? 'Groq' : 'OpenAI'} Whisper (${model}): ${resolvedPath}`);
    const response = await client.audio.transcriptions.create({
      model: model,
      file: audioStream,
      language: 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    if (!response || !response.text) {
      throw new Error(`Invalid response received from ${type === 'groq' ? 'Groq' : 'OpenAI'} Whisper API`);
    }

    const words = response.words ? response.words.map(w => ({
      word: w.word,
      start: w.start,
      end: w.end
    })) : [];

    console.log(`Successfully transcribed audio. Text: "${response.text.substring(0, 60)}..."`);
    return {
      text: response.text,
      words: words,
      isMock: false
    };
  } catch (error) {
    // If keys are explicitly configured but returned an error (e.g. invalid, quota),
    // we should report the actual error instead of hiding it with a mock fallback.
    console.error(`[ERROR] ASR transcription failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  transcribeAudio
};
