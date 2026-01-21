// Store theme definitions for seller storefronts
// Add more themes as needed

export type StoreTheme = {
  name: string;
  colors: {
    primary: string;
    background: string;
    accent: string;
    text: string;
  };
  fontFamily?: string;
  borderRadius?: string;
  previewStyle?: Record<string, string>;
  headingFont?: string;
  details?: string;
};

export const storeThemes: Record<string, StoreTheme> = {
  default: {
    name: 'Default',
    colors: {
      primary: '#2563eb',
      background: '#f8fafc',
      accent: '#e0e7ff',
      text: '#1e293b',
    },
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.5rem',
  },
  retro: {
    name: 'Retro',
    colors: {
      primary: '#fbbf24',
      background: '#fff7ed',
      accent: '#f87171',
      text: '#78350f',
    },
    fontFamily: 'Riffic, cursive',
    borderRadius: '1rem',
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#0ea5e9',
      background: '#1e293b',
      accent: '#334155',
      text: '#f1f5f9',
    },
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.5rem',
  },
  hobbyshop: {
    name: 'Hobby Shop',
    colors: {
      primary: '#e11d48', // vibrant red-pink
      background: '#fffbe9', // warm off-white
      accent: '#ffe066', // brighter yellow accent
      text: '#3b2f1e', // deep brown for a cozy feel
    },
    fontFamily: 'Comic Sans MS, Comic Sans, Riffic, cursive, sans-serif',
    borderRadius: '2rem',
    // Add extra style hints for preview rendering
    previewStyle: {
      backgroundImage: 'repeating-linear-gradient(135deg, #ffe066 0 10px, transparent 10px 20px)',
      boxShadow: '0 4px 24px 0 rgba(225,29,72,0.10), 0 2px 8px 0 #fbbf24',
      border: '3px dashed #e11d48',
    },
  },
  elegant: {
    name: 'Elegant',
    colors: {
      primary: '#22223b', // deep indigo
      background: '#f8f7fa', // soft off-white
      accent: '#d4af37', // gold accent
      text: '#22223b', // dark for contrast
    },
    fontFamily: '"Playfair Display", "Georgia", serif',
    borderRadius: '1.25rem',
    previewStyle: {
      backgroundImage: 'linear-gradient(135deg, #f8f7fa 60%, #c9ada7 100%)',
      boxShadow: '0 4px 24px 0 rgba(34,34,59,0.08)',
      border: '2px solid #d4af37',
      borderTop: '6px double #d4af37',
      borderBottom: '6px double #d4af37',
      fontFamily: '"Playfair Display", "Georgia", serif',
      letterSpacing: '0.02em',
    },
    headingFont: '"Great Vibes", "Playfair Display", cursive, serif',
    details: 'Gold accents, double borders, and a luxury serif font for a refined, high-end look.',
  },
};
