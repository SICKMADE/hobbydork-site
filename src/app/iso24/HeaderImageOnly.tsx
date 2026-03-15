import Image from 'next/image';
import Navbar from '@/components/Navbar';

export default function ISO24Feed() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <header className="flex flex-col items-center justify-center mb-12">
          <Image 
            src="/ISO.png" 
            alt="ISO24 Header" 
            width={1800} 
            height={600} 
            priority
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </header>
        {/* ...existing content... */}
      </main>
    </div>
  );
}
