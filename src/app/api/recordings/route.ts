import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

// GET - List recordings with filters
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    
    // If no database, return empty list
    if (!db) {
      return NextResponse.json({
        success: true,
        recordings: [],
        total: 0,
        hasMore: false,
        demo: true,
      });
    }

    const Recording = (await import('@/models/Recording')).default;

    const searchParams = request.nextUrl.searchParams;
    const expertId = searchParams.get('expertId');
    const gameType = searchParams.get('gameType');
    const language = searchParams.get('language');
    const label = searchParams.get('label');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build filter
    const filter: Record<string, unknown> = {};
    if (expertId) filter.expertId = expertId;
    if (gameType) filter.gameType = gameType;
    if (language) filter.language = language;
    if (label) filter.label = label;

    const recordings = await Recording.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Recording.countDocuments(filter);

    return NextResponse.json({
      success: true,
      recordings,
      total,
      hasMore: skip + recordings.length < total,
    });
  } catch (error) {
    console.error('Get recordings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recordings' },
      { status: 500 }
    );
  }
}

// POST - Create new recording
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    
    // If no database, return mock success (for demo mode)
    if (!db) {
      const body = await request.json();
      return NextResponse.json({
        success: true,
        recording: {
          id: uuidv4(),
          ...body,
        },
        demo: true,
        message: 'Recording saved in demo mode (no database connected)',
      });
    }

    const Recording = (await import('@/models/Recording')).default;
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'expertId',
      'expertName',
      'gameType',
      'language',
      'label',
      'category',
      'audioUrl',
      'audioDuration',
      'promptId',
      'promptText',
      'instruction',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create recording
    const recording = await Recording.create({
      id: uuidv4(),
      ...body,
      validated: false,
    });

    return NextResponse.json({
      success: true,
      recording: {
        id: recording.id,
        gameType: recording.gameType,
        language: recording.language,
        label: recording.label,
        category: recording.category,
        audioDuration: recording.audioDuration,
      },
    });
  } catch (error) {
    console.error('Create recording error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recording' },
      { status: 500 }
    );
  }
}
