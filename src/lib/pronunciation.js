export const ASTRA_MODEL = 'Astra';

const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;
const HIRAGANA_OFFSET = 0x60;

export const PRACTICE_PHRASES = [
  { value: 'こんにちは', label: 'こんにちは（あいさつ）' },
  { value: 'ありがとう', label: 'ありがとう（感謝）' },
  { value: 'りょこう', label: 'りょこう（拗音）' },
  { value: 'おばあさん', label: 'おばあさん（長音）' },
  { value: 'がっこう', label: 'がっこう（促音）' },
];

export function normalizeJapaneseInput(input = '') {
  return String(input)
    .normalize('NFKC')
    .trim()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[ァ-ヶ]/g, (char) => {
      const code = char.charCodeAt(0);
      if (code >= KATAKANA_START && code <= KATAKANA_END) {
        return String.fromCharCode(code - HIRAGANA_OFFSET);
      }
      return char;
    });
}

export function buildAstraCoachPrompt({ phrase, learnerReading }) {
  return {
    model: ASTRA_MODEL,
    system: 'あなたは日本語発音コーチです。モーラ、長音、促音、拗音を日本語で短く具体的に指導します。',
    user: `目標フレーズ: ${phrase}\n学習者の発音: ${learnerReading}\nAstraとして、良い点と次の練習を返してください。`,
  };
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, row) => [row]);
  for (let col = 1; col <= b.length; col += 1) matrix[0][col] = col;
  for (let row = 1; row <= a.length; row += 1) {
    for (let col = 1; col <= b.length; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

function collectDifferences(target, spoken) {
  const differences = [];
  const max = Math.max(target.length, spoken.length);
  for (let index = 0; index < max; index += 1) {
    const expected = target[index] ?? '(なし)';
    const actual = spoken[index] ?? '(なし)';
    if (expected !== actual) {
      differences.push({ position: index, expected, actual });
    }
  }
  return differences;
}

function tipsFor(differences, target) {
  const text = differences.map((diff) => `${diff.expected}${diff.actual}`).join('');
  const tips = [];

  if (/[ゃゅょ]/.test(text) || /[ゃゅょ]/.test(target)) {
    const smallKana = (target.match(/[ゃゅょ]/) ?? text.match(/[ゃゅょ]/) ?? ['ゃ・ゅ・ょ'])[0];
    tips.push(`小さい「${smallKana}」は前の音と一緒に短く発音しましょう。例: りょ = り + よ ではなく 1拍。`);
  }
  if (/[あいうえお](なし)|[あいうえお]$/.test(text) || /[あいうえお]$/.test(target)) {
    tips.push('語尾の長さを意識して、最後の母音を省略しないようにしましょう。');
  }
  if (/[っ]/.test(text) || /っ/.test(target)) {
    tips.push('小さい「っ」は一拍分止めてから次の子音に入りましょう。');
  }
  if (tips.length === 0) {
    tips.push('口を少し大きく開け、1拍ずつゆっくり確認してから自然な速さに戻しましょう。');
  }

  return tips;
}

export function analyzePronunciation({ target, spoken }) {
  const normalizedTarget = normalizeJapaneseInput(target);
  const normalizedSpoken = normalizeJapaneseInput(spoken);

  if (!normalizedSpoken) {
    return {
      score: 0,
      level: 'practice',
      feedback: 'まずは聞こえた通りに、ひらがなで入力してみましょう。',
      mispronounced: collectDifferences(normalizedTarget, normalizedSpoken),
      tips: ['短いフレーズから始めて、1拍ずつ声に出して確認しましょう。'],
    };
  }

  const distance = levenshtein(normalizedTarget, normalizedSpoken);
  const denominator = Math.max(normalizedTarget.length, normalizedSpoken.length, 1);
  const score = Math.max(0, Math.round((1 - distance / denominator) * 100));
  const mispronounced = collectDifferences(normalizedTarget, normalizedSpoken);

  if (score === 100) {
    return {
      score,
      level: 'excellent',
      feedback: '完璧です！リズムも音も自然に近いです。次は少し速く言ってみましょう。',
      mispronounced: [],
      tips: ['同じフレーズを3回連続で、同じリズムで発音して定着させましょう。'],
    };
  }

  return {
    score,
    level: score >= 75 ? 'good' : 'practice',
    feedback: score >= 75 ? 'かなり近いです。細かい拍の長さを整えましょう。' : 'もう少し練習しましょう。違った音を1つずつ直せばすぐ良くなります。',
    mispronounced,
    tips: tipsFor(mispronounced, normalizedTarget),
  };
}
