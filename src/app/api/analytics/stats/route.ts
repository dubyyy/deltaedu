// src/app/api/analytics/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Get aggregated analytics stats for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d'; // 7d, 30d, 90d, all

    // Calculate date range
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get user's analytics events
    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (!events) {
      return NextResponse.json({
        totalNotes: 0,
        quizzesTaken: 0,
        studyTime: 0,
        averageScore: 0,
        recentActivity: [],
      });
    }

    // Calculate stats
    const noteEvents = events.filter(e => e.event_name === 'note_uploaded');
    const quizEvents = events.filter(e => e.event_name === 'quiz_completed');
    const sessionEvents = events.filter(e => e.event_name === 'session_ended');

    // Calculate total study time from sessions
    const totalStudyTimeMs = sessionEvents.reduce(
      (sum, event) => sum + (event.properties?.duration_ms || 0),
      0
    );
    const studyTimeHours = Math.round(totalStudyTimeMs / (1000 * 60 * 60));

    // Calculate average quiz score
    const quizScores = quizEvents.map(e => e.properties?.percentage || 0);
    const averageScore = quizScores.length > 0
      ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
      : 0;

    // Get recent activity (last 10 events)
    const recentActivity = events.slice(0, 10).map(event => ({
      id: event.id,
      type: event.event_name,
      timestamp: event.timestamp,
      description: formatEventDescription(event),
    }));

    // Get event counts by type
    const eventCounts: { [key: string]: number } = {};
    events.forEach(event => {
      eventCounts[event.event_name] = (eventCounts[event.event_name] || 0) + 1;
    });

    // Calculate engagement metrics
    const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean)).size;
    const avgEventsPerSession = uniqueSessions > 0
      ? Math.round(events.length / uniqueSessions)
      : 0;

    return NextResponse.json({
      // Main stats
      totalNotes: noteEvents.length,
      quizzesTaken: quizEvents.length,
      studyTime: studyTimeHours,
      averageScore,
      
      // Detailed metrics
      metrics: {
        totalEvents: events.length,
        uniqueSessions,
        avgEventsPerSession,
        eventCounts,
      },
      
      // Recent activity
      recentActivity,
      
      // Time range
      timeRange,
      startDate: startDate.toISOString(),
    });
  } catch (error) {
    console.error('Analytics stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics stats' },
      { status: 500 }
    );
  }
}

/**
 * Format event description for display
 */
function formatEventDescription(event: any): string {
  const eventName = event.event_name;
  const props = event.properties || {};

  switch (eventName) {
    case 'note_uploaded':
      return `Uploaded a ${props.file_type} file`;
    case 'note_viewed':
      return `Viewed note: ${props.note_title || 'Untitled'}`;
    case 'quiz_generated':
      return `Generated a quiz with ${props.question_count} questions`;
    case 'quiz_completed':
      return `Completed quiz with ${props.percentage}% score`;
    case 'tutor_message_sent':
      return 'Asked AI tutor a question';
    case 'page_viewed':
      return `Visited ${props.page}`;
    case 'session_started':
      return 'Started a study session';
    case 'session_ended':
      const duration = props.duration_minutes || 0;
      return `Studied for ${duration} minute${duration !== 1 ? 's' : ''}`;
    default:
      return eventName.replace(/_/g, ' ');
  }
}
