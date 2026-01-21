'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { handleVaultPinCheck } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info } from 'lucide-react';

export function StandaloneVaultDoor() {
  const [open, setOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { toast } = useToast();

  const press = (d: string) => pin.length < 4 && setPin(pin + d);
  const clear = () => setPin('');
  const back = () => setPin(pin.slice(0, -1));

  async function submit() {
    if (pin.length !== 4) return;
    setLoading(true);
    try {
      const res = await handleVaultPinCheck({ pin });
      if (!res.isCorrect) {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        toast({ title: 'ACCESS DENIED', variant: 'destructive' });
        clear();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* INFO MODAL */}
      <Dialog.Root open={infoOpen} onOpenChange={setInfoOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl bg-zinc-900 border-2 border-zinc-700 p-6">
            <h3 className="text-sm font-bold tracking-widest mb-2">
              ACCESS KEYPAD
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Somewhere on the site is a hidden 4-digit code.
              <br /><br />
              Find it. Enter it. Unlock what’s behind the keypad.
            </p>
            <button
              onClick={() => setInfoOpen(false)}
              className="mt-4 w-full rounded bg-zinc-800 py-2 text-sm font-semibold hover:bg-zinc-700"
            >
              Got it
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* KEYPAD (DASHBOARD) */}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <div className="relative inline-block">
          {/* INFO ICON (no longer a button, now a span) */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setInfoOpen(true);
            }}
            className="absolute -top-2 -right-2 z-20 h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 cursor-pointer"
            aria-label="Keypad info"
          >
            <Info className="h-4 w-4 text-zinc-300" />
          </span>
          <Dialog.Trigger asChild>
            <div
              role="button"
              tabIndex={0}
              className="group relative cursor-pointer w-56 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 border-4 border-zinc-700 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.8)] custom-outline-none"
              aria-label="Open keypad"
              onClick={() => setOpen(true)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(true); }}
            >
              {/* LED BAR */}
              <div className="mb-3 h-3 rounded bg-black border border-zinc-700 overflow-hidden">
                <div className="h-full w-1/3 bg-emerald-400 animate-led" />
              </div>

              {/* DISPLAY */}
              <div className="mb-3 h-8 rounded bg-black border border-zinc-700 flex items-center justify-center font-mono tracking-[0.4em] text-emerald-300 animate-flicker">
                ****
              </div>

              {/* BUTTON GRID (visual only, not interactive) */}
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 border border-zinc-600 shadow-[inset_0_-2px_0_rgba(0,0,0,0.6)] flex items-center justify-center font-bold text-zinc-200"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              <div className="mt-3 text-center text-xs tracking-widest text-zinc-400">
                SECURE ACCESS
              </div>

              {/* SCAN SWEEP */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -top-full h-full w-full bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent animate-scan" />
              </div>
            </div>
          </Dialog.Trigger>
        </div>

        {/* FULL KEYPAD MODAL */}
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <Dialog.Content
            className={`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl bg-zinc-900 border-4 border-zinc-700 p-6 ${
              shake ? 'animate-shake' : ''
            }`}
          >
            <div className="text-center mb-4 tracking-widest font-bold">
              ENTER ACCESS CODE
            </div>

            <div className="flex justify-center mb-4">
              <div className="h-12 w-44 bg-black border border-zinc-700 rounded flex items-center justify-center font-mono text-3xl tracking-widest text-emerald-300 shadow-inner">
                {pin.padEnd(4, '•')}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 justify-center mb-4">
              {[1,2,3,4,5,6,7,8,9,'C',0,'←'].map((k) => (
                <button
                  key={k}
                  onClick={() =>
                    typeof k === 'number'
                      ? press(String(k))
                      : k === 'C'
                      ? clear()
                      : back()
                  }
                  className="h-14 w-14 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 border border-zinc-600 font-bold text-zinc-200 shadow-[inset_0_-2px_0_rgba(0,0,0,0.6)] active:translate-y-[1px]"
                >
                  {k}
                </button>
              ))}
            </div>

            <button
              onClick={submit}
              disabled={loading || pin.length !== 4}
              className="w-full rounded bg-emerald-500 py-2 font-bold text-black hover:brightness-110"
            >
              {loading ? <Loader2 className="mx-auto animate-spin" /> : 'UNLOCK'}
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ANIMATIONS */}
      <style jsx>{`
        @keyframes scan {
          0% { top: -100%; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 3.5s linear infinite;
        }
        @keyframes flicker {
          0%,100% { opacity: 1 }
          50% { opacity: 0.75 }
        }
        .animate-flicker {
          animation: flicker 1.4s infinite;
        }
        @keyframes led {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-led {
          animation: led 2.5s linear infinite;
        }
        @keyframes shake {
          0% { transform: translate(-50%, -50%) translateX(0); }
          20% { transform: translate(-50%, -50%) translateX(-6px); }
          40% { transform: translate(-50%, -50%) translateX(6px); }
          60% { transform: translate(-50%, -50%) translateX(-4px); }
          80% { transform: translate(-50%, -50%) translateX(4px); }
          100% { transform: translate(-50%, -50%) translateX(0); }
        }
        .animate-shake {
          animation: shake 0.4s;
        }
      `}</style>
    </>
  );
}
