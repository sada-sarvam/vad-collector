import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CATEGORIES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    
    // If no database connection, return demo stats
    if (!db) {
      return NextResponse.json({
        success: true,
        stats: {
          totalRecordings: 0,
          totalExperts: 0,
          todayRecordings: 0,
          byLanguage: [
            { language: 'hi', total: 0, complete: 0, incomplete: 0, byCategory: [] },
            { language: 'en', total: 0, complete: 0, incomplete: 0, byCategory: [] },
            { language: 'ta', total: 0, complete: 0, incomplete: 0, byCategory: [] },
          ],
          byGame: [
            { gameType: 'finish-thought', total: 0 },
            { gameType: 'quick-answer', total: 0 },
            { gameType: 'storyteller', total: 0 },
            { gameType: 'memory-lane', total: 0 },
            { gameType: 'number-dictation', total: 0 },
          ],
          completionPercentage: 0,
        },
        demo: true,
      });
    }

    // Dynamic import to avoid errors when MongoDB isn't available
    const Recording = (await import('@/models/Recording')).default;

    const searchParams = request.nextUrl.searchParams;
    const expertId = searchParams.get('expertId');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Base filter
    const baseFilter = expertId ? { expertId } : {};

    // Total recordings
    const totalRecordings = await Recording.countDocuments(baseFilter);

    // Today's recordings
    const todayRecordings = await Recording.countDocuments({
      ...baseFilter,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // By language
    const byLanguage = await Recording.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { language: '$language', label: '$label' },
          count: { $sum: 1 },
        },
      },
    ]);

    // By game type
    const byGame = await Recording.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$gameType',
          count: { $sum: 1 },
        },
      },
    ]);

    // By category
    const byCategory = await Recording.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { language: '$language', category: '$category' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Process language stats
    const languages = ['hi', 'en', 'ta'];
    const languageStats = languages.map((lang) => {
      const langData = byLanguage.filter((item) => item._id.language === lang);
      const complete = langData.find((d) => d._id.label === 'complete')?.count || 0;
      const incomplete = langData.find((d) => d._id.label === 'incomplete')?.count || 0;

      const categoryStats = CATEGORIES.map((cat) => {
        const catData = byCategory.find(
          (item) => item._id.language === lang && item._id.category === cat.id
        );
        return {
          category: cat.id,
          count: catData?.count || 0,
          target: 500, // Per category target
          percentage: ((catData?.count || 0) / 500) * 100,
        };
      });

      return {
        language: lang,
        total: complete + incomplete,
        complete,
        incomplete,
        byCategory: categoryStats,
      };
    });

    // Process game stats
    const gameTypes = ['finish-thought', 'quick-answer', 'storyteller', 'memory-lane', 'number-dictation'];
    const gameStats = gameTypes.map((game) => {
      const gameData = byGame.find((item) => item._id === game);
      return {
        gameType: game,
        total: gameData?.count || 0,
      };
    });

    // Calculate overall completion
    const totalTarget = languages.length * CATEGORIES.length * 500; // 3 languages × 4 categories × 500
    const completionPercentage = (totalRecordings / totalTarget) * 100;

    // Unique experts count
    const uniqueExperts = await Recording.distinct('expertId');

    return NextResponse.json({
      success: true,
      stats: {
        totalRecordings,
        totalExperts: uniqueExperts.length,
        todayRecordings,
        byLanguage: languageStats,
        byGame: gameStats,
        completionPercentage: Math.min(completionPercentage, 100),
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
