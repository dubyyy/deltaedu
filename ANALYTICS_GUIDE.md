# Analytics Integration Guide

## Overview
DeltaEdu now includes a comprehensive analytics system to track user behavior, feature usage, and engagement metrics. This system supports multiple analytics providers and stores data in your own database for complete control.

## Features

### ✅ What's Tracked

#### Authentication Events
- **User Sign Up** - New account creations
- **User Login** - Successful logins
- **User Logout** - Session endings
- **Auth Failures** - Failed login/registration attempts

#### Content Events
- **Note Uploads** - File uploads with metadata (type, size)
- **Note Views** - When users view their notes
- **Note Edits** - Content modifications
- **Note Deletions** - Content removal

#### Learning Events
- **Quiz Generated** - AI quiz creation
- **Quiz Started** - User begins quiz
- **Quiz Completed** - Results with score and time
- **Question Answered** - Individual quiz interactions

#### AI Tutor Events
- **Message Sent** - User questions to AI
- **Session Started** - Chat session begins
- **Session Ended** - Chat session duration

#### Engagement Metrics
- **Page Views** - Navigation tracking
- **Time on Page** - Engagement duration
- **Feature Access** - Feature usage patterns
- **Session Duration** - Total study time

#### Error Tracking
- **Upload Failures** - Failed file uploads
- **Moderation Failures** - Content violations
- **General Errors** - Application errors

## Architecture

### Multi-Provider Support

```typescript
// Providers supported:
1. Database (Supabase) - Default, always enabled
2. PostHog - Optional, for advanced analytics
3. Mixpanel - Optional, for product analytics
4. Custom - Extensible for any provider
```

### Data Flow

```
User Action → Analytics Library → Multiple Destinations
                                   ├─ Supabase Database
                                   ├─ PostHog (optional)
                                   └─ Mixpanel (optional)
```

## Implementation

### 1. Core Analytics Library

**Location**: `src/lib/analytics.ts`

**Key Components**:
- `AnalyticsManager` - Core tracking engine
- `AnalyticsEvent` - Event type enum
- Helper functions for common events

**Example Usage**:
```typescript
import { analytics, AnalyticsEvent } from '@/lib/analytics';

// Track a custom event
analytics.track(AnalyticsEvent.NOTE_UPLOADED, {
  note_id: '123',
  file_type: 'pdf',
  file_size: 1024000
});

// Identify a user
analytics.identify('user-id', {
  email: 'user@example.com',
  name: 'John Doe'
});

// Track page view
analytics.page('/dashboard/notes');
```

### 2. React Hooks

**Location**: `src/hooks/useAnalytics.ts`

**Available Hooks**:

```typescript
// Auto-track page views
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent(AnalyticsEvent.FEATURE_ACCESSED, {
      feature: 'quiz_generator'
    });
  };
  
  return <button onClick={handleClick}>Generate Quiz</button>;
}
```

```typescript
// Initialize analytics on app load
import { useAnalyticsInit } from '@/hooks/useAnalytics';

function App() {
  useAnalyticsInit();
  return <div>...</div>;
}
```

```typescript
// Track page time automatically
import { usePageTracking } from '@/hooks/useAnalytics';

function NotePage() {
  usePageTracking('/notes/view');
  return <div>...</div>;
}
```

### 3. API Endpoints

#### POST `/api/analytics`
Store analytics events in the database.

**Request**:
```json
{
  "event": "note_uploaded",
  "properties": {
    "note_id": "123",
    "file_type": "pdf"
  },
  "user": {
    "user_id": "user-123"
  }
}
```

**Response**:
```json
{
  "success": true
}
```

#### GET `/api/analytics/stats`
Retrieve aggregated analytics statistics.

**Query Parameters**:
- `range` - Time range: `7d`, `30d`, `90d`, `all` (default: `30d`)

**Response**:
```json
{
  "totalNotes": 45,
  "quizzesTaken": 12,
  "studyTime": 8,
  "averageScore": 85,
  "metrics": {
    "totalEvents": 342,
    "uniqueSessions": 28,
    "avgEventsPerSession": 12
  },
  "recentActivity": [
    {
      "id": "event-123",
      "type": "quiz_completed",
      "timestamp": "2025-12-02T10:30:00Z",
      "description": "Completed quiz with 90% score"
    }
  ]
}
```

### 4. Database Schema

**Tables Created** (see `supabase/migrations/003_analytics_tables.sql`):

#### `analytics_events`
Stores all individual events.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_name | TEXT | Event type (e.g., "note_uploaded") |
| user_id | UUID | User who triggered event |
| session_id | TEXT | Session identifier |
| properties | JSONB | Event-specific data |
| timestamp | TIMESTAMPTZ | When event occurred |

#### `analytics_users`
Stores user analytics profiles.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User identifier |
| properties | JSONB | User metadata |
| first_seen | TIMESTAMPTZ | First event |
| last_seen | TIMESTAMPTZ | Most recent event |

#### `analytics_daily_summary` (Materialized View)
Pre-aggregated daily statistics for fast queries.

## Configuration

### Environment Variables

Add to your `.env.local`:

```env
# Optional: PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Optional: Mixpanel Configuration
NEXT_PUBLIC_MIXPANEL_TOKEN=your_token_here
```

### Enable/Disable Analytics

```typescript
// In your app initialization
analytics.init({
  enabled: true, // Set to false to disable all tracking
  providers: {
    database: true, // Always recommended
    posthog: {
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
```

## Integration Examples

### Track Note Upload

```typescript
// In upload handler
const handleUpload = async (file: File) => {
  try {
    const result = await uploadFile(file);
    
    // Track successful upload
    trackNoteUpload(result.id, file.type, file.size);
  } catch (error) {
    // Track failure
    trackError('upload_failed', error.message);
  }
};
```

### Track Quiz Completion

```typescript
// In quiz completion handler
const handleQuizComplete = (results: QuizResults) => {
  trackQuizCompleted(
    results.quizId,
    results.score,
    results.totalQuestions,
    results.timeSpent
  );
};
```

### Track AI Tutor Interactions

```typescript
// In chat handler
const sendMessage = async (message: string) => {
  trackTutorMessage(generateId(), message.length);
  
  const response = await ai.chat(message);
  return response;
};
```

## Dashboard Integration

### Display Analytics Stats

The dashboard automatically fetches and displays:
- Total notes uploaded
- Quizzes taken
- Study time (hours)
- Average quiz score

```tsx
// Already integrated in src/app/dashboard/page.tsx
const [stats, setStats] = useState<DashboardStats>({
  totalNotes: 0,
  quizzesTaken: 0,
  studyTime: 0,
  averageScore: 0,
});

useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch('/api/analytics/stats?range=30d');
    const data = await response.json();
    setStats(data);
  };
  
  fetchStats();
}, []);
```

## Privacy & Compliance

### Data Collection
- **Personal Data**: User ID, email (optional)
- **Behavioral Data**: Events, timestamps, session IDs
- **Technical Data**: User agent, page URLs

### User Control
```typescript
// Users can opt-out
analytics.reset(); // Clear all tracking data
localStorage.setItem('analytics_opt_out', 'true');
```

### GDPR Compliance
- Data stored in Supabase (EU servers available)
- User can request data deletion
- Full audit trail of events

## Querying Analytics Data

### SQL Examples

**Get user's activity for last 30 days**:
```sql
SELECT 
  event_name,
  COUNT(*) as count,
  DATE(timestamp) as date
FROM analytics_events
WHERE user_id = 'user-id'
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY event_name, DATE(timestamp)
ORDER BY date DESC;
```

**Get most active users**:
```sql
SELECT 
  user_id,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as sessions
FROM analytics_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY total_events DESC
LIMIT 10;
```

**Get quiz completion rate**:
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN event_name = 'quiz_started' THEN session_id END) as started,
  COUNT(DISTINCT CASE WHEN event_name = 'quiz_completed' THEN session_id END) as completed,
  ROUND(
    COUNT(DISTINCT CASE WHEN event_name = 'quiz_completed' THEN session_id END)::numeric /
    NULLIF(COUNT(DISTINCT CASE WHEN event_name = 'quiz_started' THEN session_id END), 0) * 100,
    2
  ) as completion_rate
FROM analytics_events
WHERE timestamp > NOW() - INTERVAL '30 days';
```

## Advanced Features

### Custom Events

Create custom tracking for specific features:

```typescript
// Track custom feature usage
analytics.track('custom_feature_used', {
  feature_name: 'ai_summary',
  action: 'generate',
  input_length: 5000,
  output_quality: 'high',
});
```

### Funnel Analysis

Track user journey through features:

```typescript
// Step 1: User uploads note
trackNoteUpload(noteId, type, size);

// Step 2: User generates quiz
trackQuizGenerated(quizId, noteId, questionCount);

// Step 3: User completes quiz
trackQuizCompleted(quizId, score, total, time);
```

### Cohort Analysis

```sql
-- Users who signed up in December 2025
WITH december_users AS (
  SELECT DISTINCT user_id
  FROM analytics_users
  WHERE first_seen >= '2025-12-01'
    AND first_seen < '2026-01-01'
)
-- Their activity
SELECT 
  event_name,
  COUNT(*) as event_count
FROM analytics_events
WHERE user_id IN (SELECT user_id FROM december_users)
GROUP BY event_name
ORDER BY event_count DESC;
```

## Performance Considerations

### Async Tracking
All analytics calls are non-blocking and won't slow down your app.

```typescript
// This won't block user actions
analytics.track('button_clicked', { button_id: 'submit' });
// User sees immediate response
```

### Batch Processing
Events are batched and sent efficiently to avoid excessive API calls.

### Materialized Views
Daily summary view is pre-computed for fast dashboard queries.

```sql
-- Refresh summary (run daily via cron)
SELECT refresh_analytics_summary();
```

## Monitoring & Alerts

### Track Analytics Health

```sql
-- Check if analytics is working
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as events_count
FROM analytics_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### Set Up Alerts

Monitor for:
- Zero events in last hour (system issue)
- Spike in error events (bug alert)
- Drop in engagement (user issue)

## Troubleshooting

### Events Not Appearing

1. **Check initialization**:
```typescript
// Verify analytics is initialized
console.log(analytics.isInitialized);
```

2. **Check browser console** for errors

3. **Verify API endpoint**:
```bash
curl -X POST http://localhost:3000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"event":"test","properties":{}}'
```

4. **Check database connection** in Supabase dashboard

### Stats Not Updating

1. **Refresh materialized view**:
```sql
REFRESH MATERIALIZED VIEW analytics_daily_summary;
```

2. **Check RLS policies** - ensure user can read their events

3. **Verify date range** in API call

## Migration

### Running the Migration

```bash
# Apply analytics tables migration
psql -d your_database -f supabase/migrations/003_analytics_tables.sql

# Or via Supabase CLI
supabase migration up
```

### Backfilling Data

If you have existing data to import:

```sql
INSERT INTO analytics_events (event_name, user_id, properties, timestamp)
SELECT 
  'note_uploaded',
  user_id,
  jsonb_build_object('note_id', id, 'title', title),
  created_at
FROM notes;
```

## Best Practices

1. **Track meaningful events** - Focus on user value, not every click
2. **Use consistent naming** - Follow the AnalyticsEvent enum
3. **Include context** - Add relevant properties to each event
4. **Respect privacy** - Don't track sensitive information
5. **Test tracking** - Verify events in development mode
6. **Monitor performance** - Keep tracking lightweight
7. **Document custom events** - Make it easy for team to understand

## Future Enhancements

Potential additions:
- [ ] Real-time analytics dashboard
- [ ] A/B testing framework
- [ ] User segmentation
- [ ] Automated insights (AI-powered)
- [ ] Export to CSV/PDF
- [ ] Custom report builder
- [ ] Slack/Email alerts
- [ ] Heatmaps and session recordings
- [ ] Conversion funnel visualization

## Support

For issues or questions:
1. Check this documentation
2. Review example implementations in the codebase
3. Inspect browser console for errors
4. Query analytics tables directly for debugging
