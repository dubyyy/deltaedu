# Content Moderation & Filtering System

## Overview
DeltaEdu now includes a comprehensive content filtering and moderation system to protect users and ensure safe, appropriate content uploads.

## Features Implemented

### 1. **File Validation** (`src/lib/moderation.ts`)
- **File type restrictions**: Only allows PDF, DOCX, DOC, and TXT files
- **Size limits**: Maximum 10MB per file
- **Suspicious file detection**: Blocks files with double extensions or executable extensions
- **MIME type validation**: Verifies file types match allowed formats

### 2. **Content Moderation** (AI-Powered)
Uses OpenAI's Moderation API to detect:
- **Hate speech and harassment**
- **Sexual content**
- **Violence and graphic content**
- **Self-harm references**
- **Illegal activities**

### 3. **Malicious Content Detection**
Scans for potentially harmful patterns:
- Script injection attempts (`<script>`, `javascript:`)
- Code execution patterns (`eval()`, `exec()`, `system()`)
- Control characters and null bytes
- SQL injection attempts

### 4. **Content Sanitization**
Automatically cleans uploaded content by:
- Removing null bytes and control characters
- Stripping script tags and event handlers
- Cleaning excessive whitespace
- Ensuring PostgreSQL compatibility

### 5. **Rate Limiting**
- **Default**: 20 uploads per minute per user
- **Purpose**: Prevents spam and API abuse
- **Configurable**: Can be adjusted in `checkRateLimit()` function

## Implementation Details

### Modified Files

#### Backend (API Routes)
1. **`src/lib/moderation.ts`** - Core moderation utilities
   - `validateFile()` - File type and size validation
   - `moderateContent()` - AI-powered content moderation
   - `sanitizeContent()` - Content cleaning and sanitization
   - `checkRateLimit()` - Rate limiting functionality

2. **`src/app/api/upload/route.ts`** - File upload endpoint
   - Integrated rate limiting
   - Added file validation
   - Added content moderation checks
   - Improved error handling

3. **`src/app/api/notes/upload/route.ts`** - Notes upload endpoint
   - Same moderation features as above
   - Multi-file validation
   - Combined content moderation

#### Frontend (Components)
1. **`src/app/dashboard/notes/upload/page.tsx`** - Upload page
   - Enhanced error messages for moderation failures
   - User-friendly rate limit notifications

2. **`src/components/upload/FileUploader.tsx`** - File upload component
   - Improved error handling
   - Clear feedback on moderation issues

## Error Handling

### User-Facing Error Messages
- **Rate limit exceeded**: "Too many uploads. Please wait a minute and try again."
- **Content violation**: "Content violates community guidelines. Please review your files."
- **Invalid file type**: "File type not supported. Please upload PDF, DOCX, DOC, or TXT files."
- **File too large**: "File size must be less than 10MB"
- **Malicious content**: "Content contains potentially malicious patterns"

### HTTP Status Codes
- `400` - Bad request (validation/moderation failure)
- `429` - Too many requests (rate limit exceeded)
- `401` - Unauthorized (authentication required)
- `500` - Server error

## Security Features

### 1. **Multiple Layers of Defense**
```
User Upload → File Validation → Text Extraction → Content Moderation → Sanitization → Database
```

### 2. **Graceful Degradation**
If OpenAI Moderation API is unavailable:
- Falls back to pattern-based detection
- Still blocks obvious malicious content
- Logs the failure for monitoring

### 3. **Logging & Monitoring**
All moderation failures are logged with:
- User ID
- File/content details
- Flagged categories
- Timestamp

## Configuration

### Adjusting Rate Limits
Edit in `src/lib/moderation.ts`:
```typescript
checkRateLimit(userId, maxUploads = 20, windowMs = 60000)
```

### Modifying File Size Limits
Edit in `src/lib/moderation.ts`:
```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

### Content Length Limits
```typescript
export const MIN_CONTENT_LENGTH = 10;
export const MAX_CONTENT_LENGTH = 100000; // ~100k characters
```

## Testing Recommendations

### 1. **File Validation Testing**
- Upload files exceeding 10MB
- Try uploading `.exe`, `.bat`, `.sh` files
- Test double-extension files (e.g., `file.pdf.exe`)

### 2. **Content Moderation Testing**
- Upload documents with inappropriate content
- Test with educational content (should pass)
- Try uploading empty files

### 3. **Rate Limiting Testing**
- Rapidly upload multiple files
- Verify 429 error after 20 uploads/minute

## Environment Variables Required

Ensure your `.env` file contains:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Future Enhancements

### Recommended Improvements
1. **Image Content Moderation**: Add image analysis for uploaded PDFs
2. **Redis-based Rate Limiting**: Scale rate limiting across multiple servers
3. **Custom Blocklist**: Add domain-specific content filters
4. **Audit Logging**: Store moderation events in database
5. **Admin Dashboard**: View and manage flagged content
6. **Appeal System**: Allow users to contest moderation decisions
7. **Multi-language Support**: Detect and moderate content in multiple languages

## Troubleshooting

### Common Issues

**Issue**: TypeScript errors about `pdf-parse` module
- **Solution**: These are type definition warnings and don't affect runtime. To fix:
  ```bash
  npm i --save-dev @types/pdf-parse
  ```
  Or add to `src/types/pdf-parse.d.ts`:
  ```typescript
  declare module 'pdf-parse';
  ```

**Issue**: OpenAI API rate limits
- **Solution**: 
  - Use a paid OpenAI account for higher limits
  - Implement caching for repeated content
  - Consider using alternative moderation APIs

**Issue**: False positives in moderation
- **Solution**: 
  - Adjust moderation thresholds
  - Implement manual review for edge cases
  - Add allow-list for educational terminology

## Support

For issues or questions about the moderation system:
1. Check the console logs for detailed error messages
2. Review the moderation result categories
3. Verify OpenAI API key is valid
4. Ensure sufficient API credits/quota

## Compliance

This system helps maintain:
- **COPPA compliance** - Protects minors from inappropriate content
- **Educational standards** - Ensures academic content quality
- **Community guidelines** - Maintains safe learning environment
- **Terms of Service** - Enforces platform rules
