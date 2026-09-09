import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

let recognition;

class FakeSpeechRecognition {
  constructor() {
    recognition = this;
    this.start = vi.fn();
    this.stop = vi.fn();
  }
}

class FakeMediaRecorder {
  static isTypeSupported = () => true;
  constructor() {
    this.start = vi.fn();
    this.stop = vi.fn(() => this.onstop?.());
  }
}

describe('microphone pronunciation coach', () => {
  beforeEach(() => {
    vi.stubGlobal('SpeechRecognition', FakeSpeechRecognition);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('contains no model branding or manual pronunciation textbox', () => {
    render(<App />);

    expect(screen.queryByText(/使用モデル/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '声で、日本語がうまくなる。' })).toBeInTheDocument();
  });

  it('requests microphone access and starts Japanese speech recognition', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '録音をはじめる' }));

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: expect.any(Object) }));
    expect(recognition.lang).toBe('ja-JP');
    expect(recognition.interimResults).toBe(true);
    expect(recognition.start).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: '録音を止める' })).toBeInTheDocument();
  });

  it('diagnoses the speech-recognition result as a phoneme alignment', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '録音をはじめる' }));

    act(() => {
      recognition.onresult({
        resultIndex: 0,
        results: [{ 0: { transcript: 'こんにちわ', confidence: 0.82 }, isFinal: true }],
      });
      recognition.onend();
    });

    expect(await screen.findByText('認識結果')).toBeInTheDocument();
    expect(screen.getByText('「こんにちわ」')).toBeInTheDocument();
    expect(screen.getByText('音素チェック')).toBeInTheDocument();
    expect(screen.getByText(/総合スコア/)).toBeInTheDocument();
  });
});
