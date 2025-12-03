# DeltaEDU - Contribution Guide

Welcome to the DeltaEDU project! This document outlines all the issues, bugs, and features that need attention. Each item includes file locations, current state, proposed solutions, and priority levels.

## Table of Contents
- [High Priority Issues](#high-priority-issues)
- [Medium Priority Issues](#medium-priority-issues)
- [Low Priority Issues](#low-priority-issues)
- [Database Schema Updates](#database-schema-updates)
- [Getting Started](#getting-started)

---

## HIGH PRIORITY ISSUES

### 1. Dashboard Statistics - All Placeholder Data
**Status:** Not Implemented
**Files:** `src/app/dashboard/page.tsx` (Lines 21-37, 141-177)
**Assigned To:** _Unassigned_

**Problem:**
- Dashboard displays stats for Notes Uploaded, Quizzes Completed, Study Time, and Average Score
- All values are hardcoded to 0
- No actual data fetching from the database

**Solution Steps:**
1. Create new API endpoint: `src/app/api/dashboard/stats/route.ts`
2. Implement the following queries:
   ```typescript
   // Get total notes count
   const { count: totalNotes } = await supabase
     .from('notes')
     .select('*', { count: 'exact', head: true })
     .eq('user_id', userId);

   // Get quizzes completed (needs quiz_results table)
   const { count: quizzesTaken } = await supabase
     .from('quiz_results')
     .select('*', { count: 'exact', head: true })
     .eq('user_id', userId)
     .not('completed_at', 'is', null);

   // Get average score
   const { data: scores } = await supabase
     .from('quiz_results')
     .select('score')
     .eq('user_id', userId);
   const averageScore = scores.reduce((a, b) => a + b.score, 0) / scores.length;

   // Get study time (needs study_sessions table)
   const { data: sessions } = await supabase
     .from('study_sessions')
     .select('duration')
     .eq('user_id', userId);
   const studyTime = sessions.reduce((a, b) => a + b.duration, 0);
   ```
3. Update dashboard page to fetch and display real stats
4. Add loading states and error handling

**Database Changes Needed:**
- Create `quiz_results` table
- Create `study_sessions` table

---

### 2. User Name Display Issue
**Status:** Bug
**Files:** `src/app/dashboard/page.tsx` (Line 133)
**Assigned To:** _Unassigned_

**Problem:**
- Dashboard shows: "Welcome back, Student!" instead of actual user name
- User data is fetched from localStorage but `full_name` field may be empty
- Inconsistency between registration field (`fullName`) and expected field (`full_name`)

**Solution Steps:**
1. Fix the welcome message fallback logic:
   ```typescript
   // Current (line 133)
   Welcome back, {user?.full_name || 'Student'}!

   // Better solution
   Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'Student'}!
   ```
2. Ensure registration properly stores `full_name` in profiles table
3. Update `src/app/api/auth/register/route.ts` to explicitly create/update profile with full_name
4. Verify the profile trigger in database is working correctly

---

### 3. Recent Activity Section - Non-Functional
**Status:** Not Implemented
**Files:** `src/app/dashboard/page.tsx` (Lines 236-246)
**Assigned To:** _Unassigned_

**Problem:**
- Shows static "No recent activity yet" message
- No data fetching or display logic implemented

**Solution Steps:**
1. Create database table for activities:
   ```sql
   CREATE TABLE user_activities (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     activity_type TEXT NOT NULL, -- 'note_upload', 'quiz_completed', 'chat_session'
     activity_data JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX idx_activities_user_created ON user_activities(user_id, created_at DESC);
   ```
2. Create API endpoint: `src/app/api/activity/recent/route.ts`
3. Track activities when users:
   - Upload notes
   - Complete quizzes
   - Have chat sessions
4. Update dashboard to fetch and display recent activities (last 5-10)
5. Add icons and formatting for different activity types

---

### 4. Authentication Issues - localStorage Only
**Status:** Security Issue
**Files:** `src/app/dashboard/page.tsx`, `src/app/api/auth/login/route.ts`
**Assigned To:** _Unassigned_

**Problem:**
- Authentication relies on localStorage (not secure)
- No proper session management
- Manual auth check on every protected page
- No middleware to protect routes
- Login API returns session but frontend doesn't use it

**Solution Steps:**
1. Create Next.js middleware for route protection: `src/middleware.ts`
   ```typescript
   import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   export async function middleware(req: NextRequest) {
     const res = NextResponse.next();
     const supabase = createMiddlewareClient({ req, res });
     const { data: { session } } = await supabase.auth.getSession();

     if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/login', req.url));
     }

     return res;
   }
   ```
2. Update login to use Supabase auth properly (store in httpOnly cookies)
3. Remove localStorage usage for authentication
4. Add session refresh logic
5. Implement proper logout that clears Supabase session

**Dependencies:**
- `npm install @supabase/auth-helpers-nextjs`

---

### 5. Quiz Generation - No Database Persistence
**Status:** Critical Bug
**Files:** `src/app/api/quiz/generate/route.ts`, `src/app/dashboard/quiz/[quizId]/page.tsx`
**Assigned To:** _Unassigned_

**Problem:**
- Quiz data stored only in localStorage
- Quizzes lost on browser clear or different device
- Can't track quiz history
- Quiz results not saved

**Solution Steps:**
1. Create database tables:
   ```sql
   CREATE TABLE quizzes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     topic TEXT NOT NULL,
     difficulty TEXT NOT NULL,
     questions JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE quiz_results (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     answers JSONB NOT NULL,
     score INTEGER NOT NULL,
     completed_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. Update `src/app/api/quiz/generate/route.ts` to save quiz to database
3. Update `src/app/dashboard/quiz/[quizId]/page.tsx` to fetch from database
4. Create quiz submission endpoint: `src/app/api/quiz/[id]/submit/route.ts`
5. Remove localStorage usage
6. Create quiz history page: `src/app/dashboard/quiz/history/page.tsx`

---

### 6. Missing Critical API Endpoints
**Status:** Not Implemented
**Assigned To:** _Unassigned_

**Endpoints Needed:**

1. **`/api/dashboard/stats`** - Dashboard statistics
2. **`/api/activity/recent`** - Recent activity feed
3. **`/api/quiz/[id]/route.ts`** - GET specific quiz, DELETE quiz
4. **`/api/quiz/[id]/submit/route.ts`** - POST quiz results
5. **`/api/quiz/history/route.ts`** - GET user's quiz history
6. **`/api/profile/route.ts`** - GET/PUT user profile
7. **`/api/notes/[id]/route.ts`** - Add PUT (update) and DELETE methods
8. **`/api/study-sessions/route.ts`** - POST/GET study time tracking

**Implementation Guide:**
- Each endpoint should include proper error handling
- Use `createAdminClient()` for server-side Supabase queries
- Verify user authorization before operations
- Return consistent JSON response format
- Add TypeScript types for request/response

---

### 7. No Rate Limiting
**Status:** Security Issue
**Files:** All API routes
**Assigned To:** _Unassigned_

**Problem:**
- No rate limiting on API endpoints
- Users can spam AI requests
- Could exceed Groq API quotas quickly

**Solution Steps:**
1. Install rate limiting package: `npm install @upstash/ratelimit @upstash/redis`
2. Set up Upstash Redis (free tier available)
3. Create rate limit middleware: `src/lib/ratelimit.ts`
   ```typescript
   import { Ratelimit } from '@upstash/ratelimit';
   import { Redis } from '@upstash/redis';

   export const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, '10 s'),
   });
   ```
4. Apply to expensive endpoints:
   - `/api/quiz/generate` - 5 requests per hour
   - `/api/chat` - 20 requests per minute
   - `/api/notes/upload` - 10 requests per hour
5. Return 429 status with helpful error message when limit exceeded

---

## MEDIUM PRIORITY ISSUES

### 8. Study Time Tracking - Not Implemented
**Status:** Not Implemented
**Files:** Need to create tracking system
**Assigned To:** _Unassigned_

**Problem:**
- Study Time stat exists but no tracking mechanism
- No session duration recording

**Solution Steps:**
1. Create database table:
   ```sql
   CREATE TABLE study_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     page_type TEXT NOT NULL, -- 'notes', 'tutor', 'quiz'
     duration INTEGER NOT NULL, -- in seconds
     started_at TIMESTAMPTZ NOT NULL,
     ended_at TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. Create tracking hook: `src/hooks/useStudyTimeTracker.ts`
   ```typescript
   // Track page visibility and active time
   // Use Page Visibility API
   // Send session data to API on unmount or visibility change
   ```
3. Integrate hook into pages:
   - `src/app/dashboard/notes/[id]/page.tsx`
   - `src/app/dashboard/tutor/page.tsx`
   - `src/app/dashboard/quiz/[quizId]/page.tsx`
4. Create API endpoint: `src/app/api/study-sessions/route.ts`

---

### 9. Notes Page - Incomplete Data Display
**Status:** Minor Bug
**Files:** `src/app/dashboard/notes/page.tsx` (Lines 17-24, 157-159)
**Assigned To:** _Unassigned_

**Problem:**
- Interface defines `file_count` but it's not calculated
- Shows "No description" but description isn't captured during upload

**Solution Steps:**
1. Remove `file_count` display or implement file tracking if needed
2. Add description field to upload form
3. Update `src/app/api/notes/upload/route.ts` to accept description
4. Display actual description or content preview instead of placeholder

---

### 10. Unused Components - Code Cleanup
**Status:** Code Debt
**Files:** `src/components/chat/ChatInterface.tsx`, `src/components/quiz/QuizComponent.tsx`
**Assigned To:** _Unassigned_

**Problem:**
- ChatInterface exists but tutor page has custom implementation
- QuizComponent exists but quiz pages have custom implementation
- Code duplication and confusion

**Solution Options:**
1. **Option A (Recommended):** Refactor pages to use the components
   - Update tutor page to use ChatInterface
   - Update quiz pages to use QuizComponent
   - Ensure components support all needed features
2. **Option B:** Remove unused components
   - Delete the files if not planning to use them
   - Simplifies codebase

---

### 11. Error Handling Gaps
**Status:** Code Quality
**Files:** Throughout codebase
**Assigned To:** _Unassigned_

**Problem:**
- Many `console.error()` calls with no user feedback
- Silent failures in API calls
- No global error boundary
- No retry logic for failed requests

**Solution Steps:**
1. Install toast library: `npm install react-hot-toast`
2. Create error boundary: `src/components/ErrorBoundary.tsx`
3. Add toast notifications for errors:
   ```typescript
   import toast from 'react-hot-toast';

   // In error handlers
   toast.error('Failed to load notes. Please try again.');
   ```
4. Add retry logic for transient failures
5. Create consistent error response format for APIs
6. Consider adding Sentry for error tracking

---

### 12. No File Storage for Uploads
**Status:** Feature Gap
**Files:** `src/app/api/notes/upload/route.ts`
**Assigned To:** _Unassigned_

**Problem:**
- Files are processed but not stored
- Only extracted text is saved
- Can't download original files later

**Solution Steps:**
1. Set up Supabase Storage bucket for files
2. Update upload API to:
   ```typescript
   // Upload file to Supabase Storage
   const { data: fileData, error: uploadError } = await supabase
     .storage
     .from('notes-files')
     .upload(`${userId}/${file.name}`, file);

   // Store file URL in database
   const fileUrl = supabase.storage
     .from('notes-files')
     .getPublicUrl(fileData.path).data.publicUrl;
   ```
3. Add file_url column to notes table
4. Add download button in notes detail page
5. Implement file deletion when note is deleted

---

### 13. No Search Functionality
**Status:** Feature Gap
**Files:** `src/app/dashboard/notes/page.tsx` (Lines 100-112)
**Assigned To:** _Unassigned_

**Problem:**
- Search bar exists but only filters locally
- No full-text search in note content

**Solution Steps:**
1. Add full-text search index to database:
   ```sql
   ALTER TABLE notes ADD COLUMN search_vector tsvector;

   CREATE INDEX idx_notes_search ON notes USING gin(search_vector);

   CREATE FUNCTION notes_search_trigger() RETURNS trigger AS $$
   BEGIN
     NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE
   ON notes FOR EACH ROW EXECUTE FUNCTION notes_search_trigger();
   ```
2. Create search API: `src/app/api/notes/search/route.ts`
3. Update notes page to use search API
4. Add search highlighting in results
5. Consider adding filters (date, topic, etc.)

---

### 14. Missing Progress Tracking Page
**Status:** Feature Gap
**Assigned To:** _Unassigned_

**Problem:**
- Homepage advertises "Track Progress" feature
- No dedicated progress/analytics page

**Solution Steps:**
1. Create page: `src/app/dashboard/progress/page.tsx`
2. Install chart library: `npm install recharts`
3. Create API endpoint: `src/app/api/progress/route.ts`
4. Display charts for:
   - Quiz scores over time (line chart)
   - Study time by week (bar chart)
   - Topics studied (pie chart)
   - Improvement trends
5. Add date range selector
6. Show insights and recommendations

---

### 15. WAEC/JAMB Features Incomplete
**Status:** Feature Gap
**Files:** `src/app/dashboard/quiz/generate/page.tsx`
**Assigned To:** _Unassigned_

**Problem:**
- Quiz difficulty includes "WAEC Standard" and "JAMB Standard"
- No actual difference in generated questions
- No exam-specific formats

**Solution Steps:**
1. Research WAEC and JAMB question formats
2. Update AI prompts in `src/app/api/quiz/generate/route.ts`:
   ```typescript
   if (difficulty === 'waec') {
     prompt += `\nFollow WAEC examination format:
     - Questions should align with WAEC syllabus
     - Include theory-style questions when applicable
     - Follow West African examination standards`;
   }

   if (difficulty === 'jamb') {
     prompt += `\nFollow JAMB UTME format:
     - Strict multiple choice format
     - 4 options per question
     - Align with JAMB syllabus
     - Include common JAMB question patterns`;
   }
   ```
3. Create exam-specific study guides
4. Add past questions database (optional)

---

### 16. Mobile Responsiveness Needs Testing
**Status:** Testing Needed
**Assigned To:** _Unassigned_

**Problem:**
- Chat interface may overflow on mobile
- Quiz navigation may not fit
- No mobile hamburger menu

**Solution Steps:**
1. Test all pages on mobile devices (320px, 375px, 768px)
2. Add hamburger menu to navigation
3. Fix overflow issues in:
   - Chat interface
   - Quiz taking page
   - Dashboard cards
4. Make tables responsive (use horizontal scroll or cards)
5. Test touch interactions (quiz selection, etc.)
6. Add `viewport` meta tag if missing

---

### 17. Environment Variables Not Validated
**Status:** Code Quality
**Assigned To:** _Unassigned_

**Problem:**
- No validation that required env vars exist
- Silent failures if keys missing

**Solution Steps:**
1. Create validation file: `src/lib/env.ts`
   ```typescript
   const requiredEnvVars = [
     'NEXT_PUBLIC_SUPABASE_URL',
     'NEXT_PUBLIC_SUPABASE_ANON_KEY',
     'SUPABASE_SERVICE_ROLE_KEY',
     'GROQ_API_KEY',
   ];

   export function validateEnv() {
     const missing = requiredEnvVars.filter(key => !process.env[key]);
     if (missing.length > 0) {
       throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
     }
   }
   ```
2. Call `validateEnv()` in `src/app/layout.tsx` or API routes
3. Add helpful error messages
4. Create comprehensive `.env.example` file

---

### 18. Accessibility Issues
**Status:** A11y Gap
**Assigned To:** _Unassigned_

**Problem:**
- Missing ARIA labels on interactive elements
- No keyboard navigation for quiz
- Color contrast may not meet WCAG standards

**Solution Steps:**
1. Add ARIA labels to all buttons without text:
   ```typescript
   <button aria-label="Close menu">
     <XIcon />
   </button>
   ```
2. Implement keyboard navigation in quiz:
   - Arrow keys to navigate questions
   - Enter to select answer
   - Tab for proper focus order
3. Test with screen reader (NVDA, JAWS, or VoiceOver)
4. Check color contrast ratios (use tools like WebAIM)
5. Add skip navigation links
6. Ensure all forms have proper labels

---

### 19. No Test Coverage
**Status:** Code Quality
**Assigned To:** _Unassigned_

**Problem:**
- No tests exist for components or API routes
- No CI/CD pipeline

**Solution Steps:**
1. Install testing dependencies:
   ```bash
   npm install -D jest @testing-library/react @testing-library/jest-dom
   npm install -D @testing-library/user-event jest-environment-jsdom
   ```
2. Create Jest config: `jest.config.js`
3. Write unit tests for key components:
   - ChatInterface
   - QuizComponent
   - Dashboard cards
4. Write integration tests for API routes
5. Set up GitHub Actions for CI
6. Add E2E tests with Playwright (optional)
7. Aim for 70%+ code coverage

---

## LOW PRIORITY ISSUES

### 20. Forgot Password - Non-Functional
**Status:** Feature Gap
**Files:** `src/app/login/page.tsx` (Line 104)
**Assigned To:** _Unassigned_

**Problem:**
- "Forgot password?" link points to non-existent page

**Solution Steps:**
1. Create page: `src/app/forgot-password/page.tsx`
2. Add form with email input
3. Use Supabase password reset:
   ```typescript
   const { error } = await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${window.location.origin}/reset-password`,
   });
   ```
4. Create reset password page: `src/app/reset-password/page.tsx`
5. Configure email templates in Supabase dashboard

---

### 21. Terms of Service & Privacy Policy Missing
**Status:** Legal Gap
**Files:** `src/app/register/page.tsx` (Line 186)
**Assigned To:** _Unassigned_

**Problem:**
- Registration mentions ToS and Privacy Policy
- No actual pages exist

**Solution Steps:**
1. Create page: `src/app/terms/page.tsx`
2. Create page: `src/app/privacy/page.tsx`
3. Add actual legal content or placeholders
4. Consider consulting with legal professional for proper terms
5. Add last updated date

---

### 22. Homepage Stats - Fake Data
**Status:** Marketing Issue
**Files:** `src/app/page.tsx` (Lines 81-92)
**Assigned To:** _Unassigned_

**Problem:**
- Shows "500+ Active Students", "2,000+ Notes" etc.
- All hardcoded and misleading

**Solution Options:**
1. Make it clear these are goals/projections
2. Fetch real aggregate stats from database
3. Remove stats section until significant user base
4. Use "Join our growing community" instead of specific numbers

---

### 23. Missing Study Groups Feature
**Status:** Feature Gap
**Files:** `src/app/page.tsx` (Line 135)
**Assigned To:** _Unassigned_

**Problem:**
- Homepage advertises "Study Groups" feature
- Feature doesn't exist

**Solution Options:**
1. **Remove from marketing** (quick fix)
2. **Implement feature:**
   - Add sharing functionality for notebooks
   - Create invite system
   - Add shared chat rooms
   - Implement collaborative quizzes
   - Add group management UI

---

### 24. No Offline Support
**Status:** PWA Enhancement
**Assigned To:** _Unassigned_

**Solution Steps:**
1. Add PWA manifest: `public/manifest.json`
2. Create service worker: `public/sw.js`
3. Cache uploaded notes for offline viewing
4. Show offline indicator
5. Queue actions when offline
6. Test offline functionality

---

### 25. No Analytics/Telemetry
**Status:** Product Enhancement
**Assigned To:** _Unassigned_

**Solution Steps:**
1. Choose analytics platform (PostHog, Plausible, or Google Analytics)
2. Install SDK and configure
3. Track key events:
   - User registration
   - Note uploads
   - Quiz completions
   - Chat sessions
4. Add performance monitoring
5. Set up error tracking (Sentry)
6. Respect user privacy (GDPR compliance)

---

### 26. No Content Moderation
**Status:** Safety Enhancement
**Assigned To:** _Unassigned_

**Problem:**
- Users can upload any content
- No filtering of inappropriate material

**Solution Steps:**
1. Add content filtering on upload
2. Check for inappropriate keywords
3. Add file type restrictions
4. Implement report/flag system
5. Add admin moderation dashboard
6. Consider using moderation API (like OpenAI Moderation)

---

## DATABASE SCHEMA UPDATES

Create a migration file: `database/migrations/001_missing_tables.sql`

```sql
-- User Activities Table
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_user_created ON user_activities(user_id, created_at DESC);

-- Study Sessions Table
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON study_sessions(user_id);

-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quizzes_user ON quizzes(user_id);

-- Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);

-- Add file_url to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS description TEXT;

-- Add search vector to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING gin(search_vector);

-- Trigger for search vector
CREATE OR REPLACE FUNCTION notes_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvector_update ON notes;
CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE
ON notes FOR EACH ROW EXECUTE FUNCTION notes_search_trigger();

-- RLS Policies for new tables
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own study sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz results"
  ON quiz_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results"
  ON quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## GETTING STARTED

### How to Pick a Task

1. **Check the Priority Level**
   - Start with HIGH priority issues for maximum impact
   - Medium priority for feature enhancements
   - Low priority for nice-to-haves

2. **Assign Yourself**
   - Edit this file and add your name to "Assigned To"
   - Create a branch: `git checkout -b feature/task-name`

3. **Implement the Solution**
   - Follow the solution steps provided
   - Write tests if applicable
   - Update documentation

4. **Create Pull Request**
   - Reference this issue in PR description
   - Request review from team
   - Update this file when merged (mark as "Done")

### Development Setup

```bash
# Clone the repository
git clone https://github.com/big14way/deltaedu.git
cd deltaedu

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your API keys

# Run database migrations
# (Run the SQL in database/migrations/ in Supabase dashboard)

# Start development server
npm run dev
```

### Code Standards

- Use TypeScript for type safety
- Follow existing code style (run `npm run lint`)
- Add comments for complex logic
- Write self-documenting code
- Add error handling for all API calls
- Use meaningful variable names

### Testing

- Write unit tests for new components
- Test API routes with integration tests
- Manual testing on Chrome, Safari, Firefox
- Test on mobile devices (iOS and Android)

### Questions?

- Open a GitHub issue for clarification
- Discuss in team Slack/Discord channel
- Review existing code for patterns

---

## Progress Tracking

| Issue # | Issue Name | Priority | Status | Assigned To | PR Link |
|---------|------------|----------|--------|-------------|---------|
| 1 | Dashboard Statistics | HIGH | Not Started | - | - |
| 2 | User Name Display | HIGH | Not Started | - | - |
| 3 | Recent Activity | HIGH | Not Started | - | - |
| 4 | Authentication Issues | HIGH | Not Started | - | - |
| 5 | Quiz DB Persistence | HIGH | Not Started | - | - |
| 6 | Missing API Endpoints | HIGH | Not Started | - | - |
| 7 | Rate Limiting | HIGH | Not Started | - | - |
| 8 | Study Time Tracking | MEDIUM | Not Started | - | - |
| 9 | Notes Page Data | MEDIUM | Not Started | - | - |
| 10 | Unused Components | MEDIUM | Not Started | - | - |
| 11 | Error Handling | MEDIUM | Not Started | - | - |
| 12 | File Storage | MEDIUM | Not Started | - | - |
| 13 | Search Functionality | MEDIUM | Not Started | - | - |
| 14 | Progress Tracking Page | MEDIUM | Not Started | - | - |
| 15 | WAEC/JAMB Features | MEDIUM | Not Started | - | - |
| 16 | Mobile Responsive | MEDIUM | Not Started | - | - |
| 17 | Env Validation | MEDIUM | Not Started | - | - |
| 18 | Accessibility | MEDIUM | Not Started | - | - |
| 19 | Test Coverage | MEDIUM | Not Started | - | - |
| 20 | Forgot Password | LOW | Not Started | - | - |
| 21 | Legal Pages | LOW | Not Started | - | - |
| 22 | Homepage Stats | LOW | Not Started | - | - |
| 23 | Study Groups | LOW | Not Started | - | - |
| 24 | Offline Support | LOW | Not Started | - | - |
| 25 | Analytics | LOW | Not Started | - | - |
| 26 | Content Moderation | LOW | Not Started | - | - |

---

**Last Updated:** 2025-12-02
**Total Issues:** 26
**Completed:** 0
**In Progress:** 0
**Not Started:** 26
