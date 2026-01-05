// Simple sum function for testing
export function sum(a: number, b: number) {
  return a + b;
}
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | undefined | null) {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('');
};
