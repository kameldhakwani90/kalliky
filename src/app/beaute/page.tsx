'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BeauteRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/activity/beaute');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-400 mx-auto mb-4" />
        <p className="text-xl">Redirection vers la nouvelle page beauté...</p>
      </div>
    </div>
  );
}