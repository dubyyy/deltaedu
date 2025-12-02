// src/lib/analytics.ts
/**
 * Analytics tracking utility for DeltaEdu
 * Supports multiple analytics providers (PostHog, Mixpanel, custom DB)
 */

// Event types for type-safe tracking
export enum AnalyticsEvent {
  // Authentication Events
  USER_SIGNED_UP = 'user_signed_up',
  USER_LOGGED_IN = 'user_logged_in',
  USER_LOGGED_OUT = 'user_logged_out',
  
  // Note Events
  NOTE_UPLOADED = 'note_uploaded',
  NOTE_VIEWED = 'note_viewed',
  NOTE_EDITED = 'note_edited',
  NOTE_DELETED = 'note_deleted',
  NOTE_SUMMARY_GENERATED = 'note_summary_generated',
  
  // Quiz Events
  QUIZ_GENERATED = 'quiz_generated',
  QUIZ_STARTED = 'quiz_started',
  QUIZ_COMPLETED = 'quiz_completed',
  QUIZ_QUESTION_ANSWERED = 'quiz_question_answered',
  
  // AI Tutor Events
  TUTOR_MESSAGE_SENT = 'tutor_message_sent',
  TUTOR_SESSION_STARTED = 'tutor_session_started',
  TUTOR_SESSION_ENDED = 'tutor_session_ended',
  
  // Feature Usage
  FEATURE_ACCESSED = 'feature_accessed',
  PAGE_VIEWED = 'page_viewed',
  SEARCH_PERFORMED = 'search_performed',
  
  // Errors
  ERROR_OCCURRED = 'error_occurred',
  UPLOAD_FAILED = 'upload_failed',
  MODERATION_FAILED = 'moderation_failed',
  
  // Engagement
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  TIME_ON_PAGE = 'time_on_page',
}

// Event properties interface
export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

// User properties interface
export interface UserProperties {
  user_id?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: string | number | boolean | null | undefined;
}

// Analytics configuration
interface AnalyticsConfig {
  enabled: boolean;
  providers: {
    posthog?: {
      apiKey: string;
      host?: string;
    };
    mixpanel?: {
      token: string;
    };
    database?: boolean; // Store in our own database
  };
  debug?: boolean;
}

class AnalyticsManager {
  private config: AnalyticsConfig;
  private isInitialized = false;
  private sessionId: string | null = null;
  private sessionStartTime: number | null = null;
  private pageStartTime: number | null = null;
  private currentPage: string | null = null;

  constructor() {
    this.config = {
      enabled: true,
      providers: {
        database: true, // Always use database tracking
      },
      debug: process.env.NODE_ENV === 'development',
    };
  }

  /**
   * Initialize analytics with configuration
   */
  init(config?: Partial<AnalyticsConfig>) {
    if (this.isInitialized) return;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Generate session ID
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    // Initialize providers
    if (typeof window !== 'undefined') {
      this.initializeClientSideProviders();
    }

    this.isInitialized = true;
    this.log('Analytics initialized', this.config);
  }

  /**
   * Initialize client-side analytics providers (PostHog, Mixpanel, etc.)
   */
  private initializeClientSideProviders() {
    // PostHog initialization (if configured)
    if (this.config.providers.posthog?.apiKey) {
      this.initPostHog();
    }

    // Mixpanel initialization (if configured)
    if (this.config.providers.mixpanel?.token) {
      this.initMixpanel();
    }
  }

  /**
   * Initialize PostHog
   */
  private initPostHog() {
    try {
      // PostHog will be loaded via script tag in layout
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.init(
          this.config.providers.posthog?.apiKey,
          {
            api_host: this.config.providers.posthog?.host || 'https://app.posthog.com',
            loaded: (posthog: any) => {
              this.log('PostHog initialized');
            },
          }
        );
      }
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  /**
   * Initialize Mixpanel
   */
  private initMixpanel() {
    try {
      if (typeof window !== 'undefined' && (window as any).mixpanel) {
        (window as any).mixpanel.init(this.config.providers.mixpanel?.token);
        this.log('Mixpanel initialized');
      }
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Track an event
   */
  track(
    event: AnalyticsEvent | string,
    properties?: EventProperties,
    userProperties?: UserProperties
  ) {
    if (!this.config.enabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        session_id: this.sessionId,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
      user: userProperties,
    };

    this.log('Track event:', eventData);

    // Send to different providers
    this.sendToProviders(eventData);

    // Store in database
    if (this.config.providers.database) {
      this.sendToDatabase(eventData);
    }
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: UserProperties) {
    if (!this.config.enabled) return;

    this.log('Identify user:', userId, properties);

    // PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.identify(userId, properties);
    }

    // Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      if (properties) {
        (window as any).mixpanel.people.set(properties);
      }
    }

    // Database
    if (this.config.providers.database) {
      this.sendToDatabase({
        type: 'identify',
        user_id: userId,
        properties,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Track page view
   */
  page(name?: string, properties?: EventProperties) {
    if (!this.config.enabled) return;

    // Track time on previous page
    if (this.currentPage && this.pageStartTime) {
      const timeOnPage = Date.now() - this.pageStartTime;
      this.track(AnalyticsEvent.TIME_ON_PAGE, {
        page: this.currentPage,
        duration_ms: timeOnPage,
        duration_seconds: Math.round(timeOnPage / 1000),
      });
    }

    // Track new page view
    const pageName = name || (typeof window !== 'undefined' ? window.location.pathname : 'unknown');
    this.currentPage = pageName;
    this.pageStartTime = Date.now();

    this.track(AnalyticsEvent.PAGE_VIEWED, {
      page: pageName,
      ...properties,
    });

    this.log('Page view:', pageName);

    // PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('$pageview', { page: pageName, ...properties });
    }

    // Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track('Page View', { page: pageName, ...properties });
    }
  }

  /**
   * Start tracking session
   */
  startSession(userId?: string) {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    this.track(AnalyticsEvent.SESSION_STARTED, {
      user_id: userId,
    });
  }

  /**
   * End tracking session
   */
  endSession(userId?: string) {
    if (this.sessionStartTime) {
      const sessionDuration = Date.now() - this.sessionStartTime;
      this.track(AnalyticsEvent.SESSION_ENDED, {
        user_id: userId,
        duration_ms: sessionDuration,
        duration_minutes: Math.round(sessionDuration / 60000),
      });
    }

    this.sessionId = null;
    this.sessionStartTime = null;
  }

  /**
   * Send event to all enabled providers
   */
  private sendToProviders(eventData: any) {
    // PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(eventData.event, eventData.properties);
    }

    // Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(eventData.event, eventData.properties);
    }
  }

  /**
   * Send event to database
   */
  private async sendToDatabase(eventData: any) {
    try {
      // Send to our backend API for database storage
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
        // Don't wait for response to avoid blocking
        keepalive: true,
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience
      if (this.config.debug) {
        console.error('Failed to send analytics to database:', error);
      }
    }
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }

  /**
   * Reset analytics (useful for logout)
   */
  reset() {
    this.sessionId = null;
    this.sessionStartTime = null;
    this.pageStartTime = null;
    this.currentPage = null;

    // PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.reset();
    }

    // Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.reset();
    }

    this.log('Analytics reset');
  }
}

// Export singleton instance
export const analytics = new AnalyticsManager();

// Helper functions for common events
export const trackUserSignUp = (userId: string, email: string, method?: string) => {
  analytics.identify(userId, { email });
  analytics.track(AnalyticsEvent.USER_SIGNED_UP, { method: method || 'email' });
};

export const trackUserLogin = (userId: string, email: string, method?: string) => {
  analytics.identify(userId, { email });
  analytics.track(AnalyticsEvent.USER_LOGGED_IN, { method: method || 'email' });
};

export const trackUserLogout = (userId?: string) => {
  analytics.track(AnalyticsEvent.USER_LOGGED_OUT, { user_id: userId });
  analytics.reset();
};

export const trackNoteUpload = (noteId: string, fileType: string, fileSize: number) => {
  analytics.track(AnalyticsEvent.NOTE_UPLOADED, {
    note_id: noteId,
    file_type: fileType,
    file_size: fileSize,
  });
};

export const trackNoteView = (noteId: string, noteTitle: string) => {
  analytics.track(AnalyticsEvent.NOTE_VIEWED, {
    note_id: noteId,
    note_title: noteTitle,
  });
};

export const trackQuizGenerated = (quizId: string, noteId: string, questionCount: number) => {
  analytics.track(AnalyticsEvent.QUIZ_GENERATED, {
    quiz_id: quizId,
    note_id: noteId,
    question_count: questionCount,
  });
};

export const trackQuizCompleted = (
  quizId: string,
  score: number,
  totalQuestions: number,
  timeSpent: number
) => {
  analytics.track(AnalyticsEvent.QUIZ_COMPLETED, {
    quiz_id: quizId,
    score,
    total_questions: totalQuestions,
    time_spent_seconds: timeSpent,
    percentage: Math.round((score / totalQuestions) * 100),
  });
};

export const trackTutorMessage = (messageId: string, messageLength: number) => {
  analytics.track(AnalyticsEvent.TUTOR_MESSAGE_SENT, {
    message_id: messageId,
    message_length: messageLength,
  });
};

export const trackError = (error: string, context?: string, fatal?: boolean) => {
  analytics.track(AnalyticsEvent.ERROR_OCCURRED, {
    error,
    context,
    fatal: fatal || false,
  });
};

export const trackFeatureAccess = (feature: string, action?: string) => {
  analytics.track(AnalyticsEvent.FEATURE_ACCESSED, {
    feature,
    action,
  });
};
