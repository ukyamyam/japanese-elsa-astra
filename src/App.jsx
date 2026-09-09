import React, { useRef, useState } from 'react';
import { AudioLines, Check, ChevronDown, Headphones, Mic, RotateCcw, ShieldCheck, Square, Volume2 } from 'lucide-react';
import { PRACTICE_PHRASES, analyzeSpeech } from './lib/phonemes.js';
import { startAudioMeter } from './lib/audioMeter.js';
import './styles.css';

const SpeechRecognitionClass = () => window.SpeechRecognition || window.webkitSpeechRecognition;

function Waveform({ active, level }) {
  return (
    <div className={`waveform ${active ? 'is-live' : ''}`} aria-label={active ? '録音中の音声レベル' : '待機中'}>
      {Array.from({ length: 36 }, (_, index) => (
        <span key={index} style={{ '--height': `${14 + ((index * 17) % 42)}px`, '--level': Math.max(.18, level) }} />
      ))}
    </div>
  );
}

function PhonemeRow({ alignment }) {
  return (
    <div className="phoneme-row">
      {alignment.map((item, index) => (
        <div className={`phoneme ${item.status}`} key={`${index}-${item.expected}-${item.heard}`}>
          <span>{item.expected ?? '—'}</span>
          <small>{item.status === 'correct' ? 'OK' : item.heard ? `→ ${item.heard}` : '不足'}</small>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [phraseId, setPhraseId] = useState(PRACTICE_PHRASES[0].id);
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [level, setLevel] = useState(0);
  const sessionRef = useRef(null);
  const phrase = PRACTICE_PHRASES.find((item) => item.id === phraseId);
  const supported = Boolean(SpeechRecognitionClass() && navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

  const finishSession = (latestTranscript, confidence) => {
    const session = sessionRef.current;
    if (!session) return;
    const meterMetrics = session.meter?.stop() ?? {};
    const audioMetrics = { ...meterMetrics, duration: Math.max(0.1, (Date.now() - session.startedAt) / 1000) };
    if (session.recorder?.state !== 'inactive') session.recorder?.stop();
    session.stream.getTracks().forEach((track) => track.stop());
    sessionRef.current = null;
    setLevel(0);
    setStatus('idle');
    if (latestTranscript) setResult(analyzeSpeech({ phrase: session.phrase, transcript: latestTranscript, confidence, audioMetrics }));
    else setError('音声を認識できませんでした。マイクに近づいて、もう一度お試しください。');
  };

  async function startRecording() {
    setError('');
    setResult(null);
    setTranscript('');
    if (!supported) {
      setError('このブラウザは日本語音声認識に対応していません。Chrome または Edge の最新版をご利用ください。');
      return;
    }

    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const Recognition = SpeechRecognitionClass();
      const recognition = new Recognition();
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      let latestTranscript = '';
      let latestConfidence = 0;

      recognition.lang = 'ja-JP';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 3;
      recorder.ondataavailable = (event) => event.data?.size && chunks.push(event.data);
      recorder.onstop = () => {
        if (chunks.length) sessionRef.current?.setAudioUrl?.(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })));
      };
      recognition.onresult = (event) => {
        let combined = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          combined += event.results[index][0].transcript;
          if (event.results[index].isFinal) latestConfidence = event.results[index][0].confidence || 0;
        }
        latestTranscript = combined.trim();
        setTranscript(latestTranscript);
      };
      recognition.onerror = (event) => {
        const message = event.error === 'not-allowed' ? 'マイクの使用が許可されていません。ブラウザの設定から許可してください。' : '音声認識でエラーが発生しました。もう一度お試しください。';
        setError(message);
      };
      recognition.onend = () => finishSession(latestTranscript, latestConfidence);

      sessionRef.current = { recognition, recorder, stream, phrase, startedAt: Date.now(), meter: startAudioMeter(stream, setLevel) };
      recorder.start();
      recognition.start();
      setStatus('recording');
    } catch (caught) {
      setStatus('idle');
      setError(caught?.name === 'NotAllowedError' ? 'マイクの使用が許可されていません。ブラウザの設定から許可してください。' : 'マイクを開始できませんでした。接続を確認してください。');
    }
  }

  function stopRecording() {
    if (sessionRef.current) {
      setStatus('analyzing');
      sessionRef.current.recognition.stop();
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark"><AudioLines size={19} /></span>Koe</a>
        <span className="privacy"><ShieldCheck size={15} /> マイクは診断時のみ使用</span>
      </header>

      <div className="page" id="top">
        <section className="intro">
          <p className="eyebrow">JAPANESE PRONUNCIATION COACH</p>
          <h1>声で、日本語が<br />うまくなる。</h1>
          <p className="lead">話した音を日本語として認識し、目標の音素列と照合。聞き取られなかった音を、一音ずつ可視化します。</p>
        </section>

        <section className="studio" aria-label="発音録音スタジオ">
          <div className="studio-head">
            <div><span className="step">01</span><h2>練習するフレーズ</h2></div>
            <div className="select-wrap"><select aria-label="練習フレーズ" value={phraseId} onChange={(event) => { setPhraseId(event.target.value); setResult(null); }}>
              {PRACTICE_PHRASES.map((item) => <option value={item.id} key={item.id}>{item.text}</option>)}
            </select><ChevronDown size={16} /></div>
          </div>

          <div className="phrase-panel">
            <p className="focus">FOCUS · {phrase.focus}</p>
            <p className="target-phrase">{phrase.text}</p>
            <p className="reading">{phrase.reading}</p>
          </div>

          <Waveform active={status === 'recording'} level={level} />
          {transcript && status === 'recording' && <p className="live-caption">認識中: {transcript}</p>}

          <div className="record-controls">
            {status === 'recording' ? (
              <button className="record-button stop" onClick={stopRecording}><Square size={21} fill="currentColor" />録音を止める</button>
            ) : (
              <button className="record-button" onClick={startRecording} disabled={status === 'requesting' || status === 'analyzing'}><Mic size={23} />{status === 'analyzing' ? '診断中…' : status === 'requesting' ? 'マイクを準備中…' : '録音をはじめる'}</button>
            )}
            <p>ボタンを押して、上のフレーズを自然に話してください</p>
          </div>
          {error && <div className="error" role="alert">{error}</div>}
        </section>

        {result && <section className="results" aria-live="polite">
          <div className="results-heading"><div><span className="step">02</span><h2>診断結果</h2></div><button className="retry" onClick={startRecording}><RotateCcw size={16} />もう一度</button></div>
          <div className="score-grid">
            <div className="score-card"><span>総合スコア</span><strong>{result.score}</strong><small>/ 100</small></div>
            <div className="recognized"><span>認識結果</span><strong>「{result.transcript}」</strong><p>音声認識の信頼度 {Math.round(result.confidence * 100)}%</p></div>
          </div>
          <div className="analysis-card">
            <div className="card-label"><Headphones size={18} /><h3>音素チェック</h3><span>{result.issues.length ? `${result.issues.length}箇所を確認` : 'すべて一致'}</span></div>
            <PhonemeRow alignment={result.alignment} />
            <div className="legend"><span><i className="ok" />一致</span><span><i className="ng" />要練習</span></div>
          </div>
          <div className="advice"><Volume2 size={22} /><div><span>次の練習</span><p>{result.advice}</p></div></div>
        </section>}

        <footer>音声認識結果と日本語の音素列を照合する練習ツールです。医療・専門的な音声評価ではありません。</footer>
      </div>
    </main>
  );
}
