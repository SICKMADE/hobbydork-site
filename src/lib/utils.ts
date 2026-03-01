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

  // A representative list of restricted words (expanded in production)
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
 * Returns a stable randomized avatar path from the /public/avatars folder
 * based on a provided seed (e.g., username or uid).
 * Filenames are hobbydork-head1.png through hobbydork-head10.png
 */
export function getRandomAvatar(seed?: string) {
  const avatars = [
    '/avatars/hobbydork-head1.png',
    '/avatars/hobbydork-head2.png',
    '/avatars/hobbydork-head3.png',
    '/avatars/hobbydork-head4.png',
    '/avatars/hobbydork-head5.png',
    '/avatars/hobbydork-head6.png',
    '/avatars/hobbydork-head7.png',
    '/avatars/hobbydork-head8.png',
    '/avatars/hobbydork-head9.png',
    '/avatars/hobbydork-head10.png',
  ];
  
  if (!seed || seed.trim() === '') return avatars[0];

  // Simple string hashing to get a consistent index for the same seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % avatars.length;
  return avatars[index];
}
