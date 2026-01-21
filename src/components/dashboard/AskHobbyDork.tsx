'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';

export default function AskHobbyDork() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* GENIE TRIGGER */}
      <Dialog.Trigger asChild>
        <button
          className="group relative flex flex-col items-center justify-center"
          aria-label="Ask HobbyDork"
        >
          {/* glow */}
          <div className="absolute inset-0 rounded-full blur-2xl bg-fuchsia-500/30 opacity-0 group-hover:opacity-100 transition" />

          {/* genie image */}
          <div className="relative w-[180px] transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/genie.png"
              alt="Ask HobbyDork"
              width={340}
              height={340}
              priority
            />
          </div>

          {/* label */}
          <div className="mt-3 text-sm tracking-widest text-zinc-300 group-hover:text-fuchsia-400 transition">
            
          </div>
        </button>
      </Dialog.Trigger>

      {/* MODAL */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-zinc-900 border border-zinc-700 p-6 animate-in zoom-in">

          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/genie.png"
              alt="HobbyDork Genie"
              width={72}
              height={72}
            />
            <div>
              <Dialog.Title asChild>
                <h2 className="font-bold tracking-widest">Ask HobbyDork</h2>
              </Dialog.Title>
              <p className="text-sm text-zinc-400">
                Ask about collectibles, pricing, rarity, or anything hobby-related.
              </p>
            </div>
          </div>

          {/* INPUT */}
          <textarea
            placeholder="What do you want to know?"
            className="w-full h-32 rounded-lg bg-black border border-zinc-700 p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />

          {/* ACTIONS */}
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700">
                Cancel
              </button>
            </Dialog.Close>

            <button className="rounded bg-fuchsia-500 px-4 py-2 text-sm font-bold text-black hover:brightness-110">
              Ask
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
