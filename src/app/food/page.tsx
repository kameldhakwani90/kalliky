'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FoodRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/activity/food');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-400 mx-auto mb-4" />
        <p className="text-xl">Redirection vers la nouvelle page restaurant...</p>
      </div>
    </div>
  );
}