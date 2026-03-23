import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Global Profanity Filter
 * Replaces offensive words with asterisks.
 */
export function filterProfanity(text: string): string {
  if (!text) return text;

  const forbiddenWords = [
    'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'dick', 'pussy', 
    'nigger', 'faggot', 'retard', 'slut', 'whore', 'porn', 'adult', 'sex'
  ];

  let filteredText = text;
  forbiddenWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, (match) => '*'.repeat(match.length));
  });

  return filteredText;
}

/**
 * Returns a stable randomized avatar path from the local public/avatars folder.
 * Uses a seed (UID or username) to pick one of 10 heads.
 * This is the SINGLE SOURCE OF TRUTH for default avatars.
 */
export function getRandomAvatar(seed?: string) {
  if (!seed || seed.trim() === '') return "/avatars/hobbydork-head1.png";
  
  // Create a simple hash from the seed string to pick a stable avatar
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Map hash to a range of 1-10 corresponding to local assets in /public/avatars/
  const index = Math.abs(hash % 10) + 1;
  return `/avatars/hobbydork-head${index}.png`;
}
