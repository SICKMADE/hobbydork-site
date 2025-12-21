'use client';

import { useState, useEffect } from 'react';
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

  // Auto-return to intro after answer
  useEffect(() => {
    if (screen === 'answer' && reveal) {
      const timeout = setTimeout(() => {
        setScreen('intro');
        setAnswer(null);
        setChoice(null);
        setReveal(false);
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [screen, reveal]);

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
          <div className="relative rounded-lg bg-[#0b1220] border-4 border-[#111827] shadow-2xl w-full h-full min-h-[28rem] min-w-[28rem] sm:min-h-[36rem] sm:min-w-[36rem] lg:min-h-[44rem] lg:min-w-[44rem] flex flex-col justify-center items-center">
            {/* Top label / speaker area */}
            <div className="flex items-center justify-center px-3 py-2">
              <div className="text-3xl sm:text-4xl font-extrabold uppercase text-yellow-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.9)] font-mono tracking-widest select-none w-full text-center" style={{letterSpacing:'0.15em',textShadow:'0 0 8px #ffe066,0 2px 0 #000'}}>
                ASK HOBBYDORK
              </div>
            </div>

            {/* Screen area */}
            <div className="flex-1 w-full flex flex-col justify-center items-center">
              <div className="relative w-[90%] h-[80%] min-h-[20rem] min-w-[20rem] bg-[#071428] border-2 border-[#0f1a2a] rounded-sm overflow-hidden flex flex-col items-center justify-center px-10 py-8">
                {/* CRT scanlines and glow */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.04),rgba(255,255,255,0.04) 1px,transparent 1px,transparent 4px)',
                  backgroundSize: '100% 4px',
                  boxShadow: '0 0 32px 8px #00f2ff44 inset, 0 0 0 4px #00f2ff22 inset',
                  mixBlendMode: 'screen',
                  zIndex: 2
                }} />

                {/* INTRO SCREEN */}
                {screen === 'intro' && (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-8 animate-fade-in">
                    <div className="text-5xl sm:text-6xl font-extrabold uppercase text-pink-400 drop-shadow-[0_2px_0_rgba(0,0,0,0.9)] font-mono tracking-widest mb-2 select-none" style={{textShadow:'0 0 16px #ff5ecb,0 2px 0 #000'}}>PRESS START</div>
                    <button
                      className="mt-4 px-10 py-5 bg-gradient-to-br from-yellow-400 via-pink-500 to-blue-500 hover:from-pink-500 hover:to-yellow-400 text-white text-2xl font-extrabold rounded shadow-2xl border-4 border-pink-900 font-mono tracking-widest animate-pulse select-none"
                      onClick={handleStart}
                    >
                      ▶
                    </button>
                  </div>
                )}

                {/* CHOOSE SCREEN */}
                {screen === 'choose' && (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-8 animate-fade-in">
                    <div className="text-3xl sm:text-4xl font-extrabold uppercase text-cyan-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.9)] font-mono tracking-widest mb-2 select-none" style={{textShadow:'0 0 12px #00f2ff,0 2px 0 #000'}}>SELECT YOUR FATE</div>
                    <button
                      className="w-full mb-2 px-10 py-5 bg-red-700 hover:bg-red-800 text-white text-2xl font-extrabold rounded shadow-2xl border-4 border-black font-mono tracking-widest select-none"
                      onClick={() => handleChoose('BUY')}
                    >
                      SHOULD I BUY THIS?
                    </button>
                    <button
                      className="w-full mb-2 px-10 py-5 bg-green-600 hover:bg-green-700 text-white text-2xl font-extrabold rounded shadow-2xl border-4 border-black font-mono tracking-widest select-none"
                      onClick={() => handleChoose('SELL')}
                    >
                      SHOULD I SELL THIS?
                    </button>
                    <div className="text-xl font-bold text-slate-200 mt-2 font-mono select-none" style={{textShadow:'0 0 8px #00f2ff'}}>CHOOSE 1</div>
                  </div>
                )}

                {/* ANSWER SCREEN */}
                {screen === 'answer' && (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-8 animate-fade-in">
                    <div className="text-4xl sm:text-5xl font-extrabold uppercase text-purple-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.9)] font-mono tracking-widest mb-2 select-none" style={{textShadow:'0 0 16px #a78bfa,0 2px 0 #000'}}>THE DORK SAYS…</div>
                    <div className={cn('w-full rounded-md border-4 border-purple-900 bg-gradient-to-r from-purple-700 to-purple-600 px-8 py-10 text-center text-white shadow-2xl font-mono text-2xl sm:text-3xl font-extrabold tracking-widest select-none', !reveal && 'blur-md opacity-60 scale-105 animate-pulse')} style={{textShadow:'0 0 12px #a78bfa'}}>
                      {reveal ? answer : '…'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feet / knobs */}
            <div className="flex items-center justify-between px-8 pb-5">
              <div className="w-16 h-5 bg-neutral-800 rounded-sm" />
              <div className="w-16 h-5 bg-neutral-800 rounded-sm" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
