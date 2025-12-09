
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
          setTimeout(step, 180);
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
    setTimeout(() => setActiveButton(null), 140);

    if (key !== expected) {
      setStatus('failed');
      setLastScore(round > 0 ? round - 1 : 0);
      return;
    }

    if (inputIndex + 1 === sequence.length) {
      const nextSeq = [...sequence, randomButton()];
      setSequence(nextSeq);
      setRound((r) => r + 1);

      setTimeout(() => {
        playSequence(nextSeq);
      }, 500);
    } else {
      setInputIndex((i) => i + 1);
    }
  };

  const statusLabel = (() => {
    if (status === 'idle') return 'Press START to begin a new pattern.';
    if (status === 'showing') return 'Watch the pattern on the controller…';
    if (status === 'input') return 'Now copy the pattern exactly.';
    if (status === 'failed')
      return `You messed up on round ${round}. Your score was ${lastScore}. Hit START to try again.`;
    return '';
  })();

  const dpadBase =
    'absolute bg-[#2a2a2a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_2px_2px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center text-zinc-400';
  const dpadActive = 'bg-emerald-500 shadow-inner translate-y-[1px]';

  const faceBtnBase =
    'flex h-11 w-11 items-center justify-center rounded-full bg-[#d3262f] font-bold text-black/70 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.4),_0_2px_2px_rgba(0,0,0,0.3)] transition-all active:translate-y-[1px] active:shadow-inner';
  const faceBtnActive =
    'bg-emerald-400 !shadow-inner ring-2 ring-emerald-300';
  
  const startBtnBase =
    'h-6 w-16 rounded-full bg-[#2a2a2a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_2px_2px_rgba(0,0,0,0.5)] transition-all active:translate-y-px active:shadow-inner';
  const startBtnActive = 'bg-emerald-500 !shadow-inner';

  return (
    <Card className="rounded-2xl border bg-gradient-to-br from-[#2b2b2e] via-[#1b1b1d] to-black shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gamepad2 className="h-4 w-4 text-emerald-400" />
              HobbyDork Controller
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              NES-style memory game. Watch the pattern (↑ ↓ ← → A B START),
              then copy it. Each round adds one more move.
            </CardDescription>
          </div>
          <div className="text-right text-[10px] sm:text-[11px] text-muted-foreground">
            <div>Round: {round || '—'}</div>
            <div>Best: {lastScore || '—'}</div>
            <div>Length: {sequence.length || 0}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <p className="text-xs text-muted-foreground">{statusLabel}</p>

        {/* Controller body */}
        <div className="mx-auto flex max-w-2xl justify-center">
          <div className="relative flex h-[180px] w-full max-w-lg items-center justify-between rounded-[20px] bg-[#b4b1ad] px-6 py-4 shadow-[0_15px_40px_rgba(0,0,0,0.65)] ring-1 ring-black/40">
            {/* Black stripe area */}
            <div className="absolute left-1/4 top-1/2 h-[60%] w-1/2 -translate-y-1/2 bg-black/90 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(255,255,255,0.05)]" />
            
            {/* Main controller layout */}
            <div className="relative z-10 flex w-full items-center justify-between">
              {/* LEFT: D-PAD */}
              <div className="flex h-[120px] w-[120px] items-center justify-center">
                <div className="relative h-full w-full">
                  <div className="absolute left-1/2 top-1/2 h-[88px] w-[28px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-[#3f3f3f] shadow-lg" />
                  <div className="absolute left-1/2 top-1/2 h-[28px] w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-[#3f3f3f] shadow-lg" />

                  <button type="button" onClick={() => handlePress('UP')} className={`${dpadBase} left-1/2 top-0 h-[28px] w-[28px] -translate-x-1/2 rounded-t-md rounded-b-sm ${activeButton === 'UP' ? dpadActive : ''}`}>↑</button>
                  <button type="button" onClick={() => handlePress('DOWN')} className={`${dpadBase} bottom-0 left-1/2 h-[28px] w-[28px] -translate-x-1/2 rounded-b-md rounded-t-sm ${activeButton === 'DOWN' ? dpadActive : ''}`}>↓</button>
                  <button type="button" onClick={() => handlePress('LEFT')} className={`${dpadBase} left-0 top-1/2 h-[28px] w-[28px] -translate-y-1/2 rounded-l-md rounded-r-sm ${activeButton === 'LEFT' ? dpadActive : ''}`}>←</button>
                  <button type="button" onClick={() => handlePress('RIGHT')} className={`${dpadBase} right-0 top-1/2 h-[28px] w-[28px] -translate-y-1/2 rounded-r-md rounded-l-sm ${activeButton === 'RIGHT' ? dpadActive : ''}`}>→</button>
                </div>
              </div>

              {/* MIDDLE: START/SELECT */}
              <div className="flex flex-col items-center gap-4">
                <div className="font-nintendo text-lg font-black italic text-red-700/80">
                  HobbyDork
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`${startBtnBase}`} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-red-700">Select</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button type="button" onClick={() => handlePress('START')} className={`${startBtnBase} ${activeButton === 'START' ? startBtnActive : ''}`} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-red-700">Start</p>
                  </div>
                </div>
              </div>

              {/* RIGHT: A / B buttons */}
              <div className="flex h-[120px] w-[120px] items-center justify-center">
                 <div className="relative h-[60px] w-full -rotate-[25deg]">
                    <div className="absolute left-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
                        <button type="button" onClick={() => handlePress('B')} className={`${faceBtnBase} ${activeButton === 'B' ? faceBtnActive : ''}`} />
                        <p className="mt-2 rotate-[25deg] text-base font-bold uppercase text-red-700">B</p>
                    </div>
                     <div className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
                        <button type="button" onClick={() => handlePress('A')} className={`${faceBtnBase} ${activeButton === 'A' ? faceBtnActive : ''}`} />
                        <p className="mt-2 rotate-[25deg] text-base font-bold uppercase text-red-700">A</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls + info */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={startGame}
              disabled={status === 'showing'}
            >
              START
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
            Watch → Copy → Survive as many rounds as you can.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
