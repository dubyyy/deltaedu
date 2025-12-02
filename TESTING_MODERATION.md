# Testing Content Moderation System

## Quick Test Guide

### 1. Test File Validation

#### Should PASS ✅
```bash
# Create test files
echo "This is a sample educational note about mathematics." > test.txt
# Upload test.txt through the UI
```

#### Should FAIL ❌
```bash
# File too large (>10MB)
dd if=/dev/zero of=large.txt bs=1M count=11

# Suspicious file types
echo "test" > malicious.exe
echo "test" > file.pdf.exe
```

### 2. Test Content Moderation

#### Should PASS ✅
**Educational Content**
```
# Biology Notes
## Cell Structure
The cell is the basic unit of life. It consists of:
- Cell membrane
- Cytoplasm
- Nucleus
- Mitochondria

## Photosynthesis
Plants convert light energy into chemical energy through photosynthesis.
The equation is: 6CO2 + 6H2O + light → C6H12O6 + 6O2
```

**Math Study Material**
```
# Calculus Basics
## Derivatives
The derivative represents the rate of change.
d/dx(x²) = 2x
d/dx(sin x) = cos x

## Integration
∫ x² dx = x³/3 + C
```

#### Should FAIL ❌
**Inappropriate Content**
- Hate speech or discriminatory content
- Explicit sexual content
- Violence or graphic descriptions
- Self-harm references
- Illegal activities

**Malicious Content**
```html
<script>alert('XSS')</script>
<img src=x onerror="alert('XSS')">
javascript:void(0)
```

### 3. Test Rate Limiting

#### Test Script (Node.js)
```javascript
// test-rate-limit.js
async function testRateLimit() {
  const results = [];
  
  // Try to upload 25 times (limit is 20/minute)
  for (let i = 0; i < 25; i++) {
    const formData = new FormData();
    formData.append('title', `Test ${i}`);
    formData.append('content', 'Educational test content');
    formData.append('notebook_id', 'your-notebook-id');
    
    try {
      const response = await fetch('/api/upload', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer your-token',
        },
        body: JSON.stringify({
          notebook_id: 'test-id',
          title: `Test ${i}`,
          content: 'Test content'
        })
      });
      
      results.push({
        attempt: i + 1,
        status: response.status,
        success: response.ok
      });
      
      if (response.status === 429) {
        console.log(`❌ Rate limited at attempt ${i + 1}`);
        break;
      }
    } catch (error) {
      console.error(`Error at attempt ${i + 1}:`, error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('Results:', results);
  console.log(`Total successful uploads: ${results.filter(r => r.success).length}`);
}

testRateLimit();
```

### 4. Manual Testing Checklist

#### File Upload Testing
- [ ] Upload valid PDF (< 10MB)
- [ ] Upload valid DOCX (< 10MB)
- [ ] Upload valid TXT (< 10MB)
- [ ] Try uploading file > 10MB (should fail)
- [ ] Try uploading .exe file (should fail)
- [ ] Try uploading file with double extension (should fail)
- [ ] Upload empty file (should fail)

#### Content Moderation Testing
- [ ] Upload educational content (should pass)
- [ ] Upload content with script tags (should fail)
- [ ] Upload extremely short content (should fail)
- [ ] Upload extremely long content (should fail)
- [ ] Upload content with null bytes (should be sanitized)

#### Rate Limiting Testing
- [ ] Upload files normally (should work)
- [ ] Upload 20 files rapidly (all should work)
- [ ] Upload 21st file immediately (should fail with 429)
- [ ] Wait 1 minute and try again (should work)

#### Error Handling Testing
- [ ] Verify error messages are user-friendly
- [ ] Check that moderation failures show appropriate message
- [ ] Confirm rate limit message is clear
- [ ] Test with invalid file types

### 5. API Testing with cURL

#### Test Valid Upload
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/test.pdf" \
  -F "notebook_id=test-notebook-id" \
  -F "title=Test Note"
```

#### Test Text Upload
```bash
curl -X PUT http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notebook_id": "test-notebook-id",
    "title": "Test Note",
    "content": "This is educational content about programming."
  }'
```

#### Test Rate Limiting
```bash
# Run this 21 times quickly
for i in {1..21}; do
  curl -X PUT http://localhost:3000/api/upload \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"notebook_id\":\"test\",\"title\":\"Test $i\",\"content\":\"Test\"}" &
done
wait
```

### 6. Expected Results

#### Success Response (200)
```json
{
  "note": {
    "id": "uuid",
    "title": "Test Note",
    "content": "...",
    "summary": "...",
    "created_at": "timestamp"
  },
  "message": "File uploaded and processed successfully",
  "summary_generated": true
}
```

#### Validation Error (400)
```json
{
  "error": "File type not supported. Please upload PDF, DOCX, DOC, or TXT files."
}
```

#### Moderation Error (400)
```json
{
  "error": "Content violates community guidelines",
  "categories": ["violence", "hate"]
}
```

#### Rate Limit Error (429)
```json
{
  "error": "Rate limit exceeded. Maximum 20 uploads per minute."
}
```

### 7. Integration Testing

Create a test suite using Jest or similar:

```typescript
// __tests__/moderation.test.ts
import { validateFile, moderateContent, sanitizeContent, checkRateLimit } from '@/lib/moderation';

describe('Content Moderation', () => {
  describe('File Validation', () => {
    it('should accept valid PDF files', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject files over 10MB', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject suspicious file extensions', () => {
      const file = new File(['content'], 'test.pdf.exe', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('Content Moderation', () => {
    it('should accept educational content', async () => {
      const content = 'This is a biology lesson about cells and their structures.';
      const result = await moderateContent(content);
      expect(result.safe).toBe(true);
    });

    it('should reject content with script tags', async () => {
      const content = '<script>alert("xss")</script>';
      const result = await moderateContent(content);
      expect(result.safe).toBe(false);
      expect(result.categories).toContain('malicious-content');
    });

    it('should reject very short content', async () => {
      const content = 'Hi';
      const result = await moderateContent(content);
      expect(result.safe).toBe(false);
    });
  });

  describe('Content Sanitization', () => {
    it('should remove null bytes', () => {
      const content = 'Test\0content\0here';
      const sanitized = sanitizeContent(content);
      expect(sanitized).not.toContain('\0');
    });

    it('should remove script tags', () => {
      const content = 'Text <script>alert(1)</script> more text';
      const sanitized = sanitizeContent(content);
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow uploads within limit', () => {
      const userId = 'test-user-1';
      for (let i = 0; i < 20; i++) {
        const result = checkRateLimit(userId);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block uploads exceeding limit', () => {
      const userId = 'test-user-2';
      for (let i = 0; i < 20; i++) {
        checkRateLimit(userId);
      }
      const result = checkRateLimit(userId);
      expect(result.allowed).toBe(false);
    });
  });
});
```

### 8. Monitoring & Logging

Check console logs for moderation events:

```javascript
// Look for these log patterns
[WARN] Content moderation failed: {
  userId: 'user-id',
  fileName: 'test.pdf',
  categories: ['violence', 'hate']
}
```

### 9. Performance Testing

Test API response times:

```bash
# Measure response time
time curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "notebook_id=test" \
  -F "title=Performance Test"
```

Expected times:
- File validation: < 50ms
- Text extraction: 100ms - 2s (depends on file size)
- Content moderation: 200ms - 1s (OpenAI API call)
- Total upload time: 500ms - 5s

### 10. Production Testing Checklist

Before deploying to production:

- [ ] OpenAI API key is set in environment variables
- [ ] Rate limiting is configured appropriately
- [ ] Error messages don't expose sensitive information
- [ ] All file types are tested
- [ ] Moderation accuracy is acceptable
- [ ] Performance meets requirements
- [ ] Logging is properly configured
- [ ] Database can handle sanitized content
- [ ] Error recovery works correctly
- [ ] User feedback is clear and helpful
