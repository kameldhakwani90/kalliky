import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and targetLanguage are required' },
        { status: 400 }
      );
    }

    const completion = await openaiService.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the provided text to ${targetLanguage}. Return only the translated text, nothing else.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
    });

    const translatedText = completion.choices[0]?.message?.content || text;

    return NextResponse.json({
      translatedText
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}