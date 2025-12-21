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
          <div className="relative rounded-lg bg-black border-4 border-[#222] shadow-2xl w-[32rem] max-w-full h-auto flex flex-col justify-center items-center">
            {/* Top label / speaker area */}
            <div className="flex items-center justify-center px-3 py-2">
              <div className="text-3xl sm:text-4xl font-extrabold uppercase text-yellow-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.9)] font-mono tracking-widest select-none w-full text-center" style={{letterSpacing:'0.15em',textShadow:'0 0 8px #ffe066,0 2px 0 #000'}}>
                ASK HOBBYDORK
              </div>
            </div>

            {/* Screen area */}
            <div className="flex-1 w-full flex flex-col justify-center items-center">
              <div className="relative w-[95%] h-[26rem] max-w-full bg-black border-2 border-[#222] rounded-sm overflow-hidden flex flex-col items-center justify-center px-8 py-8">
                {/* CRT scanlines and glow */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,255,64,0.12),rgba(0,255,64,0.12) 1px,transparent 1px,transparent 4px)',
                  backgroundSize: '100% 4px',
                  boxShadow: '0 0 32px 8px #0f0a  inset, 0 0 0 4px #0f0a inset',
                  mixBlendMode: 'screen',
                  zIndex: 2
                }} />

                {/* INTRO SCREEN */}
                {screen === 'intro' && (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-8 animate-fade-in">
                    <div className="text-5xl sm:text-6xl font-extrabold uppercase text-[#00ff40] font-mono tracking-widest mb-2 select-none" style={{textShadow:'0 0 16px #00ff40,0 2px 0 #000'}}>PRESS START</div>
                    <button
                      className="mt-4 px-10 py-5 bg-black border-2 border-[#00ff40] text-[#00ff40] text-2xl font-extrabold rounded shadow-2xl font-mono tracking-widest animate-pulse select-none"
                      onClick={handleStart}
                      style={{boxShadow:'0 0 16px #00ff40'}}>
                      ▶
                    </button>
                  </div>
                )}

                {/* CHOOSE SCREEN */}
                {screen === 'choose' && (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-8 animate-fade-in">
                    <div className="text-3xl sm:text-4xl font-extrabold uppercase text-[#00ff40] font-mono tracking-widest mb-2 select-none" style={{textShadow:'0 0 12px #00ff40,0 2px 0 #000'}}>SELECT YOUR FATE</div>
                    <button
                      className="w-full mb-2 px-10 py-5 bg-black border-2 border-[#00ff40] text-[#00ff40] text-2xl font-extrabold rounded shadow-2xl font-mono tracking-widest select-none"
                      onClick={() => handleChoose('BUY')}
                      style={{boxShadow:'0 0 12px #00ff40'}}>
                      SHOULD I BUY THIS?
                    </button>
                    <button
                      className="w-full mb-2 px-10 py-5 bg-black border-2 border-[#00ff40] text-[#00ff40] text-2xl font-extrabold rounded shadow-2xl font-mono tracking-widest select-none"
                      onClick={() => handleChoose('SELL')}
                      style={{boxShadow:'0 0 12px #00ff40'}}>
                      SHOULD I SELL THIS?
                    </button>
                    <div className="text-xl font-bold text-[#00ff40] mt-2 font-mono select-none" style={{textShadow:'0 0 8px #00ff40'}}>CHOOSE 1</div>
                  </div>
                )}

                {/* ANSWER SCREEN */}
                {screen === 'answer' && (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-8 animate-fade-in">
                    <div className="text-4xl sm:text-5xl font-extrabold uppercase text-[#00ff40] font-mono tracking-widest mb-2 select-none" style={{textShadow:'0 0 16px #00ff40,0 2px 0 #000'}}>THE DORK SAYS…</div>
                    <div className={cn('w-full rounded-md border-4 border-[#00ff40] bg-black px-8 py-10 text-center text-[#00ff40] shadow-2xl font-mono text-2xl sm:text-3xl font-extrabold tracking-widest select-none', !reveal && 'blur-md opacity-60 scale-105 animate-pulse')} style={{textShadow:'0 0 12px #00ff40'}}>
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
