const SMALL_KANA = new Set(['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゎ']);

const ROMAJI = {
  あ: ['a'], い: ['i'], う: ['u'], え: ['e'], お: ['o'],
  か: ['k', 'a'], き: ['k', 'i'], く: ['k', 'u'], け: ['k', 'e'], こ: ['k', 'o'],
  さ: ['s', 'a'], し: ['sh', 'i'], す: ['s', 'u'], せ: ['s', 'e'], そ: ['s', 'o'],
  た: ['t', 'a'], ち: ['ch', 'i'], つ: ['ts', 'u'], て: ['t', 'e'], と: ['t', 'o'],
  な: ['n', 'a'], に: ['n', 'i'], ぬ: ['n', 'u'], ね: ['n', 'e'], の: ['n', 'o'],
  は: ['h', 'a'], ひ: ['h', 'i'], ふ: ['f', 'u'], へ: ['h', 'e'], ほ: ['h', 'o'],
  ま: ['m', 'a'], み: ['m', 'i'], む: ['m', 'u'], め: ['m', 'e'], も: ['m', 'o'],
  や: ['y', 'a'], ゆ: ['y', 'u'], よ: ['y', 'o'],
  ら: ['r', 'a'], り: ['r', 'i'], る: ['r', 'u'], れ: ['r', 'e'], ろ: ['r', 'o'],
  わ: ['w', 'a'], を: ['o'], ん: ['N'], っ: ['Q'], ー: [':'],
  が: ['g', 'a'], ぎ: ['g', 'i'], ぐ: ['g', 'u'], げ: ['g', 'e'], ご: ['g', 'o'],
  ざ: ['z', 'a'], じ: ['j', 'i'], ず: ['z', 'u'], ぜ: ['z', 'e'], ぞ: ['z', 'o'],
  だ: ['d', 'a'], ぢ: ['j', 'i'], づ: ['z', 'u'], で: ['d', 'e'], ど: ['d', 'o'],
  ば: ['b', 'a'], び: ['b', 'i'], ぶ: ['b', 'u'], べ: ['b', 'e'], ぼ: ['b', 'o'],
  ぱ: ['p', 'a'], ぴ: ['p', 'i'], ぷ: ['p', 'u'], ぺ: ['p', 'e'], ぽ: ['p', 'o'],
  きゃ: ['k', 'y', 'a'], きゅ: ['k', 'y', 'u'], きょ: ['k', 'y', 'o'],
  しゃ: ['sh', 'a'], しゅ: ['sh', 'u'], しょ: ['sh', 'o'],
  ちゃ: ['ch', 'a'], ちゅ: ['ch', 'u'], ちょ: ['ch', 'o'],
  にゃ: ['n', 'y', 'a'], にゅ: ['n', 'y', 'u'], にょ: ['n', 'y', 'o'],
  ひゃ: ['h', 'y', 'a'], ひゅ: ['h', 'y', 'u'], ひょ: ['h', 'y', 'o'],
  みゃ: ['m', 'y', 'a'], みゅ: ['m', 'y', 'u'], みょ: ['m', 'y', 'o'],
  りゃ: ['r', 'y', 'a'], りゅ: ['r', 'y', 'u'], りょ: ['r', 'y', 'o'],
  ぎゃ: ['g', 'y', 'a'], ぎゅ: ['g', 'y', 'u'], ぎょ: ['g', 'y', 'o'],
  じゃ: ['j', 'a'], じゅ: ['j', 'u'], じょ: ['j', 'o'],
  びゃ: ['b', 'y', 'a'], びゅ: ['b', 'y', 'u'], びょ: ['b', 'y', 'o'],
  ぴゃ: ['p', 'y', 'a'], ぴゅ: ['p', 'y', 'u'], ぴょ: ['p', 'y', 'o'],
};

export const PRACTICE_PHRASES = [
  { id: 'hello', text: 'こんにちは', reading: 'こんにちは', focus: '母音と「ん」', accepted: ['こんにちは', 'こんにちわ'] },
  { id: 'travel', text: '旅行に行きます', reading: 'りょこうにいきます', focus: '拗音「りょ」', accepted: ['旅行に行きます', 'りょこうにいきます'] },
  { id: 'school', text: '学校へ行こう', reading: 'がっこうへいこう', focus: '促音「っ」', accepted: ['学校へ行こう', '学校へ行こ', 'がっこうへいこう'] },
  { id: 'grandma', text: 'おばあさん、ありがとう', reading: 'おばあさんありがとう', focus: '長音「あ」', accepted: ['おばあさんありがとう', 'おばあさん、ありがとう'] },
  { id: 'coffee', text: 'コーヒーをください', reading: 'こーひーをください', focus: '長音「ー」', accepted: ['コーヒーをください', 'こーひーをください'] },
];

export function normalizeJapanese(input = '') {
  return String(input).normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  ).replace(/[\s。、！？,.!?「」『』]/g, '');
}

export function toMorae(input) {
  const kana = normalizeJapanese(input);
  const morae = [];
  for (const char of kana) {
    if (SMALL_KANA.has(char) && morae.length && morae.at(-1) !== 'っ') morae[morae.length - 1] += char;
    else morae.push(char);
  }
  return morae;
}

export function kanaToPhonemes(input) {
  return toMorae(input).flatMap((mora) => ROMAJI[mora] ?? [mora]);
}

export function alignPhonemes(expected, heard) {
  const rows = expected.length + 1;
  const cols = heard.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (expected[i - 1] === heard[j - 1] ? 0 : 1),
      );
    }
  }

  const output = [];
  let i = expected.length;
  let j = heard.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expected[i - 1] === heard[j - 1]) {
      output.push({ expected: expected[i - 1], heard: heard[j - 1], status: 'correct' }); i -= 1; j -= 1;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      output.push({ expected: null, heard: heard[j - 1], status: 'extra' }); j -= 1;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      output.push({ expected: expected[i - 1], heard: null, status: 'missing' }); i -= 1;
    } else {
      output.push({ expected: expected[i - 1], heard: heard[j - 1], status: 'different' }); i -= 1; j -= 1;
    }
  }
  return output.reverse();
}

export function resolveRecognizedReading(transcript, phrase) {
  const normalized = normalizeJapanese(transcript);
  const accepted = phrase.accepted?.map(normalizeJapanese) ?? [];
  return accepted.includes(normalized) ? normalizeJapanese(phrase.reading) : normalized;
}

const adviceFor = (issues) => {
  const missing = issues.filter((item) => item.status === 'missing').map((item) => item.expected);
  if (missing.includes('Q')) return '「っ」で一拍ぶん息を止め、次の子音をはっきり出しましょう。';
  if (missing.some((item) => ['a', 'i', 'u', 'e', 'o', ':'].includes(item))) return '母音の長さを保ち、最後まで息を抜かずに発音しましょう。';
  if (issues.length) return '赤い音をゆっくり単独で発音し、次に前後の音とつなげましょう。';
  return 'すべての音が認識されました。同じ明瞭さのまま自然な速さに近づけましょう。';
};

export function analyzeSpeech({ phrase, transcript, confidence = 0, audioMetrics = {} }) {
  const targetPhonemes = kanaToPhonemes(phrase.reading);
  const recognizedReading = resolveRecognizedReading(transcript, phrase);
  const heardPhonemes = kanaToPhonemes(recognizedReading);
  const alignment = alignPhonemes(targetPhonemes, heardPhonemes);
  const issues = alignment.filter((item) => item.status !== 'correct');
  const correct = alignment.filter((item) => item.status === 'correct').length;
  const phonemeAccuracy = targetPhonemes.length ? correct / targetPhonemes.length : 0;
  const score = Math.max(0, Math.min(100, Math.round((phonemeAccuracy * 0.9 + confidence * 0.1) * 100)));
  return {
    score,
    transcript,
    recognizedReading,
    confidence,
    targetPhonemes,
    heardPhonemes,
    alignment,
    issues,
    advice: adviceFor(issues),
    audio: { duration: audioMetrics.duration ?? 0, averageRms: audioMetrics.averageRms ?? 0, peak: audioMetrics.peak ?? 0 },
  };
}
