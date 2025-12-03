#!/bin/bash

# MEDIUM Priority Issues
gh issue create --title "[MEDIUM] Study Time Tracking - Not Implemented" --body "**Priority:** MEDIUM

Study Time stat displays but no tracking mechanism exists. Need to create study_sessions table and tracking hook. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#8-study-time-tracking---not-implemented)"

gh issue create --title "[MEDIUM] Notes Page - Incomplete Data" --body "**Priority:** MEDIUM

Description field shows placeholder. Need to add description capture in upload form. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#9-notes-page---incomplete-data-display)"

gh issue create --title "[MEDIUM] Unused Components - Code Cleanup" --body "**Priority:** MEDIUM

ChatInterface and QuizComponent exist but unused. Either refactor pages to use them or remove. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#10-unused-components---code-cleanup)"

gh issue create --title "[MEDIUM] Error Handling Gaps Throughout Codebase" --body "**Priority:** MEDIUM

Many console.error() with no user feedback. Need toast notifications, error boundary, retry logic. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#11-error-handling-gaps)"

gh issue create --title "[MEDIUM] No File Storage for Uploads" --body "**Priority:** MEDIUM

Files processed but not stored. Only text extracted. Need Supabase Storage integration. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#12-no-file-storage-for-uploads)"

gh issue create --title "[MEDIUM] No Search Functionality" --body "**Priority:** MEDIUM

Search bar exists but only filters locally. Need full-text search with PostgreSQL. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#13-no-search-functionality)"

gh issue create --title "[MEDIUM] Missing Progress Tracking Page" --body "**Priority:** MEDIUM

Homepage advertises progress tracking but no page exists. Need charts for quiz scores, study time, topics. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#14-missing-progress-tracking-page)"

gh issue create --title "[MEDIUM] WAEC/JAMB Features Incomplete" --body "**Priority:** MEDIUM

Difficulty options exist but no actual difference in questions. Need exam-specific prompts. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#15-waecjamb-features-incomplete)"

gh issue create --title "[MEDIUM] Mobile Responsiveness Needs Testing" --body "**Priority:** MEDIUM

No mobile hamburger menu. Chat/quiz may overflow. Need responsive testing. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#16-mobile-responsiveness-needs-testing)"

gh issue create --title "[MEDIUM] Environment Variables Not Validated" --body "**Priority:** MEDIUM

No validation of required env vars. Silent failures possible. Need env validation. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#17-environment-variables-not-validated)"

gh issue create --title "[MEDIUM] Accessibility Issues" --body "**Priority:** MEDIUM

Missing ARIA labels, no keyboard navigation for quiz, color contrast issues. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#18-accessibility-issues)"

gh issue create --title "[MEDIUM] No Test Coverage" --body "**Priority:** MEDIUM

No tests for components or API routes. No CI/CD. Need Jest setup. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#19-no-test-coverage)"

# LOW Priority Issues
gh issue create --title "[LOW] Forgot Password - Non-Functional" --body "**Priority:** LOW

Link exists but page doesn't. Need password reset flow. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#20-forgot-password---non-functional)"

gh issue create --title "[LOW] Terms of Service & Privacy Policy Missing" --body "**Priority:** LOW

Registration mentions ToS/Privacy but pages don't exist. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#21-terms-of-service--privacy-policy-missing)"

gh issue create --title "[LOW] Homepage Stats - Fake Data" --body "**Priority:** LOW

Shows hardcoded student/note counts. Misleading marketing. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#22-homepage-stats---fake-data)"

gh issue create --title "[LOW] Missing Study Groups Feature" --body "**Priority:** LOW

Homepage advertises but feature doesn't exist. Remove or implement. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#23-missing-study-groups-feature)"

gh issue create --title "[LOW] No Offline Support" --body "**Priority:** LOW

No PWA support, service worker, or caching. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#24-no-offline-support)"

gh issue create --title "[LOW] No Analytics/Telemetry" --body "**Priority:** LOW

Can't track feature usage or user behavior. Need analytics integration. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#25-no-analyticstellemetry)"

gh issue create --title "[LOW] No Content Moderation" --body "**Priority:** LOW

Users can upload any content. Need filtering and moderation. See [CONTRIBUTING.md](https://github.com/big14way/deltaedu/blob/main/CONTRIBUTING.md#26-no-content-moderation)"

echo "✅ All issues created successfully!"
