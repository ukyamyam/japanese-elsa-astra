import React, { useMemo, useState } from 'react';
import { Brain, Mic2, Sparkles } from 'lucide-react';
import { ASTRA_MODEL, PRACTICE_PHRASES, analyzePronunciation, buildAstraCoachPrompt } from './lib/pronunciation.js';
import './styles.css';

export default function App() {
  const [target, setTarget] = useState(PRACTICE_PHRASES[0].value);
  const [spoken, setSpoken] = useState('こんにちは');
  const [result, setResult] = useState(null);

  const prompt = useMemo(() => buildAstraCoachPrompt({ phrase: target, learnerReading: spoken }), [target, spoken]);

  function handleAnalyze(event) {
    event.preventDefault();
    setResult(analyzePronunciation({ target, spoken }));
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="main-title">
        <div className="model-pill"><Brain size={18} /> 使用モデル: {ASTRA_MODEL}</div>
        <h1 id="main-title">日本語版 Elsa</h1>
        <p>日本語の発音・リズム・長音を練習できる、Astraモデル指定のAI発音コーチです。</p>
      </section>

      <section className="coach-card" aria-label="発音診断フォーム">
        <form onSubmit={handleAnalyze}>
          <label htmlFor="phrase">練習フレーズ</label>
          <select id="phrase" value={target} onChange={(event) => setTarget(event.target.value)}>
            {PRACTICE_PHRASES.map((phrase) => (
              <option key={phrase.value} value={phrase.value}>{phrase.label}</option>
            ))}
          </select>

          <label htmlFor="spoken">あなたの発音（ひらがなで入力）</label>
          <input
            id="spoken"
            value={spoken}
            onChange={(event) => setSpoken(event.target.value)}
            placeholder="例: こんにちわ"
            autoComplete="off"
          />

          <button type="submit"><Mic2 size={18} /> Astraで診断する</button>
        </form>

        <aside className="prompt-preview" aria-label="Astra coach prompt preview">
          <Sparkles size={18} />
          <span>Astraへ送るコーチ指示を生成済み: {prompt.model}</span>
        </aside>
      </section>

      {result && (
        <section className={`result-card ${result.level}`} aria-live="polite">
          <strong>スコア {result.score}</strong>
          <p>{result.feedback}</p>
          {result.mispronounced.length > 0 && (
            <div>
              <h2>直したい音</h2>
              <ul>
                {result.mispronounced.map((diff) => (
                  <li key={`${diff.position}-${diff.expected}-${diff.actual}`}>
                    {diff.position + 1}文字目: 「{diff.actual}」→「{diff.expected}」
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h2>練習のコツ</h2>
          <ul>
            {result.tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
