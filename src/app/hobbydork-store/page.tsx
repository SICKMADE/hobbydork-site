"use client";

import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HobbyDorkStorePage() {
  return (
    <AppLayout>
      <div className="max-w-xl mx-auto py-20 flex flex-col items-center gap-12">
        <img src="/hstore.png" alt="HobbyDork Store" className="w-72 h-auto mb-8 drop-shadow-lg rounded-2xl" />
        <div className="w-full flex flex-row gap-8 justify-center items-end">
          <div className="flex flex-col items-center gap-2 relative">
            <div className="flex-shrink-0 relative">
              <Button
                size="lg"
                className="!w-72 !h-28 p-0 text-3xl font-semibold rounded-xl border border-red-600 bg-gray-200 text-gray-700 shadow-none cursor-not-allowed flex flex-col items-center justify-center opacity-90 text-center"
                aria-label="Themes"
                disabled
              >
                <span className="relative z-10 text-4xl mb-1">🎨</span>
                <span className="text-base font-semibold">Themes</span>
                <span className="text-xs text-gray-600">Browse and preview store themes</span>
                <span className="absolute left-1/2 top-2/3 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-lg border border-yellow-400 opacity-90 pointer-events-none select-none z-20">COMING SOON</span>
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Link href="/hobbydork-store/spotlight" className="flex-shrink-0">
              <Button
                size="lg"
                className="!w-72 !h-28 p-0 text-3xl font-semibold rounded-xl border border-red-700 bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:scale-95 transition-all flex flex-col items-center justify-center text-center"
                aria-label="Spotlight"
              >
                <span className="relative z-10 text-4xl mb-1">🌟</span>
                <span className="text-base font-semibold">Spotlight</span>
                <span className="text-xs text-gray-600">Featured stores and layouts</span>
              </Button>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2 relative">
            <div className="flex-shrink-0 relative">
              <Button
                size="lg"
                className="!w-72 !h-28 p-0 text-3xl font-semibold rounded-xl border border-red-600 bg-gray-200 text-gray-700 shadow-none cursor-not-allowed flex flex-col items-center justify-center opacity-90 text-center"
                aria-label="Layouts"
                disabled
              >
                <span className="relative z-10 text-4xl mb-1">🗂️</span>
                <span className="text-base font-semibold">Layouts</span>
                <span className="text-xs text-gray-600">Explore store layout options</span>
                <span className="absolute left-1/2 top-2/3 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-lg border border-yellow-400 opacity-90 pointer-events-none select-none z-20">COMING SOON</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
