# Analytics Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migration

Apply the analytics tables to your Supabase database:

```bash
# Option A: Using Supabase CLI
supabase migration up

# Option B: Using SQL directly
# Copy the contents of supabase/migrations/003_analytics_tables.sql
# and run it in your Supabase SQL Editor
```

### Step 2: Verify Installation

The analytics system is **already integrated** into your app! Check that it's working:

1. Start your development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Open browser console (F12) and look for:
```
[Analytics] Analytics initialized
```

### Step 3: Test Tracking

Try these actions to see analytics in action:

1. **Sign up** for a new account → Tracks `user_signed_up`
2. **Log in** → Tracks `user_logged_in`
3. **Upload a note** → Tracks `note_uploaded`
4. **View dashboard** → Tracks `page_viewed`

### Step 4: View Your Analytics

#### In the Dashboard
Visit http://localhost:3000/dashboard to see:
- Total Notes Uploaded
- Quizzes Taken
- Study Time (hours)
- Average Quiz Score

#### In the Database
Query your analytics in Supabase SQL Editor:

```sql
-- See all your events
SELECT * FROM analytics_events 
ORDER BY timestamp DESC 
LIMIT 10;

-- See user summary
SELECT * FROM analytics_daily_summary
WHERE user_id = 'your-user-id'
ORDER BY date DESC;
```

## 📊 What's Being Tracked

### ✅ Already Integrated

These events are automatically tracked:

| Event | Where | Trigger |
|-------|-------|---------|
| `user_signed_up` | Register page | New account created |
| `user_logged_in` | Login page | Successful login |
| `user_logged_out` | Dashboard | User logs out |
| `note_uploaded` | Upload page | File successfully uploaded |
| `page_viewed` | All pages | Page navigation |
| `session_started` | App root | User opens app |
| `session_ended` | App root | User closes app |
| `error_occurred` | Various | Any error happens |

### 🔜 Ready to Add

These tracking functions are available but need integration:

```typescript
// Notes
trackNoteView(noteId, noteTitle)
trackNoteEdit(noteId)
trackNoteDelete(noteId)

// Quizzes
trackQuizGenerated(quizId, noteId, questionCount)
trackQuizStarted(quizId)
trackQuizCompleted(quizId, score, total, timeSpent)

// AI Tutor
trackTutorMessage(messageId, messageLength)
trackTutorSessionStarted()
trackTutorSessionEnded()

// Features
trackFeatureAccess(feature, action)
```

## 🎯 Common Use Cases

### Track Button Clicks

```tsx
import { analytics, AnalyticsEvent } from '@/lib/analytics';

function MyButton() {
  const handleClick = () => {
    analytics.track(AnalyticsEvent.FEATURE_ACCESSED, {
      feature: 'export_notes',
      button_location: 'sidebar'
    });
    
    // Your button logic...
  };
  
  return <button onClick={handleClick}>Export Notes</button>;
}
```

### Track Form Submissions

```tsx
const handleSubmit = async (data) => {
  try {
    await submitForm(data);
    
    // Track success
    analytics.track('form_submitted', {
      form_name: 'feedback',
      fields_filled: Object.keys(data).length
    });
  } catch (error) {
    // Track failure
    trackError('form_submission_failed', error.message);
  }
};
```

### Track Feature Usage

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

function QuizGenerator() {
  const { trackEvent } = useAnalytics();
  
  const generateQuiz = () => {
    trackEvent(AnalyticsEvent.QUIZ_GENERATED, {
      note_id: noteId,
      question_count: 10,
      difficulty: 'medium'
    });
    
    // Generate quiz...
  };
}
```

## 📈 View Analytics Dashboard

### Current Stats (Already Working!)

Your dashboard at `/dashboard` shows:
- **Total Notes** - All notes you've uploaded
- **Quizzes Taken** - Completed quizzes
- **Study Time** - Total hours studied
- **Average Score** - Your quiz performance

### Advanced Queries

Run these in Supabase SQL Editor:

**Most used features**:
```sql
SELECT 
  event_name,
  COUNT(*) as usage_count
FROM analytics_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY event_name
ORDER BY usage_count DESC;
```

**Your study pattern**:
```sql
SELECT 
  EXTRACT(HOUR FROM timestamp) as hour_of_day,
  COUNT(*) as events
FROM analytics_events
WHERE user_id = 'your-user-id'
GROUP BY hour_of_day
ORDER BY hour_of_day;
```

**Quiz performance over time**:
```sql
SELECT 
  DATE(timestamp) as date,
  AVG((properties->>'percentage')::numeric) as avg_score
FROM analytics_events
WHERE event_name = 'quiz_completed'
  AND user_id = 'your-user-id'
GROUP BY DATE(timestamp)
ORDER BY date;
```

## 🔧 Optional: Add External Analytics

### PostHog (Recommended)

1. Sign up at https://posthog.com (free tier available)
2. Get your API key
3. Add to `.env.local`:
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```
4. Restart your dev server
5. View events in PostHog dashboard

### Mixpanel

1. Sign up at https://mixpanel.com
2. Get your project token
3. Add to `.env.local`:
```env
NEXT_PUBLIC_MIXPANEL_TOKEN=your_token_here
```
4. Restart your dev server
5. View events in Mixpanel dashboard

## 🐛 Troubleshooting

### Not seeing events in database?

1. Check Supabase connection:
```bash
# Test connection
curl https://your-project.supabase.co/rest/v1/analytics_events \
  -H "apikey: your-anon-key"
```

2. Check RLS policies in Supabase:
- Go to Authentication > Policies
- Ensure `analytics_events` has INSERT policy

3. Check browser console for errors

### Dashboard shows 0 for all stats?

1. **Upload some content first** - Stats only show after you use features
2. **Check time range** - Default is 30 days
3. **Verify user ID matches** - Check localStorage user data

### Events tracked but not displayed?

1. **Refresh materialized view**:
```sql
SELECT refresh_analytics_summary();
```

2. **Check API response**:
```bash
curl http://localhost:3000/api/analytics/stats?range=30d
```

## 🎓 Next Steps

1. **Explore the full guide**: See `ANALYTICS_GUIDE.md` for advanced features
2. **Add custom tracking**: Track specific features in your app
3. **Set up alerts**: Monitor for unusual patterns
4. **Build reports**: Create custom analytics dashboards
5. **Export data**: Use analytics for insights and improvements

## 📚 Resources

- **Full Documentation**: `ANALYTICS_GUIDE.md`
- **Migration Script**: `supabase/migrations/003_analytics_tables.sql`
- **Analytics Library**: `src/lib/analytics.ts`
- **React Hooks**: `src/hooks/useAnalytics.ts`
- **API Endpoints**: `src/app/api/analytics/`

## ✅ Checklist

- [ ] Database migration applied
- [ ] Can see analytics in browser console
- [ ] Signed up/logged in (tracked)
- [ ] Dashboard shows stats
- [ ] Can query analytics_events table
- [ ] (Optional) PostHog/Mixpanel configured

## 💡 Pro Tips

1. **Use debug mode** in development:
   - Look for `[Analytics]` logs in console
   - Verify each event is tracked correctly

2. **Test thoroughly** before production:
   - Sign up → Login → Upload → Quiz → Logout
   - Check each event appears in database

3. **Monitor performance**:
   - Analytics shouldn't slow down your app
   - All tracking is async and non-blocking

4. **Privacy first**:
   - Don't track sensitive data
   - Respect user privacy preferences
   - Be transparent about data collection

---

**Questions?** Check the full `ANALYTICS_GUIDE.md` or inspect the code in `src/lib/analytics.ts`
