import { describe, expect, it } from 'vitest';
import { ASTRA_MODEL, analyzePronunciation, normalizeJapaneseInput, buildAstraCoachPrompt } from './pronunciation.js';

describe('Japanese pronunciation coach domain', () => {
  it('defaults every coach request to the Astra model', () => {
    const prompt = buildAstraCoachPrompt({ phrase: 'こんにちは', learnerReading: 'こんにちわ' });

    expect(ASTRA_MODEL).toBe('Astra');
    expect(prompt.model).toBe('Astra');
    expect(prompt.system).toContain('日本語発音コーチ');
  });

  it('normalizes Japanese input by trimming, unifying spaces, and converting katakana to hiragana', () => {
    expect(normalizeJapaneseInput('  コン ニチハ　')).toBe('こんにちは');
  });

  it('scores a perfect phrase at 100 with encouraging Japanese feedback', () => {
    const result = analyzePronunciation({ target: 'ありがとう', spoken: 'ありがとう' });

    expect(result.score).toBe(100);
    expect(result.level).toBe('excellent');
    expect(result.feedback).toContain('完璧');
    expect(result.mispronounced).toEqual([]);
  });

  it('identifies mora differences and returns actionable practice tips', () => {
    const result = analyzePronunciation({ target: 'りょこう', spoken: 'りよこ' });

    expect(result.score).toBeLessThan(100);
    expect(result.level).toBe('practice');
    expect(result.mispronounced).toEqual([
      { position: 1, expected: 'ょ', actual: 'よ' },
      { position: 3, expected: 'う', actual: '(なし)' },
    ]);
    expect(result.tips.join('\n')).toContain('小さい「ょ」');
    expect(result.tips.join('\n')).toContain('語尾の長さ');
  });
});
