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
      return `Game Over. Final score: ${lastScore}. Press START to play again.`;
    return '';
  })();

  const dpadActive = 'bg-neutral-700/90';
  const btnActive = 'translate-y-px !shadow-none';

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
        <div className="mx-auto flex h-[320px] w-full items-center justify-center select-none p-4">
          
          <div 
              className="relative flex h-[180px] w-full max-w-2xl items-center justify-between rounded-lg bg-[#D1D1D1] p-2 shadow-[0_4px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_#EAEAEA,inset_0_-2px_1px_#A0A0A0]"
          >
            {/* Cord notch */}
            <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-20 h-3 bg-[#A0A0A0] rounded-b-sm shadow-[inset_0_1px_1px_rgba(0,0,0,0.2)]" />

            {/* Black Faceplate */}
            <div className="absolute inset-x-4 inset-y-5 rounded bg-black/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" />
            
            <div className="relative z-10 flex w-full h-full items-center justify-between px-6">
              
              {/* D-Pad */}
              <div className="relative grid h-[90px] w-[90px] place-items-center">
                {/* Circular depression */}
                <div className="absolute h-full w-full rounded-full bg-black/50 shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)]" />
                <div className="relative h-[86px] w-[86px]">
                  {/* Plus Shape */}
                  <div className={cn("absolute h-full w-[28px] left-1/2 -translate-x-1/2 rounded-[3px] bg-[#4a4a4a] shadow-[0_1px_1px_#666,inset_0_0_2px_#222]", activeButton === 'UP' && dpadActive, activeButton === 'DOWN' && dpadActive )} />
                  <div className={cn("absolute w-full h-[28px] top-1/2 -translate-y-1/2 rounded-[3px] bg-[#4a4a4a] shadow-[0_1px_1px_#666,inset_0_0_2px_#222]", activeButton === 'LEFT' && dpadActive, activeButton === 'RIGHT' && dpadActive )} />
                  
                  {/* Center Circle */}
                  <div className="absolute grid place-items-center h-6 w-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="h-[18px] w-[18px] rounded-full bg-black/40 shadow-[inset_0_1px_2px_black]"/>
                  </div>

                  {/* Interactive Buttons */}
                  <button type="button" onClick={() => handlePress('UP')} className="absolute h-8 w-8 top-0 left-1/2 -translate-x-1/2" />
                  <button type="button" onClick={() => handlePress('DOWN')} className="absolute h-8 w-8 bottom-0 left-1/2 -translate-x-1/2" />
                  <button type="button" onClick={() => handlePress('LEFT')} className="absolute h-8 w-8 left-0 top-1/2 -translate-y-1/2" />
                  <button type="button" onClick={() => handlePress('RIGHT')} className="absolute h-8 w-8 right-0 top-1/2 -translate-y-1/2" />
                </div>
              </div>


              {/* Middle: Logo, Start/Select */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center text-[#d81e27]">
                  <p className="font-bold text-4xl italic tracking-tight">HobbyDork</p>
                  <div className="mt-3 flex gap-5">
                      <div className="flex flex-col items-center gap-1.5">
                          <button type="button" className="h-5 w-14 rounded-[4px] bg-[#333] shadow-[0_1px_1px_rgba(255,255,255,0.2)]" />
                          <p className="text-sm font-bold uppercase tracking-wider">SELECT</p>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                          <button type="button" onClick={() => { if(status === 'idle' || status === 'failed') { setActiveButton('START'); startGame(); } }} className={cn(`h-5 w-14 rounded-[4px] bg-[#333] shadow-[0_1px_1px_rgba(255,255,255,0.2)] transition-all`, activeButton === 'START' && 'bg-emerald-500')} />
                          <p className="text-sm font-bold uppercase tracking-wider">START</p>
                      </div>
                  </div>
              </div>

              {/* A / B buttons */}
              <div className="relative grid h-[100px] w-[160px] place-items-center">
                {/* Angled depression */}
                <div className="absolute h-[80px] w-full rounded-full bg-black/50 shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)] transform -rotate-[25deg]" />
                
                <div className="relative w-full h-[88px] flex items-center justify-between transform -rotate-[25deg] pl-2 pr-1">
                    <div className="flex flex-col items-center gap-2">
                        <button type="button" onClick={() => handlePress('B')} className={cn(`flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#d81e27] shadow-[inset_0_-4px_rgba(0,0,0,0.3),0_2px_3px_rgba(0,0,0,0.4)] transition-transform duration-75`, activeButton === 'B' && btnActive)} />
                        <p className="text-base font-bold uppercase text-red-700/80 tracking-widest">B</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <button type="button" onClick={() => handlePress('A')} className={cn(`flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#d81e27] shadow-[inset_0_-4px_rgba(0,0,0,0.3),0_2px_3px_rgba(0,0,0,0.4)] transition-transform duration-75`, activeButton === 'A' && btnActive)} />
                        <p className="text-base font-bold uppercase text-red-700/80 tracking-widest">A</p>
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
