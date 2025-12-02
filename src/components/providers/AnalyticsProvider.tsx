// src/components/providers/AnalyticsProvider.tsx
'use client';

import { useAnalyticsInit } from '@/hooks/useAnalytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalyticsInit();
  return <>{children}</>;
}
