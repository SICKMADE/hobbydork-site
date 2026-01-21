'use client';

import * as Dialog from '@radix-ui/react-dialog';
import AskHobbyDork from './AskHobbyDork';

export default function MiniAskCRT() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          title="Open"
          className="relative mx-auto opacity-90 hover:opacity-100 transition"
        >
          {/* CRT MODULE */}
          <div className="relative h-[28px] w-[48px] border border-zinc-700 bg-zinc-950 overflow-hidden">

            {/* faint phosphor noise */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(180,180,180,0.08),transparent_40%)]" />

            {/* scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35)_1px,transparent_1px)] bg-[length:100%_3px]" />

            {/* ghost text */}
            <div className="absolute inset-0 flex items-center justify-center text-[6px] font-mono tracking-widest text-zinc-400 opacity-60">
              ▓▒░
            </div>

            {/* rare glitch */}
            <div className="absolute inset-0 animate-crt-glitch bg-white/5 mix-blend-overlay" />
          </div>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
          <AskHobbyDork />
        </Dialog.Content>
      </Dialog.Portal>

      <style jsx>{`
        @keyframes crtGlitch {
          0%, 92%, 100% { opacity: 0 }
          93% { opacity: 0.25 }
          94% { opacity: 0 }
          96% { opacity: 0.15 }
        }
        .animate-crt-glitch {
          animation: crtGlitch 14s infinite;
        }
      `}</style>
    </Dialog.Root>
  );
}
