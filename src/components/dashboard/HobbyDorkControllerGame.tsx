
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
  
  const dpadBase = "absolute bg-neutral-800 transition-all duration-100 flex items-center justify-center text-black/40 text-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_inset_0_-1px_1px_rgba(0,0,0,0.5)]";
  const dpadActive = "bg-emerald-500 !shadow-[inset_0_2px_3px_rgba(0,0,0,0.5)] translate-y-px";

  const faceBtnBase = "flex h-12 w-12 items-center justify-center rounded-full bg-[#C0242E] font-bold text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_0_3px_4px_rgba(0,0,0,0.4)] transition-transform duration-75 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)]";
  const faceBtnActive = "bg-emerald-500 !shadow-[inset_0_3px_3px_rgba(0,0,0,0.5)] scale-95";

  const startBtnBase = "h-5 w-14 rounded-md bg-neutral-600 shadow-[0_2px_2px_rgba(0,0,0,0.4)] transition-all active:translate-y-px active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]";
  const startBtnActive = "bg-emerald-500 !shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] translate-y-px";


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
        <div className="mx-auto flex h-[240px] max-w-2xl items-center justify-center">
        <div className="relative flex h-[220px] w-full max-w-xl items-center justify-between rounded-[10px] bg-gradient-to-b from-[#d1d1d1] to-[#b3b3b3] p-6 shadow-[0_10px_20px_rgba(0,0,0,0.6),_inset_0_0_8px_rgba(255,255,255,0.4)] ring-1 ring-black/30">
            
            {/* Recessed black area */}
            <div className="absolute left-1/4 top-[20%] h-[60%] w-1/2 rounded-md bg-black shadow-[inset_0_4px_8px_rgba(0,0,0,0.7)]" />
            
            <div className="relative z-10 flex w-full items-center justify-between">
              
              {/* D-Pad */}
              <div className="relative h-24 w-24">
                <div className="absolute left-0 top-0 h-full w-full rounded-md bg-black/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
                <div className={`${dpadBase} left-1/2 top-0 h-8 w-8 -translate-x-1/2 rounded-t-sm ${activeButton === 'UP' ? dpadActive : ''}`} onClick={() => handlePress('UP')}></div>
                <div className={`${dpadBase} bottom-0 left-1/2 h-8 w-8 -translate-x-1/2 rounded-b-sm ${activeButton === 'DOWN' ? dpadActive : ''}`} onClick={() => handlePress('DOWN')}></div>
                <div className={`${dpadBase} left-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-l-sm ${activeButton === 'LEFT' ? dpadActive : ''}`} onClick={() => handlePress('LEFT')}></div>
                <div className={`${dpadBase} right-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-r-sm ${activeButton === 'RIGHT' ? dpadActive : ''}`} onClick={() => handlePress('RIGHT')}></div>
                <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 bg-neutral-800" />
                <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 shadow-[inset_0_1px_2px_black]" />
              </div>

              {/* Middle: START/SELECT */}
              <div className="flex flex-col items-center gap-4">
                <div className="font-nintendo text-2xl font-black italic text-red-700/80 drop-shadow-sm">
                  HobbyDork
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`${startBtnBase}`} />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Select</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button type="button" onClick={() => { if(status === 'idle' || status === 'failed') startGame() }} className={`${startBtnBase} ${activeButton === 'START' ? startBtnActive : ''}`} />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Start</p>
                  </div>
                </div>
              </div>

              {/* A / B buttons */}
              <div className="relative h-24 w-40">
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 transform -rotate-[25deg] space-y-5">
                    <div className="flex flex-col items-center">
                        <button type="button" onClick={() => handlePress('B')} className={`${faceBtnBase} ${activeButton === 'B' ? faceBtnActive : ''}`} />
                        <p className="mt-1 text-base font-bold uppercase text-neutral-600">B</p>
                    </div>
                 </div>
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 transform -rotate-[25deg] space-y-5">
                     <div className="flex flex-col items-center">
                        <button type="button" onClick={() => handlePress('A')} className={`${faceBtnBase} ${activeButton === 'A' ? faceBtnActive : ''}`} />
                        <p className="mt-1 text-base font-bold uppercase text-neutral-600">A</p>
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
              disabled={status === 'showing' || status === 'input'}
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
