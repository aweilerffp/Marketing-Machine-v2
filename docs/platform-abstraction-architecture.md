# Platform Abstraction Architecture

## Overview

This document provides the detailed technical architecture for transforming Marketing Machine into a multi-platform content generation system while maintaining existing LinkedIn functionality and enabling scalable platform expansion.

## Current State Analysis

Based on the comprehensive brownfield architecture analysis, Marketing Machine currently has:
- LinkedIn-specific content generation hardcoded in `backend/src/services/ai/contentGeneration.js`
- Read.ai-only webhook processing in single endpoint
- Database schema assuming single platform operation
- Frontend UI optimized for LinkedIn-only workflows

## Platform Abstraction Strategy

### Core Design Principles

1. **Zero Breaking Changes**: Existing LinkedIn functionality must remain 100% compatible
2. **Interface Segregation**: Platform-specific logic isolated behind clean interfaces
3. **Open/Closed Principle**: Easy to add platforms without modifying existing code
4. **Dependency Inversion**: Core business logic depends on abstractions, not implementations

## Database Schema Evolution

### Phase 1: Additive Schema Changes

```sql
-- Migration 001: Add platform support to existing tables
ALTER TABLE companies ADD COLUMN supported_platforms JSON DEFAULT '["linkedin"]';
ALTER TABLE companies ADD COLUMN platform_configurations JSON DEFAULT '{}';

-- Migration 002: Platform-aware meetings
ALTER TABLE meetings ADD COLUMN source_platform VARCHAR(50) DEFAULT 'readai';
ALTER TABLE meetings ADD COLUMN platform_meeting_id VARCHAR(255);
ALTER TABLE meetings ADD COLUMN platform_metadata JSON;

-- Migration 003: Multi-platform content posts
ALTER TABLE content_posts ADD COLUMN target_platforms JSON DEFAULT '["linkedin"]';
ALTER TABLE content_posts ADD COLUMN platform_content JSON;
ALTER TABLE content_posts ADD COLUMN platform_status JSON DEFAULT '{}';

-- Migration 004: Platform connections
CREATE TABLE platform_connections (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) REFERENCES companies(id),
  platform_type VARCHAR(50) NOT NULL,
  platform_user_id VARCHAR(255),
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted  
  token_expires_at TIMESTAMP,
  connection_metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Backward Compatibility Strategy

- All new fields have sensible defaults for existing records
- JSON fields allow flexible platform-specific data storage
- Migration can be rolled back without data loss
- Existing LinkedIn-only users see zero changes

## Platform Adapter Architecture

### Base Adapter Interface

```javascript
// backend/src/services/platforms/base/BasePlatformAdapter.js
export class BasePlatformAdapter {
  constructor(config) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.limits);
  }
  
  // Abstract methods that each platform must implement
  async authenticate(credentials) { throw new Error('Must implement authenticate()') }
  async parseWebhook(payload) { throw new Error('Must implement parseWebhook()') }
  async generateContent(hook, brandVoice) { throw new Error('Must implement generateContent()') }
  async publishContent(content, auth) { throw new Error('Must implement publishContent()') }
  
  // Common functionality
  async validateConnection(connectionId) {
    const connection = await this.getConnection(connectionId);
    return connection && connection.token_expires_at > Date.now();
  }
}
```

### Social Platform Specialization

```javascript
// backend/src/services/platforms/interfaces/SocialPlatformAdapter.js
export class SocialPlatformAdapter extends BasePlatformAdapter {
  // Platform-specific content constraints
  getContentConstraints() {
    return {
      maxLength: this.config.maxLength,
      supportsHashtags: this.config.supportsHashtags,
      supportsImages: this.config.supportsImages,
      supportsLinks: this.config.supportsLinks,
      supportsThreads: this.config.supportsThreads || false
    };
  }

  // Transform generic content to platform-specific format
  async formatContent(genericContent, brandVoice) {
    const constraints = this.getContentConstraints();
    
    return {
      text: this.truncateToLimit(genericContent.text, constraints.maxLength),
      hashtags: constraints.supportsHashtags ? this.generateHashtags(genericContent, brandVoice) : [],
      imagePrompt: constraints.supportsImages ? genericContent.imagePrompt : null,
      links: constraints.supportsLinks ? this.extractLinks(genericContent) : []
    };
  }

  // Platform-specific publishing
  async publishPost(content, connectionId) {
    const connection = await this.getConnection(connectionId);
    const result = await this.platformPublish(content, connection);
    
    // Update platform status tracking
    await this.updatePostStatus(content.id, result);
    return result;
  }

  // Abstract platform-specific methods
  async platformPublish(content, connection) { throw new Error('Must implement platformPublish()') }
}
```

## Platform Registry System

```javascript
// backend/src/services/platforms/PlatformRegistry.js
class PlatformRegistry {
  static platforms = new Map();
  
  static register(type, adapterClass, config) {
    const adapter = new adapterClass(config);
    this.platforms.set(type, adapter);
    console.log(`✅ Registered platform: ${type}`);
  }
  
  static get(type) {
    if (!this.platforms.has(type)) {
      throw new Error(`Platform ${type} not registered`);
    }
    return this.platforms.get(type);
  }
  
  static getAvailable() {
    return Array.from(this.platforms.keys());
  }
  
  static getSupportedPlatforms(platformType) {
    return Array.from(this.platforms.values())
      .filter(adapter => adapter.constructor.platformType === platformType)
      .map(adapter => adapter.config.name);
  }
}

// Platform registration on startup
import { LinkedInAdapter } from './social/LinkedInAdapter.js';
import { TwitterAdapter } from './social/TwitterAdapter.js';
import { FacebookAdapter } from './social/FacebookAdapter.js';
import { ReadAIAdapter } from './meeting/ReadAIAdapter.js';
import { ZoomAdapter } from './meeting/ZoomAdapter.js';

// Register social platforms
PlatformRegistry.register('linkedin', LinkedInAdapter, {
  name: 'LinkedIn',
  maxLength: 3000,
  supportsHashtags: true,
  supportsImages: true,
  rateLimits: { postsPerHour: 150 }
});

PlatformRegistry.register('twitter', TwitterAdapter, {
  name: 'Twitter',
  maxLength: 280,
  supportsHashtags: true,
  supportsImages: true,
  supportsThreads: true,
  rateLimits: { postsPerHour: 300 }
});

// Register meeting platforms
PlatformRegistry.register('readai', ReadAIAdapter, {
  name: 'Read.ai',
  webhookPath: '/api/webhooks/readai'
});

PlatformRegistry.register('zoom', ZoomAdapter, {
  name: 'Zoom',
  webhookPath: '/api/webhooks/zoom'
});
```

## LinkedIn Adapter (Existing Logic Migration)

```javascript
// backend/src/services/platforms/social/LinkedInAdapter.js
export class LinkedInAdapter extends SocialPlatformAdapter {
  static platformType = 'social';
  
  constructor(config) {
    super(config);
  }

  async generateContent(hook, brandVoice) {
    // Migrate existing generateLinkedInPost logic here
    const prompt = `
Create a LinkedIn post for ${brandVoice.industry || 'technology'} companies.

Company Context:
- Industry: ${brandVoice.industry || 'Technology'}
- Target Audience: ${brandVoice.targetAudience || 'Business professionals'}
- Brand Voice: Professional, helpful, and authoritative

Content Hook:
${hook}

Website Content Context (for tone reference):
${brandVoice.websiteContent ? brandVoice.websiteContent.substring(0, 500) + '...' : 'Professional technology company content'}

Create a LinkedIn post that:
1. Opens with a compelling hook that grabs attention
2. Provides valuable insight or actionable advice
3. Uses a conversational but professional tone
4. Includes a call-to-action or thought-provoking question
5. Is optimized for LinkedIn engagement (150-300 words)
6. Matches the brand's voice and target audience

Format your response as JSON:
{
  "content": "The LinkedIn post content",
  "imagePrompt": "A brief description for an image that would complement this post"
}`;

    return await this.callOpenAI(prompt);
  }

  async platformPublish(content, connection) {
    const response = await this.makeAPICall('/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: `urn:li:person:${connection.platform_user_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content.text },
            shareMediaCategory: 'NONE'
          }
        }
      })
    });

    return { 
      success: true, 
      platformPostId: response.id,
      publishedAt: new Date().toISOString()
    };
  }
}
```

## Twitter Adapter Implementation

```javascript
// backend/src/services/platforms/social/TwitterAdapter.js
export class TwitterAdapter extends SocialPlatformAdapter {
  static platformType = 'social';

  constructor(config) {
    super(config);
  }

  async generateContent(hook, brandVoice) {
    const prompt = `
Create a Twitter post for ${brandVoice.industry || 'technology'} companies.

CRITICAL: Maximum 280 characters total including spaces and punctuation.

Company Context:
- Industry: ${brandVoice.industry || 'Technology'}
- Target Audience: ${brandVoice.targetAudience || 'Business professionals'}
- Brand Voice: Concise, engaging, actionable

Content Hook:
${hook}

Create a Twitter post that:
1. Stays within 280 character limit (CRITICAL)
2. Includes relevant hashtags (#) if space allows
3. Uses conversational tone
4. Includes call-to-action or question if possible
5. Optimizes for retweets and engagement

Format as JSON:
{
  "content": "The Twitter post content (max 280 chars)",
  "hashtags": ["hashtag1", "hashtag2"],
  "imagePrompt": "Brief image description"
}`;

    return await this.callOpenAI(prompt);
  }

  async platformPublish(content, connection) {
    const response = await this.makeAPICall('/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: content.text
      })
    });

    return {
      success: true,
      platformPostId: response.data.id,
      publishedAt: new Date().toISOString()
    };
  }
}
```

## AI Content Generation Abstraction

```javascript
// backend/src/services/ai/PlatformContentGenerator.js
export class PlatformContentGenerator {
  constructor() {
    this.platformTemplates = new Map();
    this.loadPlatformTemplates();
  }

  async generateMultiPlatformContent(hook, brandVoice, targetPlatforms) {
    const platformContent = {};
    
    // Generate content for each requested platform
    for (const platformType of targetPlatforms) {
      const adapter = PlatformRegistry.get(platformType);
      try {
        platformContent[platformType] = await adapter.generateContent(hook, brandVoice);
        console.log(`✅ Generated ${platformType} content`);
      } catch (error) {
        console.error(`❌ Failed to generate ${platformType} content:`, error);
        platformContent[platformType] = { error: error.message };
      }
    }
    
    return platformContent;
  }

  async generateSinglePlatformContent(hook, brandVoice, platformType) {
    const adapter = PlatformRegistry.get(platformType);
    return await adapter.generateContent(hook, brandVoice);
  }

  loadPlatformTemplates() {
    // Platform-specific templates loaded from configuration
    this.platformTemplates.set('linkedin', {
      maxLength: 3000,
      style: 'professional',
      features: ['hashtags', 'images', 'links', 'polls']
    });

    this.platformTemplates.set('twitter', {
      maxLength: 280,
      style: 'conversational',
      features: ['hashtags', 'images', 'threads']
    });

    this.platformTemplates.set('facebook', {
      maxLength: 63206,
      style: 'community-focused',
      features: ['hashtags', 'images', 'links', 'events']
    });
  }
}
```

## Webhook Router Architecture

```javascript
// backend/src/api/webhooks/router.js
import express from 'express';
import { PlatformRegistry } from '../../services/platforms/PlatformRegistry.js';

const router = express.Router();

// Generic webhook handler
router.post('/:platformType', async (req, res) => {
  const { platformType } = req.params;
  
  try {
    const adapter = PlatformRegistry.get(platformType);
    
    // Validate webhook signature
    const isValid = await adapter.validateWebhookSignature(
      req.headers['x-signature'] || req.headers['authorization'],
      req.body
    );
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    // Parse webhook payload
    const meetingData = await adapter.parseWebhook(req.body);
    
    // Queue for processing
    await queueTranscriptProcessing(meetingData);
    
    res.json({ success: true, message: 'Webhook processed' });
    
  } catch (error) {
    console.error(`Webhook processing error for ${platformType}:`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Backward compatibility for existing Read.ai webhook
router.post('/readai', (req, res, next) => {
  req.params.platformType = 'readai';
  return router.handle(req, res, next);
});

export default router;
```

## Frontend Multi-Platform Components

```typescript
// frontend/src/components/multi-platform/PlatformSelector.tsx
interface Platform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  constraints: {
    maxLength: number;
    supportsHashtags: boolean;
    supportsImages: boolean;
  };
}

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformChange: (platforms: string[]) => void;
  availablePlatforms: Platform[];
}

export function PlatformSelector({ 
  selectedPlatforms, 
  onPlatformChange, 
  availablePlatforms 
}: PlatformSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {availablePlatforms.map(platform => (
        <PlatformCard
          key={platform.id}
          platform={platform}
          isSelected={selectedPlatforms.includes(platform.id)}
          onToggle={(selected) => {
            if (selected) {
              onPlatformChange([...selectedPlatforms, platform.id]);
            } else {
              onPlatformChange(selectedPlatforms.filter(p => p !== platform.id));
            }
          }}
        />
      ))}
    </div>
  );
}

// Multi-platform content preview
export function MultiPlatformPreview({ content, platforms }: MultiPlatformPreviewProps) {
  return (
    <div className="space-y-4">
      {platforms.map(platform => (
        <div key={platform.id} className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <img src={platform.icon} alt={platform.name} className="w-5 h-5" />
            <span className="font-medium">{platform.name}</span>
            <span className="text-sm text-gray-500">
              {content[platform.id]?.text?.length || 0}/{platform.constraints.maxLength}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            {content[platform.id]?.text || 'Content not generated'}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Migration and Rollout Strategy

### Phase 1: Foundation (Week 1-2)
1. Database schema migration with backward compatibility
2. Platform registry and base adapter implementation
3. LinkedIn adapter migration (zero functional changes)
4. Integration testing for existing functionality

### Phase 2: Multi-Platform Infrastructure (Week 3-4)
1. Twitter and Facebook adapter implementation
2. Multi-platform content generation engine
3. Frontend platform selection components
4. Webhook router for new platforms

### Phase 3: Platform Expansion (Week 5-8)
1. Zoom and Teams meeting platform adapters
2. Instagram and additional social platforms
3. Advanced multi-platform features (scheduling, analytics)
4. Full integration testing and production rollout

### Rollback Strategy
- Feature flags control platform availability
- Database migrations can be rolled back without data loss
- LinkedIn-only mode available as fallback
- Platform-specific failures don't affect other platforms

This architecture ensures Marketing Machine can scale to support any number of platforms while maintaining the stability and performance of existing LinkedIn functionality.