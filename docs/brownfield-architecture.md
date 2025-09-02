# Marketing Machine - Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the Marketing Machine SaaS platform, a sophisticated full-stack application that transforms meeting transcripts into high-quality LinkedIn marketing content using AI-powered brand voice analysis. This serves as a comprehensive reference for senior developers working on enhancements.

### Document Scope

Comprehensive documentation of entire system architecture, focusing on AI brand voice integration and content generation workflows.

### Change Log

| Date   | Version | Description                 | Author    |
| ------ | ------- | --------------------------- | --------- |
| 2025-01-02 | 1.0     | Initial brownfield analysis | Architect Winston |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `backend/src/server.js` - Express server with conditional Clerk middleware
- **AI Core Logic**: `backend/src/services/ai/contentGeneration.js` - OpenAI integration for hooks and posts
- **Queue Processing**: `backend/src/services/queue/processors/transcript.js` - Meeting transcript processing
- **Database Schema**: `backend/prisma/schema.prisma` - SQLite with Prisma ORM
- **Frontend Entry**: `frontend/src/App.tsx` - React Router with TanStack Query
- **Brand Voice Components**: `frontend/src/components/ContentQueue.tsx`, `frontend/src/components/PostCard.tsx`
- **API Services**: `frontend/src/services/api.ts` - Centralized API client
- **Demo Content**: `backend/src/api/content/demo.js` - Sample content generation for testing

### Critical Business Logic

- **Brand Voice Analysis**: `backend/src/services/ai/contentGeneration.js` lines 23-108 - Processes company brand voice data to generate personalized content
- **Meeting Processing**: `backend/src/services/queue/processors/transcript.js` - Complete workflow from Read.ai webhook to LinkedIn post generation
- **Content Approval Flow**: Database schema with PostStatus enum (PENDING → APPROVED → SCHEDULED → PUBLISHED)

## High Level Architecture

### Technical Summary

The Marketing Machine is a multi-tenant SaaS platform that processes meeting transcripts from Read.ai and generates branded LinkedIn content using OpenAI. The system emphasizes brand voice consistency through comprehensive onboarding data collection and AI prompt engineering.

### Actual Tech Stack

| Category  | Technology | Version | Notes                      |
| --------- | ---------- | ------- | -------------------------- |
| Runtime   | Node.js    | 18+     | ES Modules throughout      |
| Backend Framework | Express | 5.1.0   | With helmet, cors, morgan  |
| Database  | SQLite     | Latest  | Via Prisma ORM 6.15.0     |
| Queue System | Bull      | 4.16.5  | Redis-based job processing |
| Cache/Queue | Redis     | 5.8.2   | For Bull queue system      |
| Authentication | Clerk   | 1.7.26  | Conditional dev mode skip  |
| AI Service | OpenAI     | 5.16.0  | GPT-4o-mini default model  |
| Frontend Framework | React | 19.1.1  | With React Router DOM 7.8.2 |
| TypeScript | TypeScript | 5.8.3   | Frontend only             |
| Build Tool | Vite       | 7.1.2   | Frontend build system     |
| CSS Framework | Tailwind | 4.1.12  | With Radix UI components  |
| State Management | TanStack Query | 5.85.6 | Server state management |
| Forms | React Hook Form | 7.62.0 | Form handling |

### Repository Structure Reality Check

- Type: **Monorepo** (backend + frontend in single repo)
- Package Manager: **npm** (with concurrently for dev scripts)
- Notable: Root package.json provides orchestration scripts for both services

## Source Tree and Module Organization

### Project Structure (Actual)

```text
marketing-machine/
├── backend/
│   ├── src/
│   │   ├── api/             # Express route handlers
│   │   │   ├── auth/        # Clerk authentication endpoints
│   │   │   ├── company/     # Brand voice CRUD operations
│   │   │   ├── content/     # Content management + demo generator
│   │   │   ├── linkedin/    # LinkedIn OAuth integration
│   │   │   └── webhooks/    # Read.ai webhook receiver
│   │   ├── services/        # Business logic layer
│   │   │   ├── ai/          # AI content generation (CRITICAL)
│   │   │   └── queue/       # Bull queue processors
│   │   ├── middleware/      # Express middleware
│   │   └── models/          # Database connection
│   ├── prisma/              # Database schema and migrations
│   └── package.json         # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Radix UI component library
│   │   │   ├── ContentQueue.tsx  # Main content approval interface
│   │   │   └── PostCard.tsx      # Individual post display/editing
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client functions
│   │   └── lib/             # Utility functions
│   └── package.json         # Frontend dependencies
├── docs/                    # Architecture documentation (NEW)
├── .bmad-core/             # BMad development methodology files
├── .env.example            # Environment variables template
└── package.json            # Root orchestration scripts
```

### Key Modules and Their Purpose

- **AI Content Generation**: `backend/src/services/ai/contentGeneration.js` - Core AI logic with OpenAI integration and fallback mock data
- **Meeting Processing**: `backend/src/services/queue/processors/transcript.js` - Async processing of Read.ai webhooks
- **Brand Voice Management**: `backend/src/api/company/index.js` - CRUD operations for company brand voice data
- **Content Approval System**: `frontend/src/components/ContentQueue.tsx` - Main user interface for reviewing AI-generated content
- **Demo Content Generation**: `backend/src/api/content/demo.js` - Sample content for testing brand voice analysis
- **Authentication**: `backend/src/middleware/clerk.js` - Clerk integration with dev mode bypass

## Data Models and APIs

### Data Models

**Core Entity Relationships:**
- **User**: Clerk-managed users with LinkedIn tokens
- **Company**: Brand voice data + content pillars + posting schedule
- **Meeting**: Read.ai transcript data with processing status
- **ContentHook**: Marketing hooks extracted from meetings
- **ContentPost**: LinkedIn posts with approval workflow

**Key Schema Details:**
- See `backend/prisma/schema.prisma` for complete schema
- **Company.brandVoiceData**: JSON field storing comprehensive brand analysis from onboarding
- **Company.contentPillars**: JSON string for content categorization
- **PostStatus enum**: PENDING → APPROVED → SCHEDULED → PUBLISHED → REJECTED

### API Specifications

**Core API Routes:**

**Authentication:**
- `GET /api/auth/me` - Get current user (Clerk integration)
- `PUT /api/auth/linkedin-token` - Store encrypted LinkedIn token

**Company Management (Brand Voice):**
- `GET /api/company` - Get company brand voice profile
- `POST /api/company` - Create/update brand voice data (upsert)

**Content Management:**
- `GET /api/content/queue` - Get pending posts for approval
- `POST /api/content/generate` - Generate demo content (testing)
- `PUT /api/content/:postId/status` - Update post approval status
- `PUT /api/content/:postId/content` - Edit post content

**Webhooks:**
- `POST /api/webhooks/readai` - Receive meeting end notifications

**LinkedIn Integration:**
- `GET /api/linkedin/auth` - OAuth initiation
- `POST /api/linkedin/callback` - OAuth callback handler

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Database Schema Migration**: Currently using SQLite for development, but README.md indicates PostgreSQL for production - schema mismatch needs resolution
2. **Environment Variable Management**: Development mode skips Clerk authentication when `CLERK_PUBLISHABLE_KEY === 'pk_test_valid_key_placeholder'` - this hardcoded bypass needs proper dev/prod configuration
3. **AI Service Fallback**: Mock data is hardcoded for FlatFilePro/Amazon sellers - needs dynamic mock generation based on actual brand voice data
4. **Content Pillars Integration**: Onboarding flow was simplified to remove content pillars, but backend still expects them - incomplete feature removal

### Workarounds and Gotchas

- **OpenAI Key Detection**: System gracefully degrades to mock data when `OPENAI_API_KEY` is missing or placeholder
- **Clerk Dev Mode**: Authentication bypassed in development with hardcoded key check in `server.js:46-55`
- **Database Choice**: Schema uses SQLite provider but production config mentions PostgreSQL - requires schema update for deployment
- **ES Modules**: Entire backend uses ES modules (`"type": "module"` in package.json) - all imports must use `.js` extensions
- **LinkedIn Token Storage**: Encrypted token storage implemented but encryption implementation not visible in current codebase

## Integration Points and External Dependencies

### External Services

| Service  | Purpose  | Integration Type | Key Files                      |
| -------- | -------- | ---------------- | ------------------------------ |
| OpenAI   | AI Content Generation | REST API | `backend/src/services/ai/contentGeneration.js` |
| Clerk    | Authentication | SDK | `backend/src/middleware/clerk.js` |
| Read.ai  | Meeting Transcripts | Webhook | `backend/src/api/webhooks/readai.js` |
| LinkedIn | OAuth + Publishing | OAuth 2.0 | `backend/src/api/linkedin/index.js` |
| Redis    | Job Queue | TCP | `backend/src/services/queue/index.js` |

### Internal Integration Points

- **Queue Processing**: Redis-based Bull queues handle async transcript processing
- **Frontend-Backend**: REST API with centralized client in `frontend/src/services/api.ts`
- **Database**: Prisma Client handles all database operations with relationship loading
- **File Storage**: No external file storage implemented - images referenced by URL only

## Development and Deployment

### Local Development Setup

**Prerequisites Installation:**
```bash
# Required services
brew install postgresql redis
brew services start postgresql redis

# Node.js 18+ required
node --version  # Should be 18+
```

**Project Setup:**
```bash
# Root level - installs both backend and frontend
npm run install:all

# Database setup
npm run migrate  # Runs Prisma migrations
npm run generate # Generates Prisma client

# Development servers
npm run dev  # Starts both backend (3001) and frontend (5173)
```

**Environment Variables Required:**
- Backend: See `.env.example` - critical ones are `DATABASE_URL`, `OPENAI_API_KEY`, `CLERK_SECRET_KEY`
- Frontend: Requires `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL`

### Build and Deployment Process

- **Frontend Build**: `npm run build` (runs TypeScript compilation + Vite build)
- **Backend Deploy**: Direct Node.js execution - no build step required
- **Database**: Prisma migrations must be run in production environment
- **Environment Configuration**: Production requires PostgreSQL DATABASE_URL update

### Testing Reality

**Current Test Coverage:**
- Unit Tests: **Not implemented**
- Integration Tests: **Not implemented**  
- E2E Tests: **Not implemented**
- Manual Testing: **Primary QA method via demo content generation**

**Testing Approach:**
- Demo content generation serves as integration test
- Brand voice analysis testable via `/api/content/generate` endpoint
- Manual approval queue testing through frontend interface

## AI Content Generation Architecture

### Brand Voice Analysis Flow

**Input Data Collection** (via frontend onboarding):
1. **Company Profile**: Name, industry, target audience
2. **Brand Voice Examples**: Website content, social posts, marketing emails, support emails, video transcripts
3. **Brand Assets**: Colors, StoryBrand framework (optional)
4. **Posting Preferences**: Timezone, default posting times

**AI Processing Pipeline**:
1. **Hook Generation** (`generateContentHooks()`):
   - Analyzes meeting transcript with brand voice context
   - Extracts 3-5 actionable content hooks
   - Uses GPT-4o-mini with temperature 0.7 for creativity balance
   
2. **Post Generation** (`generateLinkedInPost()`):
   - Transforms hooks into LinkedIn posts (150-300 words)
   - Incorporates brand voice from website content analysis
   - Generates complementary image prompts
   - Returns structured JSON with content + imagePrompt

### Content Quality Controls

**Brand Voice Consistency:**
- Website content used as tone reference (truncated to 500 chars for prompt efficiency)
- Industry and target audience context applied to all generation
- Professional, helpful, authoritative tone maintained across all content

**Content Structure:**
- Compelling hook opening
- Valuable insight/actionable advice
- Call-to-action or engagement question
- LinkedIn-optimized format (emoji usage, bullet points, line breaks)

**Fallback Systems:**
- Mock data generation when OpenAI unavailable
- Error handling with graceful degradation
- JSON parsing fallback for malformed AI responses

## Multi-Tenant SaaS Architecture

### Tenant Isolation

**Data Isolation:**
- Company-based tenancy through `Company` model
- All content tied to specific company via `companyId` foreign keys
- User authentication through Clerk with company association

**Processing Isolation:**
- Meeting processing finds company by owner email
- Brand voice data scoped to specific company context
- Content generation uses tenant-specific brand voice data

**API Security:**
- Clerk middleware on all authenticated routes
- User context extraction via `getUserId(req)` helper
- Company data access controlled by user association

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
# Development
npm run dev              # Start both services with hot reload
npm run dev:backend      # Backend only (port 3001)
npm run dev:frontend     # Frontend only (port 5173)

# Database Operations
npm run migrate          # Run Prisma migrations
npm run generate         # Regenerate Prisma client
npx prisma studio        # Database GUI

# Production
npm run build           # Build frontend for production
npm start              # Start production backend
```

### Debugging and Troubleshooting

**Application Logs:**
- Backend: Console logging with emoji prefixes for easy identification
- Frontend: Browser DevTools + TanStack Query DevTools
- Queue Processing: Bull job status tracking

**Common Development Issues:**
1. **Database Connection**: Ensure PostgreSQL/SQLite service running
2. **Redis Queue**: Check Redis service for queue processing
3. **OpenAI Integration**: Verify API key configuration - system falls back to mock data
4. **Clerk Authentication**: Dev mode bypass active when using placeholder key
5. **ES Module Imports**: All backend imports require `.js` extension

**Debug Mode Activation:**
- Set `NODE_ENV=development` for detailed error messages
- Frontend errors visible in browser console
- Backend API errors include stack traces in development

### Performance Considerations

**AI Generation Bottlenecks:**
- OpenAI API calls are sequential per meeting (not parallelized)
- Large transcripts may hit token limits (current prompt ~1000 tokens max)
- No caching of generated content hooks or posts

**Database Optimization:**
- Prisma relationship loading used extensively - monitor N+1 queries
- SQLite suitable for development, PostgreSQL required for production scale
- No database indexing optimization implemented yet

**Queue Performance:**
- Single Redis queue for transcript processing
- No retry logic configuration visible
- Bull dashboard not implemented for monitoring

This comprehensive architecture document captures the current state of the Marketing Machine, including its sophisticated AI-powered brand voice integration, multi-tenant SaaS architecture, and content generation workflows. The system demonstrates strong architectural foundations with clear separation of concerns and robust error handling patterns.