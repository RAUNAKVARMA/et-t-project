'use client';

import { useRouter } from 'next/navigation';
import SpaceScene from '@/components/SpaceScene';
import ChatInterface from '../components/ChatInterface';
import SolarSystem from '../components/SolarSystem';

export default function Home() {
  const router = useRouter();

  const handleBlackHoleClick = () => {
    // Navigate to chat page
    router.push('/chat');
  };

  return (
    <div className="cosmic-app">
      <SpaceScene onBlackHoleClick={handleBlackHoleClick} isOpen={false} />
      <div className="cosmic-hint">
        <div className="hint-content">
          <span className="hint-icon">👆</span>
          <p>Click the black hole to enter the knowledge portal</p>
        </div>
      </div>
      <main>
        <SolarSystem />
        <ChatInterface />
      </main>
    </div>
  );
}
