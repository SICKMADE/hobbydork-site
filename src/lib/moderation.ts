// lib/moderation.ts

// Lowercase words/phrases you want to hard-block
const BLOCKED_TERMS = [
    'porn',
    'porno',
    'xxx',
    'nude',
    'nudes',
    'onlyfans',
    'sex',
    'nsfw',
    'fuck',
    'shit',
    'assshole',
    'faggot',
    'retard',
    'retarded',
    'dick',
    'dickhead',
    'pussy',
    'bitch',
    'cunt',
    'cock',
    'motherfucker',
    'tit',
    'whore',
    'slut',
    // add more here
  ];
  
  export function containsBlockedContent(text: string): string | null {
    const lower = text.toLowerCase();
  
    for (const term of BLOCKED_TERMS) {
      if (lower.includes(term)) {
        return `Your message contains a blocked term: "${term}".`;
      }
    }
  
    return null;
  }
  