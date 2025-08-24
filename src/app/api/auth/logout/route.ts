import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Déconnecté avec succès' });
  
  // Supprimer le cookie auth-token
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') || false,
    sameSite: 'lax',
    maxAge: 0 // Expire immédiatement
  });

  return response;
}