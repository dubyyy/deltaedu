// src/hooks/useAnalytics.ts
'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { analytics, AnalyticsEvent, EventProperties } from '@/lib/analytics';

/**
 * Hook for using analytics in React components
 */
export function useAnalytics() {
  const pathname = usePathname();

  // Track page views automatically
  useEffect(() => {
    analytics.page(pathname);
  }, [pathname]);

  // Track events
  const trackEvent = useCallback((
    event: AnalyticsEvent | string,
    properties?: EventProperties
  ) => {
    analytics.track(event, properties);
  }, []);

  return {
    trackEvent,
    analytics,
  };
}

/**
 * Hook for tracking page time
 */
export function usePageTracking(pageName?: string) {
  const pathname = usePathname();
  const page = pageName || pathname;

  useEffect(() => {
    const startTime = Date.now();

    analytics.page(page);

    return () => {
      const timeSpent = Date.now() - startTime;
      analytics.track(AnalyticsEvent.TIME_ON_PAGE, {
        page,
        duration_ms: timeSpent,
        duration_seconds: Math.round(timeSpent / 1000),
      });
    };
  }, [page]);
}

/**
 * Hook for initializing analytics on app load
 */
export function useAnalyticsInit() {
  useEffect(() => {
    // Initialize analytics
    analytics.init({
      enabled: true,
      providers: {
        database: true,
        // Add PostHog or Mixpanel config from env
        posthog: process.env.NEXT_PUBLIC_POSTHOG_KEY ? {
          apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
          host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        } : undefined,
      },
      debug: process.env.NODE_ENV === 'development',
    });

    // Track session start
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        analytics.startSession(userData.id);
        analytics.identify(userData.id, {
          email: userData.email,
          name: userData.full_name,
        });
      } catch (error) {
        console.error('Failed to parse user data for analytics:', error);
      }
    }

    // Track session end on page unload
    const handleUnload = () => {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          analytics.endSession(userData.id);
        } catch (error) {
          // Silently fail
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);
}
