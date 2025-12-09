
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

    setTimeout(step, 220);
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
      setLastScore(round -1);
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
    if (status === 'showing') return 'Watch the pattern light up on the pad…';
    if (status === 'input') return 'Now copy the pattern exactly.';
    if (status === 'failed')
      return `You messed up on round ${round}. Your score was ${lastScore}. Hit START to try again.`;
    return '';
  })();

  const dpadSquare =
    'absolute flex items-center justify-center bg-[#2d2d2d] text-[12px] font-semibold text-zinc-50 rounded-[3px] border-t border-t-zinc-500 border-l border-l-zinc-500 border-r border-r-black/80 border-b border-b-black/80 shadow-[inset_0_2px_1px_rgba(255,255,255,0.1)] transition-all';
  const dpadActive =
    'border-emerald-400 bg-emerald-600/90 shadow-inner translate-y-px';

  const faceBtnBase =
    'flex items-center justify-center rounded-full border-b-4 border-black/50 text-[11px] font-bold text-zinc-50 shadow-[inset_0_2px_3px_rgba(255,255,255,0.2),_0_2px_3px_rgba(0,0,0,0.4)] transition-transform active:translate-y-0.5 active:border-b-2';
  const faceBtnActive =
    'border-emerald-400 shadow-inner translate-y-px ring-2 ring-emerald-400/60';

  const startSelectBase =
    'h-7 w-24 rounded-lg border-2 border-zinc-900 bg-zinc-700/80 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_inset_0_-1px_1px_rgba(0,0,0,0.5)] transition-all active:shadow-inner active:translate-y-px';
 const startSelectActive =
    'border-emerald-400 bg-emerald-700/85 text-zinc-50 shadow-inner translate-y-px';

  return (
    <Card className="rounded-2xl border bg-gradient-to-br from-[#2b2b2e] via-[#1b1b1d] to-black shadow-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gamepad2 className="h-4 w-4 text-emerald-400" />
              HobbyDork Controller
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              NES-style memory game. Watch the pattern, then copy it. Each
              round adds one more move.
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
        <p className="h-4 text-xs text-muted-foreground">{statusLabel}</p>

        {/* WIDE CONTROLLER BODY */}
        <div className="mx-auto flex h-[280px] w-full max-w-[640px] items-center justify-center">
            <div className="relative h-full w-full rounded-[20px] bg-gradient-to-b from-neutral-300 to-neutral-200 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.7)] ring-1 ring-black/50">
                {/* Black faceplate */}
                <div className="relative h-full w-full rounded-[10px] bg-gradient-to-b from-[#3f3d40] via-[#111] to-[#18181a] px-8 py-4 flex items-center justify-between gap-8">
                    
                    {/* LEFT: D-PAD */}
                    <div className="flex-shrink-0">
                        <div className="relative h-28 w-28 rounded-[10px] bg-transparent flex items-center justify-center">
                            {/* Circular depression */}
                            <div className="absolute h-full w-full rounded-full bg-black/30 shadow-inner" />

                            {/* cross background */}
                            <div className="absolute h-[84px] w-[28px] rounded-[4px] bg-[#121214] shadow-md" />
                            <div className="absolute h-[28px] w-[84px] rounded-[4px] bg-[#121214] shadow-md" />

                            <button type="button" onClick={() => handlePress('UP')} className={`${dpadSquare} top-1 h-9 w-9 ${ activeButton === 'UP' ? dpadActive : '' }`}>↑</button>
                            <button type="button" onClick={() => handlePress('DOWN')} className={`${dpadSquare} bottom-1 h-9 w-9 ${ activeButton === 'DOWN' ? dpadActive : '' }`}>↓</button>
                            <button type="button" onClick={() => handlePress('LEFT')} className={`${dpadSquare} left-1 h-9 w-9 ${ activeButton === 'LEFT' ? dpadActive : '' }`}>←</button>
                            <button type="button" onClick={() => handlePress('RIGHT')} className={`${dpadSquare} right-1 h-9 w-9 ${ activeButton === 'RIGHT' ? dpadActive : '' }`}>→</button>
                        </div>
                    </div>

                    {/* MIDDLE: SELECT / START & LOGO */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="text-center text-[18px] font-black tracking-[0.18em] text-[#c62429] uppercase">HobbyDork</div>
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <button type="button" className={`${startSelectBase}`}>
                                </button>
                                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8b1919]">Select</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                 <button type="button" onClick={() => handlePress('START')} className={`${startSelectBase} ${ activeButton === 'START' ? startSelectActive : '' }`}>
                                </button>
                                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8b1919]">Start</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* RIGHT: A / B buttons */}
                    <div className="flex-shrink-0">
                         <div className="relative w-[180px] h-[80px] flex items-center justify-center -rotate-[25deg]">
                             <div className="flex items-center gap-6">
                                <button type="button" onClick={() => handlePress('B')} className={`${faceBtnBase} h-16 w-16 bg-[#b02026] ${ activeButton === 'B' ? faceBtnActive : '' }`}>B</button>
                                <button type="button" onClick={() => handlePress('A')} className={`${faceBtnBase} h-16 w-16 bg-[#b02026] ${ activeButton === 'A' ? faceBtnActive : '' }`}>A</button>
                            </div>
                        </div>
                         <div className="mt-2 flex w-full items-center justify-between px-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#c62429]">
                            <span>B</span>
                            <span>A</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>


        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
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
