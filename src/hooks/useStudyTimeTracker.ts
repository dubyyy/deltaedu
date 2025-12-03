// src/hooks/useStudyTimeTracker.ts
import { useEffect, useRef } from 'react';

interface UseStudyTimeTrackerProps {
  userId: string | null;
  pageType: 'notes' | 'tutor' | 'quiz';
  noteId?: string;
  enabled?: boolean;
}

export function useStudyTimeTracker({
  userId,
  pageType,
  noteId,
  enabled = true,
}: UseStudyTimeTrackerProps) {
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (!userId || !enabled) return;

    // Start tracking time
    startTimeRef.current = new Date();
    isActiveRef.current = true;

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - pause tracking
        isActiveRef.current = false;
      } else {
        // Page is visible again - resume tracking
        isActiveRef.current = true;
        startTimeRef.current = new Date(); // Reset start time
      }
    };

    // Handle beforeunload to save session before leaving
    const handleBeforeUnload = async () => {
      if (startTimeRef.current && isActiveRef.current) {
        const endTime = new Date();
        const duration = Math.floor(
          (endTime.getTime() - startTimeRef.current.getTime()) / 1000
        );

        // Only log if duration is at least 5 seconds (to avoid noise)
        if (duration >= 5) {
          // Use sendBeacon for reliable delivery on page unload
          const data = {
            user_id: userId,
            page_type: pageType,
            note_id: noteId,
            duration,
            started_at: startTimeRef.current.toISOString(),
            ended_at: endTime.toISOString(),
          };

          // Try sendBeacon first (more reliable on page unload)
          const blob = new Blob([JSON.stringify(data)], {
            type: 'application/json',
          });
          navigator.sendBeacon('/api/study-sessions', blob);
        }
      }
    };

    // Auto-save every 5 minutes for long sessions
    const autoSaveInterval = setInterval(() => {
      if (startTimeRef.current && isActiveRef.current) {
        const now = new Date();
        const duration = Math.floor(
          (now.getTime() - startTimeRef.current.getTime()) / 1000
        );

        if (duration >= 30) {
          // Save session
          fetch('/api/study-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              page_type: pageType,
              note_id: noteId,
              duration,
              started_at: startTimeRef.current.toISOString(),
              ended_at: now.toISOString(),
            }),
          }).catch((error) => {
            console.error('Failed to save study session:', error);
          });

          // Reset start time for next interval
          startTimeRef.current = new Date();
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    intervalRef.current = autoSaveInterval;

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Save final session on unmount
      if (startTimeRef.current && isActiveRef.current) {
        const endTime = new Date();
        const duration = Math.floor(
          (endTime.getTime() - startTimeRef.current.getTime()) / 1000
        );

        if (duration >= 5) {
          fetch('/api/study-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              page_type: pageType,
              note_id: noteId,
              duration,
              started_at: startTimeRef.current.toISOString(),
              ended_at: endTime.toISOString(),
            }),
          }).catch((error) => {
            console.error('Failed to save final study session:', error);
          });
        }
      }
    };
  }, [userId, pageType, noteId, enabled]);
}
