export const ISO24_CATEGORY_OPTIONS = [
  { value: 'COMIC_BOOKS', label: 'Comic Books' },
  { value: 'SPORTS_CARDS', label: 'Sports Cards' },
  { value: 'POKEMON_CARDS', label: 'Pokémon Cards' },
  { value: 'VIDEO_GAMES', label: 'Video Games' },
  { value: 'TOYS', label: 'Toys' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type Iso24Category = (typeof ISO24_CATEGORY_OPTIONS)[number]['value'];

export function normalizeIso24Category(value: unknown): Iso24Category {
  const raw = String(value || '').toUpperCase();
  const hit = ISO24_CATEGORY_OPTIONS.find((o) => o.value === raw);
  return hit?.value ?? 'OTHER';
}

export function labelIso24Category(value: unknown): string {
  const normalized = normalizeIso24Category(value);
  return ISO24_CATEGORY_OPTIONS.find((o) => o.value === normalized)?.label ?? 'Other';
}
