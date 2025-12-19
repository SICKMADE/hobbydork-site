'use client';

import type { ElementType } from 'react';
import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Gamepad2,
  Lock,
  MessageSquare,
  NotebookText,
  RectangleHorizontal,
  Search,
  Share2,
  ShoppingCart,
  Store,
  ToyBrick,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const cyclingSlides = [
  {
    label: 'Comic Books',
    icon: NotebookText,
    imageSrc: '/comic.png',
    imageAlt: 'Comic book collectible',
  },
  {
    label: 'Sports Cards',
    icon: RectangleHorizontal,
    imageSrc: '/sportscards.png',
    imageAlt: 'Sports card collectible',
  },
  {
    label: 'Pokémon Cards',
    icon: RectangleHorizontal,
    imageSrc: '/pokemoncards.png',
    imageAlt: 'Pokémon card collectible',
  },
  {
    label: 'Video Games',
    icon: Gamepad2,
    imageSrc: '/videogames.png',
    imageAlt: 'Video game collectible',
  },
  {
    label: 'Toys',
    icon: ToyBrick,
    imageSrc: '/toys.png',
    imageAlt: 'Toy collectible',
  },
];

function DynamicImageShowcase() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % cyclingSlides.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const currentSlide = cyclingSlides[index];
  const CurrentIcon = currentSlide?.icon;

  return (
    <div className="relative aspect-[4/3] min-h-[260px] sm:min-h-[340px] lg:min-h-[420px] xl:min-h-[480px] w-full max-w-md sm:max-w-lg lg:max-w-none lg:w-full mx-auto rounded-xl overflow-hidden border-2 border-neutral-700/70 shadow-2xl shadow-primary/10">
      <AnimatePresence>
        <motion.div
          key={currentSlide?.label || index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {currentSlide && (
            <Image
              src={currentSlide.imageSrc}
              alt={currentSlide.imageAlt}
              fill
              className="object-cover"
              unoptimized
              sizes="(min-width: 1280px) 700px, (min-width: 1024px) 640px, 100vw"
              priority={index === 0}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {currentSlide && (
            <div className="absolute left-4 bottom-4 right-4 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/50 backdrop-blur px-3 py-1.5 border border-white/10">
                {CurrentIcon && <CurrentIcon className="h-4 w-4 text-white" />}
                <span className="text-sm font-semibold tracking-wide text-white">
                  {currentSlide.label}
                </span>
              </div>
              <div className="text-xs text-neutral-200/80 hidden sm:block">
                {index + 1}/{cyclingSlides.length}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        'relative p-6 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-700/70 shadow-lg',
        'transition-all duration-300 ease-in-out hover:border-primary/50 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_hsl(var(--primary))]'
      )}
    >
      <div className="relative z-10 space-y-4">
        <div className="p-3 rounded-full w-fit bg-neutral-800 border border-neutral-700">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-neutral-100">{title}</h3>
        <p className="text-neutral-400">{description}</p>
      </div>
    </div>
  );
}

const features = [
  {
    icon: ShoppingCart,
    title: 'Buy & Sell',
    description: 'Serious marketplace for modern and vintage collectibles.',
  },
  {
    icon: MessageSquare,
    title: 'Community Chat',
    description: 'Talk with collectors in real time.',
  },
  {
    icon: Search,
    title: 'ISO24',
    description: 'Looking for something specific? Post it and let sellers come to you.',
  },
  {
    icon: Lock,
    title: 'The Vault',
    description: 'There’s something hidden. You’ll find it later.',
  },
];

function SellingStep({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 border-2 border-neutral-700">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="mb-2 text-lg font-bold tracking-tight text-white uppercase">
        {title}
      </h3>
      <p className="text-neutral-400">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 text-neutral-200 overflow-x-hidden landing-page-bg font-body">
      <div className="absolute inset-0 z-0 opacity-15 bg-[url('/grid.svg')] [background-position:0_0.5px]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />

      <header className="relative z-20 p-4 flex justify-end items-center container mx-auto">
        <div className="flex items-center gap-4">
          <Button
            asChild
            className="px-6 py-2 group bg-blue-600 text-white font-bold tracking-wide rounded-full shadow-md border-b-4 border-blue-800 hover:bg-blue-500 active:border-b-2 active:translate-y-1 transition-all duration-150 transform relative overflow-hidden"
          >
            <Link href="/login">Log In</Link>
          </Button>
          <Button
            asChild
            className="px-6 py-2 group bg-primary text-primary-foreground font-bold tracking-wide rounded-full shadow-md border-b-4 border-gray-400 hover:bg-gray-200 active:border-b-2 active:translate-y-1 transition-all duration-150 transform relative overflow-hidden"
          >
            <Link href="/login#signup">Sign Up</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <section className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start lg:items-center">
          <div className="text-center max-w-xl mx-auto">
            <div className="flex justify-center">
              <Image
                src="/hobbydork-main.png"
                alt="HobbyDork"
                width={560}
                height={160}
                priority
                className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto mb-5"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-white uppercase">
              MARKETPLACE & COMMUNITY FOR COLLECTORS
            </h1>
            <p className="max-w-md mx-auto text-base sm:text-lg lg:text-xl leading-relaxed text-neutral-400 mb-7">
              SELL YOUR COMICS, SPORTS CARDS, POKEMON CARDS, VIDEO GAMES, TOYS, AND ALL OTHER COLLECTIBLES
            </p>
            <Button
              asChild
              size="lg"
              className="text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-7 group bg-red-600 text-white font-bold tracking-wide rounded-full shadow-lg border-b-4 border-red-800 hover:bg-red-500 active:border-b-0 active:translate-y-1 transition-all duration-150 transform relative overflow-hidden"
            >
              <Link href="/login#signup">
                Start Your Collection
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <div className="animate-fade-in-slow lg:justify-self-end">
            <DynamicImageShowcase />
          </div>
        </section>

        <section className="py-24">
          <div className="relative py-12 px-8 rounded-2xl bg-neutral-900 border border-neutral-700/70 shadow-2xl">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 items-start">
              <SellingStep
                icon={UserPlus}
                title="Apply to Sell"
                description="Complete a quick application to join our curated community of sellers."
              />
              <SellingStep
                icon={Store}
                title="Create Your Store"
                description="Set up your personalized storefront with a unique URL in minutes."
              />
              <SellingStep
                icon={Share2}
                title="Share Your Link"
                description="Share your store link with the world and start making sales."
              />
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, featureIndex) => (
              <FeatureCard
                key={featureIndex}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 text-center p-8 text-neutral-500 text-sm border-t border-white/5">
        <p>&copy; {new Date().getFullYear()} HobbyDork. All rights reserved.</p>
      </footer>
    </div>
  );
}
