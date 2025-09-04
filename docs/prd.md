# Marketing Machine - Product Requirements Document

## Executive Summary

Marketing Machine automates the creation of LinkedIn marketing content for founders and small teams who struggle with consistent marketing. The platform integrates with Read.ai to capture meeting transcripts, analyzes them against company brand voice, and generates ready-to-post LinkedIn content with accompanying images.

## Problem Statement

Founders and small teams know they need to do marketing but lack the time, creativity, and consistency to maintain an effective social media presence. They have valuable insights from customer meetings but struggle to turn those conversations into compelling marketing content.

## Solution Overview

Marketing Machine creates an automated pipeline:
1. **Capture**: Read.ai webhook receives meeting transcripts
2. **Analyze**: AI processes transcript with company brand voice context
3. **Generate**: Creates marketing hooks, LinkedIn posts, and conceptual images
4. **Approve**: User reviews and edits content in approval queue
5. **Schedule**: Posts go live on LinkedIn at optimal times

## Target Users

- **Primary**: Solopreneurs and founders of small companies (1-10 employees)
- **Secondary**: Small marketing teams looking for content automation
- **Pain Points**: Time constraints, marketing creativity, consistency in posting

## Core Features - MVP

### 1. Read.ai Integration
- Webhook endpoint to receive meeting transcripts
- Metadata capture (date, meeting type, goals)
- Batch processing of transcript data

### 2. Company Onboarding & Brand Voice Analysis
**Data Collection Form includes:**
- Demo videos/transcripts
- Website content (homepage + 2-3 key pages)
- Social media posts (10-15 recent)
- Customer support communications (5-10 examples)
- Marketing emails (3-5 recent)
- Optional StoryBrand framework

### 3. Marketing Hook Generation Engine
**Uses structured prompt system:**
- Extracts up to 10 distinct insights per transcript
- Maps to 3 content pillars (listing management, catalog efficiency, API tools)
- Generates blog angles, LinkedIn hooks, and tweets
- Returns structured JSON output
- Default: 3 hooks per meeting (adjustable 1-10)

### 4. LinkedIn Content Creation
- Converts hooks into LinkedIn posts (≤150 words, ending with question)
- Maintains brand voice (confident, practical, solution-focused)
- Incorporates relevant keywords naturally

### 5. Image Generation
- Creates conceptual images using OpenAI/DALL-E
- Incorporates company brand colors and fonts from onboarding
- Generates image prompts based on marketing hooks

### 6. Content Approval Queue
- Visual queue showing generated posts + images
- Inline editing capabilities
- Custom rewrite prompts (e.g., "remove client name")
- Approve/reject functionality
- Calendar integration for scheduling

### 7. LinkedIn Publishing
- Individual user LinkedIn API integration
- Default posting times: 9am EST, 1pm EST
- Custom scheduling options
- Automated posting after approval

## Technical Architecture

### Database (PostgreSQL)
- **Users**: Authentication, LinkedIn tokens, preferences
- **Companies**: Brand voice data, onboarding information
- **Meetings**: Transcript data, metadata from Read.ai
- **Content**: Generated hooks, posts, images, approval status
- **Schedule**: Posting queue, scheduling preferences

### Key Integrations
- **Read.ai**: Webhook for meeting transcripts
- **OpenAI/DALL-E**: Content and image generation
- **LinkedIn API**: Publishing and authentication
- **PostgreSQL**: Data storage and management

### Core Workflows

#### Meeting Processing Workflow
1. Read.ai webhook triggers on new transcript
2. System processes transcript with brand voice context
3. Generates 3 marketing hooks using structured prompt
4. Creates LinkedIn posts from hooks
5. Generates image prompts and creates images
6. Adds content to approval queue

#### Content Approval Workflow
1. User reviews generated content in queue
2. Can edit inline or use custom rewrite prompts
3. Approves or rejects individual posts
4. Approved content moves to scheduling queue
5. Posts publish at designated times via LinkedIn API

## User Stories

### Epic 1: User Onboarding & Setup
- **US-001**: As a new user, I want to connect my Read.ai account so the system can receive my meeting transcripts
- **US-002**: As a user, I want to complete a brand voice analysis form so the system understands my company's voice and messaging
- **US-003**: As a user, I want to connect my LinkedIn account so the system can post content on my behalf
- **US-004**: As a user, I want to set my default posting times so content publishes when my audience is most active

### Epic 2: Content Generation
- **US-005**: As a user, I want the system to automatically process new meeting transcripts so I don't have to manually upload content
- **US-006**: As a user, I want the system to generate marketing hooks from my meetings so I have relevant content ideas
- **US-007**: As a user, I want the system to create LinkedIn posts from those hooks so I have ready-to-publish content
- **US-008**: As a user, I want the system to generate accompanying images so my posts are more engaging

### Epic 3: Content Management
- **US-009**: As a user, I want to see all generated content in an approval queue so I can review before posting
- **US-010**: As a user, I want to edit content inline so I can make quick adjustments without starting over
- **US-011**: As a user, I want to use custom rewrite prompts so I can modify content for specific needs
- **US-012**: As a user, I want to approve or reject individual posts so I maintain control over my brand messaging

### Epic 4: Publishing & Scheduling
- **US-013**: As a user, I want to schedule approved posts for optimal times so I maximize engagement
- **US-014**: As a user, I want to modify scheduled posting times so I can adapt to my audience's preferences
- **US-015**: As a user, I want posts to automatically publish to LinkedIn so I don't have to manually post content

## Success Metrics

### MVP Launch Metrics
- User completes onboarding within 10 minutes
- 80%+ of generated hooks are approved without major edits
- Average 3 LinkedIn posts per week per active user
- 90%+ successful automated posting rate

### Growth Metrics
- User retention: 70%+ monthly active users after 3 months
- Content approval rate: 75%+ of generated posts get approved
- Time savings: Users report 5+ hours saved per week on marketing

## Technical Considerations

### Security & Privacy
- Secure webhook endpoints for Read.ai integration
- Encrypted storage of LinkedIn API tokens
- GDPR-compliant data handling for meeting transcripts
- User consent for data processing and content generation

### Scalability
- Queue system for processing transcripts during high-volume periods
- Rate limiting for OpenAI/LinkedIn API calls
- Efficient database queries for content retrieval
- Horizontal scaling capability for web application

### Error Handling
- Graceful handling of webhook failures
- Retry mechanisms for failed API calls
- User notifications for processing errors
- Fallback options when content generation fails

## Future Enhancements (Post-MVP)

### Phase 2 Features
- Multi-platform posting (Twitter, Facebook, Instagram)
- Post performance analytics and optimization
- A/B testing for different hook variations
- Integration with additional meeting platforms (Zoom, Google Meet)

### Phase 3 Features
- AI-powered posting time optimization
- Advanced image customization and branding
- Team collaboration features
- Content calendar and campaign planning

## Implementation Timeline

### Week 1-2: Foundation
- Database schema design and setup
- Basic authentication and user management
- Read.ai webhook integration

### Week 3-4: Core Generation Engine
- Brand voice analysis system
- Marketing hook generation with structured prompts
- LinkedIn content creation pipeline

### Week 5-6: Content Management
- Approval queue interface
- Inline editing and rewrite functionality
- Image generation integration

### Week 7-8: Publishing & Polish
- LinkedIn API integration and posting
- Scheduling system
- UI/UX refinements and testing

## Dependencies & Risks

### External Dependencies
- Read.ai API stability and webhook reliability
- LinkedIn API rate limits and policy changes
- OpenAI/DALL-E API availability and cost structure

### Technical Risks
- Meeting transcript quality affecting content generation
- Brand voice analysis accuracy
- LinkedIn API authentication complexity

### Mitigation Strategies
- Build robust error handling and retry mechanisms
- Implement fallback content generation approaches
- Maintain buffer time in development schedule
- Regular testing with real meeting transcripts