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
        primary: '#1a1a1a', // dark background
        background: '#232329', // panel background
        accent: '#ffcc00', // yellow accent
        text: '#fff', // white text
      },
      fontFamily: 'var(--font-riffic), var(--font-sans), sans-serif',
      borderRadius: '1.25rem',
      previewStyle: {
        backgroundImage: "url('/grid.svg')",
        backgroundColor: '#232329',
        backgroundSize: '80px 80px',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
      },
      headingFont: 'Oswald, Impact, Arial Black, sans-serif',
      details: 'Dark comic-style: black background, yellow accent, bold comic font, tape corners.'
    },
    retro: {
      name: 'Retro',
      colors: {
        primary: '#a0522d', // saddle brown
        background: '#f5e9da', // light wood
        accent: '#deb887', // burlywood (wood accent)
        text: '#4e2e0e', // dark wood text
      },
      fontFamily: 'Riffic, cursive',
      borderRadius: '1rem',
      previewStyle: {
        backgroundImage: "url('https://www.transparenttextures.com/patterns/wood-pattern.png')",
        backgroundColor: '#f5e9da',
        backgroundSize: 'auto',
        backgroundRepeat: 'repeat',
        border: '4px solid #a0522d',
        boxShadow: '0 4px 24px 0 rgba(160,82,45,0.10), 0 2px 8px 0 #deb887',
      },
      headingFont: 'Riffic, cursive',
      details: 'Wood grain background, warm brown tones, and wood-style accents for a nostalgic, classic feel.',
    },
    urban: {
      name: 'Urban',
      colors: {
        primary: '#0ea5e9',
        background: '#23272e', // deeper urban blue/gray
        accent: '#334155',
        text: '#f1f5f9',
      },
      fontFamily: 'Montserrat, Inter, sans-serif',
      borderRadius: '0.75rem',
      previewStyle: {
          backgroundImage: "url('/brick-wall.png'), url('data:image/svg+xml;utf8,<svg width=\"320\" height=\"80\" xmlns=\"http://www.w3.org/2000/svg\"><text x=\"10\" y=\"60\" font-size=\"48\" font-family=\'Permanent Marker,Arial,sans-serif\' fill=\'%23e11d48\' stroke=\'%230ea5e9\' stroke-width=\'2\'>HobbyDork</text></svg>')",
        backgroundColor: '#23272e',
        backgroundSize: 'auto, 320px 80px',
        backgroundPosition: 'left top, 40px 24px',
        backgroundRepeat: 'repeat, no-repeat',
        border: '3px solid #0ea5e9',
        boxShadow: '0 4px 24px 0 rgba(14,165,233,0.10), 0 2px 8px 0 #334155',
      },
      headingFont: 'Montserrat, Inter, sans-serif',
      details: 'Urban city vibes: textured asphalt, cool blue accents, and modern sans-serif fonts.',
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
      previewStyle: {
        backgroundImage: "url('https://www.transparenttextures.com/patterns/peg-board.png'), url('data:image/svg+xml;utf8,<svg width=320 height=80 xmlns=\"http://www.w3.org/2000/svg\"><g><rect x=\"0\" y=\"60\" width=\"320\" height=\"20\" fill=\"%23ffe066\" stroke=\"%23e11d48\" stroke-width=\"2\"/><rect x=\"20\" y=\"68\" width=\"10\" height=\"8\" fill=\"%23fbbf24\" stroke=\"%233b2f1e\" stroke-width=\"1\"/><rect x=\"22\" y=\"66\" width=\"6\" height=\"4\" fill=\"%23e11d48\"/><polygon points=\"45,75 53,75 49,67\" fill=\"%23e11d48\" stroke=\"%233b2f1e\" stroke-width=\"1\"/><rect x=\"65\" y=\"66\" width=\"12\" height=\"16\" fill=\"%23fffbe9\" stroke=\"%23e11d48\" stroke-width=\"1\"/><rect x=\"68\" y=\"69\" width=\"12\" height=\"16\" fill=\"%23ffe066\" stroke=\"%23e11d48\" stroke-width=\"1\"/><rect x=\"100\" y=\"70\" width=\"24\" height=\"8\" fill=\"%23fbbf24\" stroke=\"%233b2f1e\" stroke-width=\"1\"/><rect x=\"104\" y=\"72\" width=\"8\" height=\"4\" fill=\"%23e11d48\"/><rect x=\"140\" y=\"66\" width=\"10\" height=\"16\" fill=\"%23fffbe9\" stroke=\"%23e11d48\" stroke-width=\"1\"/><text x=\"142\" y=\"78\" font-size=\"8\" font-family='Comic Sans MS,Comic Sans,Riffic,cursive,sans-serif' fill=\"%23e11d48\">C</text><rect x=\"170\" y=\"72\" width=\"4\" height=\"12\" fill=\"%233b2f1e\"/><rect x=\"176\" y=\"74\" width=\"2\" height=\"10\" fill=\"%23e11d48\"/><text x=\"200\" y=\"75\" font-size=\"14\" font-family='Comic Sans MS,Comic Sans,Riffic,cursive,sans-serif' fill=\"%23e11d48\">stickers</text></g></svg>')",
        backgroundColor: '#fffbe9',
        backgroundSize: 'auto, 320px 80px',
        backgroundPosition: 'left top, 0 24px',
        backgroundRepeat: 'repeat, no-repeat',
        boxShadow: '0 8px 32px 0 rgba(225,29,72,0.10), 0 2px 8px 0 #fbbf24',
        border: '3px dashed #e11d48',
      },
      headingFont: 'Comic Sans MS, Comic Sans, Riffic, cursive, sans-serif',
      details: 'Pegboard, hobby icons, and playful comic style.',
    },
    elegant: {
      name: 'Elegant',
      colors: {
        primary: '#1a1a1a',
        background: '#232329',
        accent: '#ffcc00',
        text: '#d7263d',
      },
      fontFamily: 'var(--font-riffic), var(--font-sans), sans-serif',
      borderRadius: '2.5rem',
      previewStyle: {
        backgroundColor: '#fffbe9',
        border: '8px double #d7263d',
        borderRadius: '2.5rem',
        boxShadow: '0 8px 32px 0 rgba(215,38,61,0.18), 0 2px 8px 0 #ffb400',
        minWidth: '320px',
        maxWidth: '100%',
        textAlign: 'center',
        fontFamily: 'Oswald, Impact, Arial Black, sans-serif',
        color: '#d7263d',
        letterSpacing: '0.08em',
        borderTop: '24px solid #ffb400',
        borderBottom: '24px solid #ffb400',
      },
      headingFont: 'Oswald, Impact, Arial Black, sans-serif',
      details: 'Cream background, bold red double border, gold top and bottom, and festive shadow to match the Vegas marquee banner.'
    },
  };
