const DEFAULT_AVATAR_FILES = [
  'hobbydork-head2.png',
  'hobbydork-head3.png',
  'hobbydork-head4.png',
  'hobbydork-head5.png',
  'hobbydork-head6.png',
  'hobbydork-head7.png',
] as const;

// Always use the avatars directory in public
const DEFAULT_AVATAR_DIR = 'avatars';
const FALLBACK_AVATAR_DIR = 'avatars';

function hashString(input: string): number {
  // djb2
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  // force unsigned
  return hash >>> 0;
}

export function getDefaultAvatarUrl(seed?: string | null): string {
  const value = (seed ?? '').trim();
  let index: number;
  if (value) {
    index = hashString(value) % DEFAULT_AVATAR_FILES.length;
  } else {
    // Randomize if no seed provided
    index = Math.floor(Math.random() * DEFAULT_AVATAR_FILES.length);
  }
  const file = DEFAULT_AVATAR_FILES[index] ?? DEFAULT_AVATAR_FILES[0];
  return `/${DEFAULT_AVATAR_DIR}/${file}`;
}

export function getFallbackDefaultAvatarUrl(seed?: string | null): string {
  const value = (seed ?? '').trim();
  let index: number;
  if (value) {
    index = hashString(value) % DEFAULT_AVATAR_FILES.length;
  } else {
    index = Math.floor(Math.random() * DEFAULT_AVATAR_FILES.length);
  }
  const file = DEFAULT_AVATAR_FILES[index] ?? DEFAULT_AVATAR_FILES[0];
  return `/${FALLBACK_AVATAR_DIR}/${file}`;
}

export function resolveAvatarUrl(
  avatar?: string | null,
  seed?: string | null
): string {
  const cleaned = (avatar ?? '').trim();
  return cleaned ? cleaned : getDefaultAvatarUrl(seed);
}
