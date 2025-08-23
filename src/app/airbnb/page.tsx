'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AirbnbRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/activity/realstate');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400 mx-auto mb-4" />
        <p className="text-xl">Redirection vers la nouvelle page immobilier...</p>
      </div>
    </div>
  );
}