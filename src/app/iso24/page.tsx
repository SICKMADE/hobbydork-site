export const metadata = {
  title: 'ISO24 – HobbyDork',
  description: 'Post and respond to 24-hour ISO (In Search Of) requests for collectibles. Connect with buyers and sellers in real time on HobbyDork.',
  openGraph: {
    title: 'ISO24 – HobbyDork',
    description: 'Post and respond to 24-hour ISO (In Search Of) requests for collectibles. Connect with buyers and sellers in real time on HobbyDork.',
    url: 'https://hobbydork.com/iso24',
    siteName: 'HobbyDork',
    images: [
      {
        url: '/hobbydork-head.png',
        width: 400,
        height: 400,
        alt: 'HobbyDork Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'ISO24 – HobbyDork',
    description: 'Post and respond to 24-hour ISO (In Search Of) requests for collectibles. Connect with buyers and sellers in real time on HobbyDork.',
    images: ['/hobbydork-head.png'],
  },
};
export const dynamic = 'force-dynamic';

import ClientISO24 from './ClientISO24';

export default function ISO24Page() {
  return <ClientISO24 />;
}
