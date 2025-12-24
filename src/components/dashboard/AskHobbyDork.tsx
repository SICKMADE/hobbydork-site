'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

type Mode = 'idle' | 'choice' | 'answer' | 'off';

const BUY_ANSWERS = [
  'BUY IT.',
  'PULL THE TRIGGER.',
  'YES. DO IT.',
  'THIS BELONGS IN YOUR COLLECTION.',
  'ONLY IF YOU LOVE IT.',
  'WAIT FOR A BETTER COPY.',
  'PASS.',
];

const SELL_ANSWERS = [
  'SELL IT.',
  'LET IT GO.',
  'TIME TO MOVE ON.',
  'UPGRADE LATER.',
  'KEEP IT.',
  'HOLD A LITTLE LONGER.',
];

export default function AskHobbyDork() {
  const [mode, setMode] = useState<Mode>('idle');
  const [answer, setAnswer] = useState<string | null>(null);

  // Auto reset cycle
  useEffect(() => {
    if (mode === 'answer') {
      const t1 = setTimeout(() => setMode('off'), 3000);
      return () => clearTimeout(t1);
    }
    if (mode === 'off') {
      const t2 = setTimeout(() => {
        setAnswer(null);
        setMode('idle');
      }, 3000);
      return () => clearTimeout(t2);
    }
  }, [mode]);

  function pick(type: 'BUY' | 'SELL') {
    const pool = type === 'BUY' ? BUY_ANSWERS : SELL_ANSWERS;
    setAnswer(pool[Math.floor(Math.random() * pool.length)]);
    setMode('answer');
  }

  return (
    <div className="relative w-[420px] max-w-full">
      {/* TV BODY */}
      <div className="relative rounded-[28px] bg-zinc-900 border-[6px] border-zinc-800 shadow-[0_30px_60px_rgba(0,0,0,0.6)] p-4">

        {/* Antennas */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-10">
          <div className="w-1 h-10 bg-zinc-600 rotate-[-25deg]" />
          <div className="w-1 h-10 bg-zinc-600 rotate-[25deg]" />
        </div>

        {/* SCREEN */}
        <div
          className={clsx(
            'relative h-[260px] rounded-[16px] overflow-hidden bg-black border-4 border-zinc-700',
            mode === 'off' && 'animate-tv-off'
          )}
        >
          {/* Scanlines */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[length:100%_3px] opacity-40" />

          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(0,255,120,0.25)]" />

          {/* CONTENT */}
          <div className="relative z-10 flex h-full w-full items-center justify-center text-center px-4 font-mono text-green-400">

            {mode === 'idle' && (
              <div className="space-y-3 animate-flicker">
                <div className="text-2xl tracking-widest">ASK HOBBYDORK</div>
                <div className="text-xs animate-pulse">
                  CLICK TO START
                </div>
                <button
                  title="Ask HobbyDork"
                  className="absolute inset-0"
                  onClick={() => setMode('choice')}
                >Ask HobbyDork</button>
              </div>
            )}

            {mode === 'choice' && (
              <div className="space-y-4">
                <button
                  onClick={() => pick('BUY')}
                  className="block w-full border border-green-500 py-2 hover:bg-green-500 hover:text-black"
                  title="Perform action"
                >
                  SHOULD I BUY?
                </button>
                <button
                  onClick={() => pick('SELL')}
                  className="block w-full border border-green-500 py-2 hover:bg-green-500 hover:text-black"
                  title="Perform action"
                >
                  SHOULD I SELL?
                </button>
              </div>
            )}

            {mode === 'answer' && (
              <div className="animate-jitter">
                <div className="text-sm mb-2">HOBBYDORK SAYS:</div>
                <div className="text-xl font-bold">{answer}</div>
              </div>
            )}

            {mode === 'off' && (
              <div className="text-xs text-green-700 animate-static">
                ██████████████
              </div>
            )}
          </div>
        </div>

        {/* DIALS */}
        <div className="absolute right-3 bottom-6 space-y-3">
          <div className="h-6 w-6 rounded-full bg-zinc-700" />
          <div className="h-6 w-6 rounded-full bg-zinc-700" />
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes flicker {
          0%,100% { opacity: 1 }
          50% { opacity: 0.85 }
        }
        .animate-flicker {
          animation: flicker 2s infinite;
        }
        @keyframes jitter {
          0% { transform: translate(0,0); }
          20% { transform: translate(-1px,1px); }
          40% { transform: translate(1px,-1px); }
          60% { transform: translate(-1px,0); }
          80% { transform: translate(1px,1px); }
          100% { transform: translate(0,0); }
        }
        .animate-jitter {
          animation: jitter 0.15s infinite;
        }
        @keyframes tvOff {
          to {
            transform: scaleY(0.02);
            opacity: 0;
          }
        }
        .animate-tv-off {
          animation: tvOff 0.4s forwards;
        }
      `}</style>
    </div>
  );
}
