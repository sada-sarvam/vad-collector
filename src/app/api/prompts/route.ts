import { NextRequest, NextResponse } from 'next/server';
import { generatePrompt } from '@/lib/gemini';
import { GameType, Language } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameType = searchParams.get('gameType') as GameType;
    const language = searchParams.get('language') as Language;
    const mode = searchParams.get('mode') as 'complete' | 'trail-off' | undefined;

    if (!gameType || !language) {
      return NextResponse.json(
        { success: false, error: 'Missing gameType or language' },
        { status: 400 }
      );
    }

    // Validate gameType
    const validGameTypes = ['finish-thought', 'quick-answer', 'storyteller', 'memory-lane', 'number-dictation'];
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid gameType' },
        { status: 400 }
      );
    }

    // Validate language
    const validLanguages = ['hi', 'en', 'ta'];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Invalid language' },
        { status: 400 }
      );
    }

    // Generate prompt using Gemini
    const generated = await generatePrompt(gameType, language, mode);

    const prompt = {
      id: uuidv4(),
      gameType,
      language,
      text: generated.text,
      instruction: generated.instruction,
      expectedLabel: generated.expectedLabel,
      mode: mode || 'random',
    };

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error('Prompt generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
