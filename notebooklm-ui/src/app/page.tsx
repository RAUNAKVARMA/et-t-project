'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const SpaceScene = dynamic(() => import('@/components/SpaceScene'), { ssr: false });

export default function Home() {
  const router = useRouter();

  return (
    <>
      <SpaceScene onBlackHoleClick={() => router.push('/chat')} />
      <div
        style={{
          position: 'fixed',
          bottom: '2.5rem',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <p
          style={{
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            padding: '0.6rem 1.4rem',
            borderRadius: '999px',
            border: '1px solid rgba(0,229,255,0.2)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.9rem',
            letterSpacing: '0.02em',
          }}
        >
          Click the black hole to enter the knowledge portal
        </p>
      </div>
    </>
  );
}
