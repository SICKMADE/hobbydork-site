
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
  
  const faceBtnActive =
    'border-emerald-400 shadow-[inset_0_3px_6px_rgba(0,255,150,0.4),0_1px_2px_rgba(0,0,0,0.6)] ring-2 ring-emerald-400/80 bg-emerald-600 translate-y-0.5';

  const dPadActive = 'bg-emerald-500/90 shadow-[inset_0_1px_2px_rgba(0,255,150,0.5)]';

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
            <div className="relative h-full w-full rounded-[12px] bg-gradient-to-b from-neutral-300 to-neutral-200 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)] ring-1 ring-black/50">
                {/* Black faceplate */}
                <div className="relative h-full w-full rounded-[6px] bg-gradient-to-b from-[#3f3d40] via-[#111] to-[#18181a] px-8 py-4 flex items-center justify-between gap-6">
                    
                    {/* LEFT: D-PAD */}
                    <div className="flex-shrink-0">
                        <div className="relative h-[110px] w-[110px] flex items-center justify-center">
                            {/* Circular depression */}
                            <div className="absolute h-full w-full rounded-full bg-black/30 shadow-inner" />
                            
                            {/* D-Pad cross */}
                            <div className="absolute h-full w-full flex items-center justify-center">
                               <div className="absolute h-[calc(100%-12px)] w-[36px] bg-neutral-700 rounded-[3px] shadow-md border-t border-neutral-800 border-b border-neutral-900" />
                               <div className="absolute w-[calc(100%-12px)] h-[36px] bg-neutral-700 rounded-[3px] shadow-md border-l border-neutral-800 border-r border-neutral-900" />
                               <div className="absolute h-[calc(100%-12px)] w-[36px] bg-gradient-to-b from-neutral-600 to-neutral-800 rounded-[3px]" />
                               <div className="absolute w-[calc(100%-12px)] h-[36px] bg-gradient-to-r from-neutral-600 to-neutral-800 rounded-[3px]" />
                            </div>
                            
                            {/* Central circle for realism */}
                            <div className="absolute h-5 w-5 rounded-full bg-black/40 shadow-inner border border-black/80" />

                            {/* Clickable zones */}
                            <button type="button" onClick={() => handlePress('UP')} className={`absolute top-0 h-[42px] w-[36px] flex items-center justify-center pt-1 rounded-t-[3px] transition-colors ${activeButton === 'UP' ? dPadActive : ''}`}><span className="w-0 h-0 border-x-4 border-x-transparent border-b-[6px] border-b-black/40"></span></button>
                            <button type="button" onClick={() => handlePress('DOWN')} className={`absolute bottom-0 h-[42px] w-[36px] flex items-center justify-center pb-1 rounded-b-[3px] transition-colors ${activeButton === 'DOWN' ? dPadActive : ''}`}><span className="w-0 h-0 border-x-4 border-x-transparent border-t-[6px] border-t-black/40"></span></button>
                            <button type="button" onClick={() => handlePress('LEFT')} className={`absolute left-0 w-[42px] h-[36px] flex items-center justify-center pl-1 rounded-l-[3px] transition-colors ${activeButton === 'LEFT' ? dPadActive : ''}`}><span className="w-0 h-0 border-y-4 border-y-transparent border-r-[6px] border-r-black/40"></span></button>
                            <button type="button" onClick={() => handlePress('RIGHT')} className={`absolute right-0 w-[42px] h-[36px] flex items-center justify-center pr-1 rounded-r-[3px] transition-colors ${activeButton === 'RIGHT' ? dPadActive : ''}`}><span className="w-0 h-0 border-y-4 border-y-transparent border-l-[6px] border-l-black/40"></span></button>
                        </div>
                    </div>

                    {/* MIDDLE: SELECT / START & LOGO */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="text-center text-[20px] font-black tracking-[0.18em] text-[#c62429] uppercase">HobbyDork</div>
                        <div className="flex items-center justify-center gap-4">
                             <div className="flex flex-col items-center gap-1.5">
                                <button type="button" className={`h-4 w-12 rounded bg-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_inset_0_-1px_1px_rgba(0,0,0,0.5)] active:shadow-inner`}></button>
                                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8b1919]">Select</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5">
                                 <button type="button" onClick={() => handlePress('START')} className={`h-4 w-12 rounded bg-zinc-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_inset_0_-1px_1px_rgba(0,0,0,0.5)] active:shadow-inner transition-colors ${ activeButton === 'START' ? 'bg-emerald-700/95 shadow-inner' : '' }`}></button>
                                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8b1919]">Start</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* RIGHT: A / B buttons */}
                     <div className="flex-shrink-0">
                         <div className="relative w-[150px] h-[70px] flex items-center justify-center">
                             <div className="flex items-center gap-4">
                                <button type="button" onClick={() => handlePress('B')} className={`h-14 w-14 rounded-full bg-gradient-to-b from-[#c62429] to-[#8b1919] text-white text-lg font-bold border-b-4 border-black/50 shadow-[inset_0_2px_3px_rgba(255,255,255,0.2),_0_4px_6px_rgba(0,0,0,0.4)] active:translate-y-0.5 active:border-b-2 transition-all ${ activeButton === 'B' ? faceBtnActive : '' }`}>B</button>
                                <button type="button" onClick={() => handlePress('A')} className={`h-14 w-14 rounded-full bg-gradient-to-b from-[#c62429] to-[#8b1919] text-white text-lg font-bold border-b-4 border-black/50 shadow-[inset_0_2px_3px_rgba(255,255,255,0.2),_0_4px_6px_rgba(0,0,0,0.4)] active:translate-y-0.5 active:border-b-2 transition-all ${ activeButton === 'A' ? faceBtnActive : '' }`}>A</button>
                            </div>
                        </div>
                         <div className="flex w-full items-center justify-around px-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c62429]">
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
