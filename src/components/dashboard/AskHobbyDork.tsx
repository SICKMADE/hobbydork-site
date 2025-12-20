'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const BUY_ANSWERS = [
  'Yeah, you should buy it.',
  'Looks good. Pull the trigger.',
  'If you really want it, grab it.',
  'This one belongs in your collection.',
  'Only buy it if you love it.',
  'It’s fine, but you don’t need it.',
  'Pass. This one is not worth it.',
  'Condition and price don’t line up. Skip it.',
  'Wait for a cleaner copy.',
  'Hold off. A better deal will show up.',
];

const SELL_ANSWERS = [
  'Yeah, you should sell it.',
  'Move it and upgrade later.',
  'Dump it. You won’t miss it.',
  'Sell it and chase something you actually want.',
  'Easy to replace? Then list it.',
  'Keep it. You’re not done with this one.',
  'Hold it a bit longer.',
  'If you still like it, don’t sell it.',
  'This belongs in your collection, not on a sales table.',
  'Sell something you care about less.',
];

function getRandomAnswer(kind: 'BUY' | 'SELL') {
  const pool = kind === 'BUY' ? BUY_ANSWERS : SELL_ANSWERS;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

type Screen = 'intro' | 'choose' | 'answer';

export default function AskHobbyDork() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [answer, setAnswer] = useState<string | null>(null);
  const [choice, setChoice] = useState<'BUY' | 'SELL' | null>(null);
  const [reveal, setReveal] = useState(false);

  // Start the game
  const handleStart = () => {
    setScreen('choose');
    setAnswer(null);
    setChoice(null);
    setReveal(false);
  };

  // Handle a choice
  const handleChoose = (kind: 'BUY' | 'SELL') => {
    setChoice(kind);
    setScreen('answer');
    setReveal(false);
    setTimeout(() => {
      setAnswer(getRandomAnswer(kind));
      setReveal(true);
    }, 600);
  };

  // Reset to intro
  const handleReset = () => {
    setScreen('intro');
    setAnswer(null);
    setChoice(null);
    setReveal(false);
  };

  return (
    <Card className="border-none bg-card p-4 sm:p-6 rounded-lg text-white">
      <CardContent className="p-0">
        <div className="flex items-center justify-center">
          <div className="relative rounded-lg bg-[#0b1220] border-4 border-[#111827] shadow-2xl w-56 h-auto sm:w-72">
            {/* Top label / speaker area */}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-inner" />
                <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-inner" />
                <div className="w-3 h-3 bg-green-400 rounded-full shadow-inner" />
              </div>
              <div className="text-xs font-mono text-yellow-300 uppercase tracking-wide drop-shadow-[0_2px_0_rgba(0,0,0,0.9)]">ASK HOBBYDORK</div>
              <div className="w-8 h-4 bg-neutral-900 rounded-sm" />
            </div>

            {/* Screen area */}
            <div className="mx-3 mb-3 rounded-sm bg-[#071428] border-2 border-[#0f1a2a] overflow-hidden">
              <div className="relative w-full h-56 sm:h-72 lg:h-80 flex flex-col items-center justify-center px-4 py-3">
                {/* CRT scanlines */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(transparent 50%, rgba(255,255,255,0.02) 51%)',
                  backgroundSize: '100% 4px',
                  mixBlendMode: 'overlay'
                }} />

                {/* INTRO SCREEN */}
                {screen === 'intro' && (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-6 animate-fade-in">
                    <div className="text-2xl sm:text-3xl font-extrabold uppercase text-yellow-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.9)] font-mono tracking-widest mb-2">Ask HobbyDork</div>
                    <button
                      className="mt-4 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white text-lg font-bold rounded shadow-lg border-2 border-pink-900 font-mono tracking-wider animate-pulse"
                      onClick={handleStart}
                    >
                      Touch to Start
                    </button>
                  </div>
                )}

                {/* CHOOSE SCREEN */}
                {screen === 'choose' && (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-6 animate-fade-in">
                    <div className="text-xl sm:text-2xl font-extrabold uppercase text-cyan-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.9)] font-mono tracking-widest mb-2">Choose Your Question</div>
                    <button
                      className="w-full mb-2 px-6 py-3 bg-red-700 hover:bg-red-800 text-white text-lg font-extrabold rounded shadow-lg border-2 border-black font-mono tracking-wider"
                      onClick={() => handleChoose('BUY')}
                    >
                      Should I buy this?
                    </button>
                    <button
                      className="w-full mb-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-lg font-extrabold rounded shadow-lg border-2 border-black font-mono tracking-wider"
                      onClick={() => handleChoose('SELL')}
                    >
                      Should I sell this?
                    </button>
                    <div className="text-base font-bold text-slate-200 mt-2 font-mono">choose 1</div>
                  </div>
                )}

                {/* ANSWER SCREEN */}
                {screen === 'answer' && (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-6 animate-fade-in">
                    <div className="text-xl sm:text-2xl font-extrabold uppercase text-purple-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.9)] font-mono tracking-widest mb-2">The Dork Says…</div>
                    <div className={cn('w-full rounded-md border-2 border-purple-900 bg-gradient-to-r from-purple-700 to-purple-600 px-4 py-6 text-center text-white shadow-lg font-mono text-lg sm:text-xl font-extrabold tracking-wider', !reveal && 'blur-md opacity-60 scale-105 animate-pulse')}> 
                      {reveal ? answer : '…'}
                    </div>
                    <button
                      className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white text-base font-bold rounded shadow border-2 border-slate-900 font-mono tracking-wider"
                      onClick={handleReset}
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Feet / knobs */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="w-8 h-3 bg-neutral-800 rounded-sm" />
              <div className="w-8 h-3 bg-neutral-800 rounded-sm" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
