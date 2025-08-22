import { NextRequest, NextResponse } from 'next/server';

// POST - Test vocal avec OpenAI TTS
export async function POST(request: NextRequest) {
  try {
    const { text, voice, speed } = await request.json();

    if (!text || !voice) {
      return NextResponse.json({ error: 'Texte et voix requis' }, { status: 400 });
    }

    // Appel à OpenAI TTS
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        speed: speed || 1.0,
        response_format: 'mp3'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI TTS:', response.status, errorData);
      throw new Error(`Erreur OpenAI TTS: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    // Retourner l'audio directement
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Erreur TTS test:', error);
    return NextResponse.json({ error: 'Erreur génération audio' }, { status: 500 });
  }
}