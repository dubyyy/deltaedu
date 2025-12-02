// src/lib/moderation.ts
import { openai } from './openai';

export interface ModerationResult {
  safe: boolean;
  flagged: boolean;
  categories: string[];
  reason?: string;
}

// Allowed file types and their MIME types
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
};

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Minimum and maximum content length
export const MIN_CONTENT_LENGTH = 10;
export const MAX_CONTENT_LENGTH = 100000; // ~100k characters

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload PDF, DOCX, DOC, or TXT files.',
    };
  }

  // Check for suspicious file extensions
  const fileName = file.name.toLowerCase();
  const hasDoubleExtension = (fileName.match(/\./g) || []).length > 1;
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.dll', '.scr', '.js', '.vbs'];
  
  if (hasDoubleExtension || suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
    return {
      valid: false,
      error: 'Suspicious file detected. Please ensure you are uploading a valid document.',
    };
  }

  return { valid: true };
}

/**
 * Moderate text content using OpenAI Moderation API
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    // Check content length
    if (text.length < MIN_CONTENT_LENGTH) {
      return {
        safe: false,
        flagged: true,
        categories: ['insufficient-content'],
        reason: 'Content is too short to be meaningful',
      };
    }

    if (text.length > MAX_CONTENT_LENGTH) {
      return {
        safe: false,
        flagged: true,
        categories: ['excessive-content'],
        reason: 'Content exceeds maximum allowed length',
      };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /(<script|javascript:|onerror=|onclick=)/gi, // Script injection
      /(eval\(|exec\(|system\()/gi, // Code execution
      /([\x00-\x08\x0B\x0C\x0E-\x1F])/g, // Control characters
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        return {
          safe: false,
          flagged: true,
          categories: ['malicious-content'],
          reason: 'Content contains potentially malicious patterns',
        };
      }
    }

    // Use OpenAI Moderation API for content safety
    const moderation = await openai.moderations.create({
      input: text.slice(0, 32000), // OpenAI moderation has a token limit
    });

    const result = moderation.results[0];
    
    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);

      return {
        safe: false,
        flagged: true,
        categories: flaggedCategories,
        reason: 'Content violates community guidelines and cannot be uploaded',
      };
    }

    return {
      safe: true,
      flagged: false,
      categories: [],
    };
  } catch (error) {
    console.error('Moderation error:', error);
    // In case of API failure, apply basic checks and allow through
    // (better than blocking all uploads if API is down)
    
    // Still check for obvious malicious patterns
    const hasScriptTag = /<script/gi.test(text);
    const hasExcessiveNulls = (text.match(/\0/g) || []).length > 10;
    
    if (hasScriptTag || hasExcessiveNulls) {
      return {
        safe: false,
        flagged: true,
        categories: ['malicious-content'],
        reason: 'Content contains suspicious patterns',
      };
    }

    // Allow content if moderation API fails and no obvious issues
    return {
      safe: true,
      flagged: false,
      categories: [],
    };
  }
}

/**
 * Sanitize text content by removing problematic characters
 */
export function sanitizeContent(text: string): string {
  // Remove null bytes and other problematic characters for PostgreSQL
  let sanitized = text.replace(/\u0000/g, '').replace(/\0/g, '');
  
  // Remove other control characters except newline, tab, carriage return
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  
  // Clean up excessive whitespace
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n').trim();
  
  // Remove potential script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized;
}

/**
 * Check if user has exceeded rate limit (basic implementation)
 * In production, use Redis or similar for distributed rate limiting
 */
const uploadHistory = new Map<string, number[]>();

export function checkRateLimit(userId: string, maxUploads: number = 20, windowMs: number = 60000): { allowed: boolean; error?: string } {
  const now = Date.now();
  const userUploads = uploadHistory.get(userId) || [];
  
  // Filter uploads within the time window
  const recentUploads = userUploads.filter(timestamp => now - timestamp < windowMs);
  
  if (recentUploads.length >= maxUploads) {
    return {
      allowed: false,
      error: `Rate limit exceeded. Maximum ${maxUploads} uploads per minute.`,
    };
  }
  
  // Add current upload
  recentUploads.push(now);
  uploadHistory.set(userId, recentUploads);
  
  // Cleanup old entries periodically
  if (uploadHistory.size > 1000) {
    for (const [key, timestamps] of uploadHistory.entries()) {
      const recent = timestamps.filter(t => now - t < windowMs * 2);
      if (recent.length === 0) {
        uploadHistory.delete(key);
      } else {
        uploadHistory.set(key, recent);
      }
    }
  }
  
  return { allowed: true };
}
