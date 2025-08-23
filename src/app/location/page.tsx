'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LocationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/activity/location');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4" />
        <p className="text-xl">Redirection vers la nouvelle page location...</p>
      </div>
    </div>
  );
}