// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Analytics API endpoint
 * Stores analytics events in the database
 */
export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    const supabase = createAdminClient();

    // Determine event type
    const isIdentify = eventData.type === 'identify';

    if (isIdentify) {
      // Store user identification
      const { user_id, properties, timestamp } = eventData;

      await supabase.from('analytics_users').upsert({
        user_id,
        properties: properties || {},
        last_seen: new Date(timestamp).toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      // Store event
      const { event, properties, user } = eventData;

      // Extract user ID from properties or user object
      const userId = user?.user_id || properties?.user_id;

      await supabase.from('analytics_events').insert({
        event_name: event,
        user_id: userId,
        properties: properties || {},
        session_id: properties?.session_id,
        timestamp: new Date(properties?.timestamp || Date.now()).toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    // Don't fail the request - analytics should never break user experience
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

/**
 * Get analytics data (for admin dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('user_id');
    const eventName = searchParams.get('event');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (eventName) {
      query = query.eq('event_name', eventName);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
