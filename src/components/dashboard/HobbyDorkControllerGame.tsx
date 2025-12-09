'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

type ButtonKey = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'START';

const ALL_BUTTONS: ButtonKey[] = [
  'UP',
  'DOWN',
  'LEFT',
  'RIGHT',
  'A',
  'B',
  'START',
];

function randomButton(): ButtonKey {
  return ALL_BUTTONS[Math.floor(Math.random() * ALL_BUTTONS.length)];
}

export default function HobbyDorkControllerGame() {
  const [sequence, setSequence] = useState<ButtonKey[]>([]);
  const [round, setRound] = useState(0);
  const [inputIndex, setInputIndex] = useState(0);
  const [activeButton, setActiveButton] = useState<ButtonKey | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'showing' | 'input' | 'failed'
  >('idle');
  const [lastScore, setLastScore] = useState(0);

  const playSequence = useCallback((seq: ButtonKey[]) => {
    setStatus('showing');
    let i = 0;

    const step = () => {
      const key = seq[i];
      setActiveButton(key);

      setTimeout(() => {
        setActiveButton(null);
        i += 1;

        if (i < seq.length) {
          setTimeout(step, 160);
        } else {
          setInputIndex(0);
          setStatus('input');
        }
      }, 450);
    };

    setTimeout(step, 200);
  }, []);

  const startGame = () => {
    const first = randomButton();
    const seq = [first];
    setSequence(seq);
    setRound(1);
    setLastScore(0);
    setStatus('showing');
    playSequence(seq);
  };

  const resetGame = () => {
    setSequence([]);
    setRound(0);
    setInputIndex(0);
    setActiveButton(null);
    setStatus('idle');
  };

  const handlePress = (key: ButtonKey) => {
    if (status !== 'input') return;

    const expected = sequence[inputIndex];

    setActiveButton(key);
    setTimeout(() => setActiveButton(null), 120);

    if (key !== expected) {
      setStatus('failed');
      setLastScore(round);
      return;
    }

    // correct so far
    if (inputIndex + 1 === sequence.length) {
      // round complete, add new step
      const nextSeq = [...sequence, randomButton()];
      setSequence(nextSeq);
      setRound((r) => r + 1);

      setTimeout(() => {
        playSequence(nextSeq);
      }, 450);
    } else {
      setInputIndex((i) => i + 1);
    }
  };

  const statusLabel = (() => {
    if (status === 'idle') return 'Press Start to play.';
    if (status === 'showing') return 'Watch the pattern…';
    if (status === 'input') return 'Copy the pattern exactly.';
    if (status === 'failed')
      return `You messed up on round ${round}. Press Start to try again.`;
    return '';
  })();

  return (
    <Card className="rounded-2xl border bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gamepad2 className="h-4 w-4 text-emerald-400" />
              HobbyDork Controller
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Watch the NES-style pattern (↑ ↓ ← → A B START), then
              copy it. Each round adds one more move until you screw up.
            </CardDescription>
          </div>
          <div className="text-right text-[11px] sm:text-xs text-muted-foreground">
            <div>Round: {round || '—'}</div>
            <div>Best: {lastScore || '—'}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">{statusLabel}</p>

        {/* Controller shell */}
        <div className="mx-auto max-w-md rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-3 shadow-inner">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* D-pad */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handlePress('UP')}
                  className={
                    'h-8 w-8 rounded-sm border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-100 shadow ' +
                    (activeButton === 'UP'
                      ? 'border-emerald-400 bg-emerald-600/70'
                      : '')
                  }
                >
                  ↑
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePress('LEFT')}
                  className={
                    'h-8 w-8 rounded-sm border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-100 shadow ' +
                    (activeButton === 'LEFT'
                      ? 'border-emerald-400 bg-emerald-600/70'
                      : '')
                  }
                >
                  ←
                </button>
                <div className="h-6 w-6 rounded bg-zinc-900/80 border border-zinc-800" />
                <button
                  type="button"
                  onClick={() => handlePress('RIGHT')}
                  className={
                    'h-8 w-8 rounded-sm border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-100 shadow ' +
                    (activeButton === 'RIGHT'
                      ? 'border-emerald-400 bg-emerald-600/70'
                      : '')
                  }
                >
                  →
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handlePress('DOWN')}
                  className={
                    'h-8 w-8 rounded-sm border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-100 shadow ' +
                    (activeButton === 'DOWN'
                      ? 'border-emerald-400 bg-emerald-600/70'
                      : '')
                  }
                >
                  ↓
                </button>
              </div>
            </div>

            {/* A / B buttons */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePress('B')}
                  className={
                    'flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-red-700 text-xs font-bold text-zinc-100 shadow-md ' +
                    (activeButton === 'B'
                      ? 'border-emerald-400 ring-2 ring-emerald-400/60'
                      : '')
                  }
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => handlePress('A')}
                  className={
                    'flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-red-600 text-xs font-bold text-zinc-100 shadow-md ' +
                    (activeButton === 'A'
                      ? 'border-emerald-400 ring-2 ring-emerald-400/60'
                      : '')
                  }
                >
                  A
                </button>
              </div>
            </div>
          </div>

          {/* Start bar */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handlePress('START')}
              className={
                'h-6 rounded-full border border-zinc-700 bg-zinc-800 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-100 shadow ' +
                (activeButton === 'START'
                  ? 'border-emerald-400 bg-emerald-600/70'
                  : '')
              }
            >
              START
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={startGame}
              disabled={status === 'showing'}
            >
              Start
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={resetGame}
            >
              Reset
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Pattern length: {sequence.length || 0}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
