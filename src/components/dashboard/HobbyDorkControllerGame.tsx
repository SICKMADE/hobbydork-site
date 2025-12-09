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
import { cn } from '@/lib/utils';

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
          setTimeout(step, 250);
        } else {
          setInputIndex(0);
          setStatus('input');
        }
      }, 500);
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

  const dpadActive = 'bg-neutral-600';
  const btnActive = '!bg-red-800 translate-y-px shadow-none';

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
        <div className="mx-auto flex h-[280px] max-w-3xl items-center justify-center select-none p-4">
          {/* Main Gray Body */}
          <div className="relative flex h-[240px] w-full max-w-3xl items-center justify-between rounded-lg bg-[#D1D1D1] p-3 shadow-[0_6px_12px_rgba(0,0,0,0.4),inset_0_2px_1px_#EAEAEA,inset_0_-2px_1px_#A0A0A0]">
            {/* Top notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-[#C1C1C1] rounded-b-sm shadow-[inset_0_-1px_1px_rgba(0,0,0,0.1)]"/>

            {/* Black Faceplate */}
            <div className="absolute inset-x-4 inset-y-5 rounded-md bg-black shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)]" />
            
            <div className="relative z-10 flex w-full items-center justify-between px-6">
              
              {/* D-Pad */}
              <div className="relative h-[112px] w-[112px] grid place-items-center">
                  {/* Circular Depression */}
                  <div className="absolute h-full w-full bg-black rounded-[50%] shadow-[inset_0_5px_8px_rgba(0,0,0,0.5)]" />
                  
                  {/* Plus Shape */}
                  <div className="relative h-[100px] w-[100px]">
                      <div className="absolute h-full w-[34px] left-1/2 -translate-x-1/2 rounded-sm bg-[#4A4A4A] shadow-[inset_0_0_2px_#222]" />
                      <div className="absolute w-full h-[34px] top-1/2 -translate-y-1/2 rounded-sm bg-[#4A4A4A] shadow-[inset_0_0_2px_#222]" />

                      {/* Bevels */}
                      <div className="absolute h-full w-[34px] left-1/2 -translate-x-1/2 rounded-sm border-t border-b border-[#666] border-t-transparent"/>
                      <div className="absolute w-full h-[34px] top-1/2 -translate-y-1/2 rounded-sm border-l border-r border-[#666] border-l-transparent"/>
                      
                      {/* Interactive Buttons */}
                      <button type="button" onClick={() => handlePress('UP')} className={cn(`absolute h-8 w-8 top-0 left-1/2 -translate-x-1/2`, activeButton === 'UP' && dpadActive)} />
                      <button type="button" onClick={() => handlePress('DOWN')} className={cn(`absolute h-8 w-8 bottom-0 left-1/2 -translate-x-1/2`, activeButton === 'DOWN' && dpadActive)} />
                      <button type="button" onClick={() => handlePress('LEFT')} className={cn(`absolute h-8 w-8 left-0 top-1/2 -translate-y-1/2`, activeButton === 'LEFT' && dpadActive)} />
                      <button type="button" onClick={() => handlePress('RIGHT')} className={cn(`absolute h-8 w-8 right-0 top-1/2 -translate-y-1/2`, activeButton === 'RIGHT' && dpadActive)} />
                      
                      {/* Center circle */}
                      <div className="absolute grid place-items-center h-8 w-8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="h-6 w-6 rounded-full bg-black/50 shadow-[inset_0_1px_1px_black]"/>
                      </div>
                  </div>
              </div>


              {/* Middle: Logo, Start/Select */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center gap-4 text-[#D81E27]">
                <div className="font-nintendo text-3xl font-black italic text-[#9F1D21] drop-shadow-[1px_1px_0px_#222]">
                  HobbyDork
                </div>
                <div className="flex w-full items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <button type="button" className="h-4 w-12 rounded-full bg-[#333] shadow-[0_2px_2px_rgba(0,0,0,0.4)] transition-all active:translate-y-px active:shadow-none" />
                    <p className="text-xs font-bold uppercase tracking-wider">Select</p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <button type="button" onClick={() => { if(status === 'idle' || status === 'failed') { setActiveButton('START'); handlePress('START'); startGame(); } }} className={cn(`h-4 w-12 rounded-full bg-[#333] shadow-[0_2px_2px_rgba(0,0,0,0.4)] transition-all active:translate-y-px active:shadow-none`, activeButton === 'START' && '!bg-emerald-500 shadow-none translate-y-px')} />
                    <p className="text-xs font-bold uppercase tracking-wider">Start</p>
                  </div>
                </div>
              </div>

              {/* A / B buttons */}
              <div className="relative h-[112px] w-[180px] grid place-items-center">
                  <div className="relative w-[160px] h-[70px] flex items-center justify-between transform -rotate-[25deg]">
                        <div className="flex flex-col items-center gap-1">
                             <button type="button" onClick={() => handlePress('B')} className={cn(`flex h-16 w-16 items-center justify-center rounded-full bg-red-700 font-bold text-white shadow-[inset_0_-5px_0_#601418,0_3px_4px_rgba(0,0,0,0.4)] transition-transform duration-75`, activeButton === 'B' && btnActive)} />
                            <p className="text-sm font-bold uppercase text-red-700/80 tracking-widest">B</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <button type="button" onClick={() => handlePress('A')} className={cn(`flex h-16 w-16 items-center justify-center rounded-full bg-red-700 font-bold text-white shadow-[inset_0_-5px_0_#601418,0_3px_4px_rgba(0,0,0,0.4)] transition-transform duration-75`, activeButton === 'A' && btnActive)} />
                            <p className="text-sm font-bold uppercase text-red-700/80 tracking-widest">A</p>
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
