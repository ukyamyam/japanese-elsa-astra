import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

describe('Japanese Elsa Astra app', () => {
  it('shows Japanese-first learning copy and Astra model badge', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /日本語版 elsa/i })).toBeInTheDocument();
    expect(screen.getByText(/使用モデル: Astra/)).toBeInTheDocument();
    expect(screen.getByText(/日本語の発音・リズム・長音を練習/)).toBeInTheDocument();
  });

  it('analyzes typed pronunciation and displays score, feedback, and detailed tips', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText('練習フレーズ'), 'りょこう');
    await user.clear(screen.getByLabelText('あなたの発音（ひらがなで入力）'));
    await user.type(screen.getByLabelText('あなたの発音（ひらがなで入力）'), 'りよこ');
    await user.click(screen.getByRole('button', { name: 'Astraで診断する' }));

    expect(screen.getByText('スコア 50')).toBeInTheDocument();
    expect(screen.getByText(/もう少し練習/)).toBeInTheDocument();
    expect(screen.getByText(/小さい「ょ」/)).toBeInTheDocument();
    expect(screen.getByText(/語尾の長さ/)).toBeInTheDocument();
  });
});
