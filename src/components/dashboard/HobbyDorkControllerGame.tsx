
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
          setTimeout(step, 250); // Slightly slower for clarity
        } else {
          setInputIndex(0);
          setStatus('input');
        }
      }, 500); // Hold light for longer
    };

    setTimeout(step, 300);
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
    setTimeout(() => setActiveButton(null), 150);

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
      }, 700);
    } else {
      setInputIndex((i) => i + 1);
    }
  };

  const statusLabel = (() => {
    if (status === 'idle') return 'Press START to begin the memory game.';
    if (status === 'showing') return 'Watch the pattern…';
    if (status === 'input') return `Round ${round}. Your turn!`;
    if (status === 'failed')
      return `Game Over. You reached round ${round}. Your final score is ${lastScore}. Press START to play again.`;
    return '';
  })();

  const dpadBase = "absolute grid place-items-center bg-[#2B2B2B] shadow-[inset_0_1px_1px_#444,inset_0_-1px_1px_#111] transition-all duration-100";
  const dpadActive = "brightness-150 bg-emerald-500";
  const faceBtnActive = "brightness-125 !bg-emerald-500 scale-[0.97] translate-y-px";

  return (
    <Card className="rounded-2xl border bg-gradient-to-br from-[#2b2b2e] via-[#1b1b1d] to-black shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gamepad2 className="h-4 w-4 text-emerald-400" />
              HobbyDork Controller
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              An NES-style memory game. Watch the pattern, then repeat it.
            </CardDescription>
          </div>
          <div className="text-right text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap">
            <div>Score: {round > 0 ? round - 1 : 0}</div>
            <div>Best: {lastScore || '—'}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        
        {/* Controller body */}
        <div className="mx-auto flex h-[240px] max-w-2xl items-center justify-center select-none">
          <div className="relative flex h-[200px] w-full max-w-xl items-center justify-between rounded-lg bg-[#D1D1D1] p-5 shadow-[0_6px_12px_rgba(0,0,0,0.4),inset_0_2px_1px_#EAEAEA,inset_0_-2px_1px_#A0A0A0]">
            
            {/* Recessed black area */}
            <div className="absolute left-[28%] top-[22%] h-[56%] w-[44%] rounded-md bg-black/90 shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)]" />

            <div className="relative z-10 flex w-full items-center justify-between">
              
              {/* D-Pad */}
              <div className="relative h-[84px] w-[84px] grid place-items-center">
                  <div className="absolute h-full w-full bg-[#444] rounded-[50%] shadow-[inset_0_4px_6px_rgba(0,0,0,0.4)]" />
                  <div className="relative h-[72px] w-[72px] ">
                      <button type="button" onClick={() => handlePress('UP')} className={`${dpadBase} h-8 w-6 top-[-4px] left-1/2 -translate-x-1/2 rounded-t-sm ${activeButton === 'UP' ? dpadActive : ''}`} />
                      <button type="button" onClick={() => handlePress('DOWN')} className={`${dpadBase} h-8 w-6 bottom-[-4px] left-1/2 -translate-x-1/2 rounded-b-sm ${activeButton === 'DOWN' ? dpadActive : ''}`} />
                      <button type="button" onClick={() => handlePress('LEFT')} className={`${dpadBase} h-6 w-8 left-[-4px] top-1/2 -translate-y-1/2 rounded-l-sm ${activeButton === 'LEFT' ? dpadActive : ''}`} />
                      <button type="button" onClick={() => handlePress('RIGHT')} className={`${dpadBase} h-6 w-8 right-[-4px] top-1/2 -translate-y-1/2 rounded-r-sm ${activeButton === 'RIGHT' ? dpadActive : ''}`} />
                      <div className="absolute grid place-items-center h-6 w-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2B2B2B]">
                          <div className="h-3 w-3 rounded-full bg-black/50 shadow-[inset_0_1px_1px_black]"/>
                      </div>
                  </div>
              </div>


              {/* Middle: START/SELECT */}
              <div className="flex flex-col items-center gap-3">
                <div className="font-nintendo text-3xl font-black italic text-[#9F1D21] drop-shadow-[1px_1px_0px_#222]">
                  HobbyDork
                </div>
                <div className="flex items-center gap-4">
                  {/* SELECT */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="h-4 w-10 rounded-[3px] bg-[#2B2B2B] shadow-[0_2px_2px_rgba(0,0,0,0.4)]" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#454545]">Select</p>
                  </div>
                   {/* START */}
                  <div className="flex flex-col items-center gap-1.5">
                    <button type="button" onClick={() => { if(status === 'idle' || status === 'failed') startGame() }} className={`h-4 w-10 rounded-[3px] bg-[#2B2B2B] shadow-[0_2px_2px_rgba(0,0,0,0.4)] transition-all active:translate-y-px active:shadow-none ${activeButton === 'START' ? '!bg-emerald-500 shadow-none translate-y-px' : ''}`} />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#454545]">Start</p>
                  </div>
                </div>
              </div>

              {/* A / B buttons */}
              <div className="relative h-[84px] w-[140px] grid place-items-center">
                  <div className="absolute h-full w-full bg-[#444] rounded-[42px] transform -rotate-[25deg] shadow-[inset_0_4px_6px_rgba(0,0,0,0.4)]" />
                  <div className="relative w-[130px] h-[50px] flex items-center justify-between transform -rotate-[25deg]">
                        <div className="flex flex-col items-center gap-1">
                            <button type="button" onClick={() => handlePress('B')} className={`flex h-11 w-11 items-center justify-center rounded-full bg-[#A02027] font-bold text-white shadow-[inset_0_-4px_0_#601418,0_2px_3px_rgba(0,0,0,0.4)] transition-transform duration-75 active:translate-y-px active:shadow-[inset_0_-2px_0_#601418] ${activeButton === 'B' ? faceBtnActive : ''}`} >
                                <span className="block -translate-y-px">B</span>
                            </button>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <button type="button" onClick={() => handlePress('A')} className={`flex h-11 w-11 items-center justify-center rounded-full bg-[#A02027] font-bold text-white shadow-[inset_0_-4px_0_#601418,0_2px_3px_rgba(0,0,0,0.4)] transition-transform duration-75 active:translate-y-px active:shadow-[inset_0_-2px_0_#601418] ${activeButton === 'A' ? faceBtnActive : ''}`} >
                                <span className="block -translate-y-px">A</span>
                            </button>
                        </div>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status text + controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs text-center sm:text-left text-muted-foreground flex-1 min-w-[200px]">{statusLabel}</p>
          <div className="flex gap-2 mx-auto sm:mx-0">
            <Button
              type="button"
              size="sm"
              onClick={startGame}
              disabled={status === 'showing' || status === 'input'}
            >
              START GAME
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

