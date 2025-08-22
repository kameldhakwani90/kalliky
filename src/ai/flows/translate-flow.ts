/**
 * @fileOverview A text translation service using API call.
 */

export interface TranslateTextInput {
  text: string;
  targetLanguage: string;
}

export interface TranslateTextOutput {
  translatedText: string;
}

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('Translation API failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback: return original text if translation fails
    return {
      translatedText: input.text
    };
  }
}
