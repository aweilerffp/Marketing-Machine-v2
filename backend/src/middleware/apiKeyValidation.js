// API Key Security Validation Middleware
// Prevents exposure of placeholder keys and validates key formats

const isDevelopment = process.env.NODE_ENV !== 'production';

// Security patterns to detect placeholder or invalid keys
const SECURITY_PATTERNS = {
  PLACEHOLDER_KEYS: [
    'REPLACE_WITH_NEW_',
    'PLACEHOLDER',
    'YOUR_KEY_HERE',
    'sk_test_REPLACEME',
    'your_',
    '_here'
  ],
  EXPOSED_PREFIXES: [
    'sk-proj-4tpMP1if',  // Revoked OpenAI key prefix
    'sk-proj-QLd-MlHgE9VB', // Revoked OpenAI key prefix (2025-10-14 - exposed in .env.local)
    'sk-ant-api03-xqYt', // Revoked Anthropic key prefix (2025-09)
    'sk-ant-api03-Hek7SU5Y', // Revoked Anthropic key prefix (2025-10-14 - exposed in .env)
    'sk-ant-api03-D75nS' // Revoked Anthropic key prefix (2025-10-14 - exposed in .env.local)
  ]
};

// Validate API key format and security
export const validateApiKey = (keyName, keyValue) => {
  if (!keyValue || keyValue.trim() === '') {
    return { valid: false, reason: 'Key is empty or undefined' };
  }

  // Check for placeholder patterns
  for (const pattern of SECURITY_PATTERNS.PLACEHOLDER_KEYS) {
    if (keyValue.includes(pattern)) {
      return { 
        valid: false, 
        reason: `Contains placeholder pattern: ${pattern}`,
        action: 'Replace with actual API key'
      };
    }
  }

  // Check for revoked/exposed key prefixes
  for (const prefix of SECURITY_PATTERNS.EXPOSED_PREFIXES) {
    if (keyValue.startsWith(prefix)) {
      return { 
        valid: false, 
        reason: `Using revoked/exposed key prefix: ${prefix}...`,
        action: 'Generate new API key immediately'
      };
    }
  }

  // Basic format validation
  if (keyName.includes('OPENAI') && !keyValue.startsWith('sk-')) {
    return { 
      valid: false, 
      reason: 'OpenAI key must start with sk-',
      action: 'Verify key format'
    };
  }

  if (keyName.includes('ANTHROPIC') && !keyValue.startsWith('sk-ant-')) {
    return { 
      valid: false, 
      reason: 'Anthropic key must start with sk-ant-',
      action: 'Verify key format'
    };
  }

  return { valid: true };
};

// Middleware to validate all API keys at startup
export const validateEnvironmentKeys = () => {
  const keysToValidate = [
    { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
    { name: 'ANTHROPIC_API_KEY', value: process.env.ANTHROPIC_API_KEY },
    { name: 'CLERK_SECRET_KEY', value: process.env.CLERK_SECRET_KEY }
  ];

  const validationErrors = [];

  for (const { name, value } of keysToValidate) {
    const validation = validateApiKey(name, value);
    if (!validation.valid) {
      validationErrors.push({
        key: name,
        reason: validation.reason,
        action: validation.action
      });
    }
  }

  // In development, warn but don't stop
  if (isDevelopment && validationErrors.length > 0) {
    console.warn('\\n🚨 API KEY SECURITY WARNINGS:');
    validationErrors.forEach(error => {
      console.warn(`   ❌ ${error.key}: ${error.reason}`);
      if (error.action) {
        console.warn(`      ➡️ Action: ${error.action}`);
      }
    });
    console.warn('\\n⚠️  Fix these issues before production deployment!\\n');
    return { valid: false, errors: validationErrors, allowContinue: true };
  }

  // In production, stop execution for security issues
  if (!isDevelopment && validationErrors.length > 0) {
    console.error('\\n🚨 CRITICAL: Invalid API keys detected in production!');
    validationErrors.forEach(error => {
      console.error(`   ❌ ${error.key}: ${error.reason}`);
    });
    console.error('\\n🛑 Application startup blocked for security.\\n');
    return { valid: false, errors: validationErrors, allowContinue: false };
  }

  console.log('✅ API key validation passed');
  return { valid: true, errors: [] };
};

// Express middleware for runtime key validation
export const apiKeySecurityMiddleware = (req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Log API key usage in development (masked)
  if (isDevelopment) {
    const maskKey = (key) => {
      if (!key || key.length < 8) return '[INVALID]';
      return key.substring(0, 8) + '...';
    };

    console.log(`🔑 API Key Status: OpenAI=${maskKey(process.env.OPENAI_API_KEY)}, Anthropic=${maskKey(process.env.ANTHROPIC_API_KEY)}`);
  }

  next();
};