import { describe, expect, it } from 'vitest';
import {
  alignPhonemes,
  analyzeSpeech,
  kanaToPhonemes,
  resolveRecognizedReading,
  toMorae,
} from './phonemes.js';

describe('Japanese phoneme analysis', () => {
  it('splits contracted sounds, sokuon, and long vowels into Japanese morae', () => {
    expect(toMorae('きょうと')).toEqual(['きょ', 'う', 'と']);
    expect(toMorae('がっこう')).toEqual(['が', 'っ', 'こ', 'う']);
    expect(toMorae('コーヒー')).toEqual(['こ', 'ー', 'ひ', 'ー']);
  });

  it('converts kana into phonemes including contracted and geminate sounds', () => {
    expect(kanaToPhonemes('りょこう')).toEqual(['r', 'y', 'o', 'k', 'o', 'u']);
    expect(kanaToPhonemes('がっこう')).toEqual(['g', 'a', 'Q', 'k', 'o', 'u']);
  });

  it('aligns expected and recognized phonemes and identifies substitutions and omissions', () => {
    const alignment = alignPhonemes(
      ['r', 'y', 'o', 'k', 'o', 'u'],
      ['r', 'i', 'y', 'o', 'k', 'o'],
    );

    expect(alignment.filter((item) => item.status !== 'correct')).toEqual([
      { expected: null, heard: 'i', status: 'extra' },
      { expected: 'u', heard: null, status: 'missing' },
    ]);
  });

  it('resolves kanji returned by speech recognition to the phrase reading', () => {
    const phrase = { text: '旅行に行きます', reading: 'りょこうにいきます', accepted: ['旅行に行きます', 'りょこうにいきます'] };
    expect(resolveRecognizedReading('旅行に行きます。', phrase)).toBe('りょこうにいきます');
  });

  it('scores recognized microphone speech using phoneme accuracy and recognition confidence', () => {
    const result = analyzeSpeech({
      phrase: { text: '旅行', reading: 'りょこう', accepted: ['旅行', 'りょこう'] },
      transcript: 'りよこ',
      confidence: 0.72,
      audioMetrics: { duration: 1.2, averageRms: 0.11, peak: 0.5 },
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.targetPhonemes).toEqual(['r', 'y', 'o', 'k', 'o', 'u']);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.audio.duration).toBe(1.2);
  });
});
