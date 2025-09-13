# Marketing Machine - Comprehensive Test Plan

**Test Architect:** Quinn  
**Date:** 2025-09-12  
**Application:** Marketing Machine - AI-Powered LinkedIn Content Generator  
**Version:** Current Production Build  

## Executive Summary

This comprehensive test plan covers all functional areas, user journeys, and quality gates for the Marketing Machine application. The application transforms meeting transcripts into branded LinkedIn content using AI-powered brand voice analysis.

## Application Architecture Overview

### Frontend (React/TypeScript)
- **Framework:** React 18 + TypeScript + Vite
- **State Management:** TanStack Query + React hooks
- **Authentication:** Clerk.dev
- **UI Components:** Custom components + Tailwind CSS
- **Routing:** React Router DOM

### Backend (Node.js/Express)
- **Runtime:** Node.js + Express.js
- **Database:** SQLite (dev) with Prisma ORM
- **Authentication:** Clerk Express SDK  
- **Queue System:** Bull Queue with Redis
- **AI Integration:** OpenAI GPT API
- **Webhook Processing:** Read.ai integration

### Key Data Models
- **User:** Authentication and profile
- **Company:** Brand voice data and settings
- **Meeting:** Read.ai webhook data and transcripts
- **ContentHook:** AI-generated content hooks from meetings
- **ContentPost:** Final LinkedIn posts with approval workflow

---

## 1. USER JOURNEY MAPPING

### 1.1 New User Onboarding Journey
**Goal:** Complete setup from registration to first content generation

**Steps:**
1. **Landing Page** → Sign up via Clerk
2. **Authentication** → Clerk OAuth flow  
3. **Brand Voice Onboarding** → Multi-step questionnaire
4. **Dashboard Access** → View empty state with setup complete
5. **Webhook Setup** → Generate Read.ai webhook URL
6. **First Meeting** → Receive and process webhook data
7. **Content Review** → Approve/reject AI-generated posts

### 1.2 Daily User Workflow
**Goal:** Regular content management and approval

**Steps:**
1. **Dashboard View** → Check pending posts and stats
2. **Content Queue** → Review AI-generated posts
3. **Post Editing** → Modify content with AI rewrite
4. **Approval Process** → Approve/reject/schedule posts
5. **Meeting Management** → View processed meetings, reprocess if needed

### 1.3 Settings & Configuration Journey
**Goal:** Manage company settings and integrations

**Steps:**
1. **Company Settings** → Update brand voice data
2. **Webhook Management** → Generate/toggle webhook URLs
3. **Prompt Customization** → View/edit AI generation prompts
4. **Scheduling Configuration** → Set posting times and preferences

---

## 2. FUNCTIONAL TEST SCENARIOS

### 2.1 Authentication & Authorization
**Risk Level:** HIGH - Security critical

#### Test Cases:
- **AUTH-001:** Clerk sign-up flow with valid email
- **AUTH-002:** Clerk sign-in flow with existing user
- **AUTH-003:** Mock authentication in development mode
- **AUTH-004:** JWT token validation on protected routes
- **AUTH-005:** Session persistence across browser refresh
- **AUTH-006:** Sign-out and session cleanup

**Expected Results:**
- ✅ Users can register and authenticate successfully
- ✅ Protected routes require valid authentication
- ✅ Dev mode bypasses Clerk when configured

### 2.2 Brand Voice Onboarding
**Risk Level:** HIGH - Core business logic

#### Test Cases:
- **ONBOARD-001:** Complete brand voice questionnaire
- **ONBOARD-002:** Skip onboarding with URL parameter
- **ONBOARD-003:** Force onboarding with URL parameter
- **ONBOARD-004:** Partial completion and resume
- **ONBOARD-005:** Data validation and error handling
- **ONBOARD-006:** AI prompt generation after completion

**Expected Results:**
- ✅ Onboarding data saves to company.brandVoiceData
- ✅ Custom LinkedIn prompt generated automatically
- ✅ User redirected to dashboard after completion

### 2.3 Dashboard & Data Display
**Risk Level:** MEDIUM - User experience critical

#### Test Cases:
- **DASH-001:** Dashboard loads with correct stats
- **DASH-002:** Real-time data updates via TanStack Query
- **DASH-003:** Empty state handling for new users
- **DASH-004:** Error state handling for API failures
- **DASH-005:** Loading states during data fetch
- **DASH-006:** Responsive design across screen sizes

**Expected Results:**
- ✅ Dashboard shows accurate meeting and post counts
- ✅ Data refreshes automatically (10s stale time)
- ✅ Graceful error handling and user feedback

### 2.4 Webhook Processing
**Risk Level:** HIGH - Core data ingestion

#### Test Cases:
- **WEBHOOK-001:** Valid Read.ai webhook receives POST data
- **WEBHOOK-002:** Token-based authentication validation
- **WEBHOOK-003:** Webhook toggle enable/disable functionality
- **WEBHOOK-004:** Meeting data parsing and storage
- **WEBHOOK-005:** Transcript extraction from multiple formats
- **WEBHOOK-006:** Queue job creation and processing
- **WEBHOOK-007:** Duplicate meeting handling (reprocessing)
- **WEBHOOK-008:** Invalid webhook data rejection

**Expected Results:**
- ✅ Webhooks authenticate with company token
- ✅ Meeting data stored with correct associations
- ✅ Queue jobs process transcripts into content hooks

### 2.5 AI Content Generation
**Risk Level:** HIGH - Core business value

#### Test Cases:
- **AI-001:** Meeting transcript analysis and hook generation
- **AI-002:** Brand voice application in content generation
- **AI-003:** Content pillar association
- **AI-004:** LinkedIn post formatting and length limits
- **AI-005:** Error handling for API failures
- **AI-006:** Custom prompt utilization
- **AI-007:** Demo content generation
- **AI-008:** Content rewriting with user instructions

**Expected Results:**
- ✅ AI generates 3 hooks per meeting (configurable)
- ✅ Generated content reflects brand voice
- ✅ Content stays within LinkedIn character limits

### 2.6 Content Management & Approval
**Risk Level:** MEDIUM - Workflow critical

#### Test Cases:
- **CONTENT-001:** Content queue pagination and filtering
- **CONTENT-002:** Post status updates (pending → approved)
- **CONTENT-003:** Post content editing functionality  
- **CONTENT-004:** AI-powered content rewriting
- **CONTENT-005:** Post scheduling with date/time picker
- **CONTENT-006:** Post rejection and feedback
- **CONTENT-007:** Bulk operations (if implemented)

**Expected Results:**
- ✅ Users can approve, reject, edit, and schedule posts
- ✅ Status changes persist and update UI immediately
- ✅ Content modifications save correctly

### 2.7 Meeting Management
**Risk Level:** MEDIUM - Data management

#### Test Cases:
- **MEETING-001:** Meeting list display with pagination
- **MEETING-002:** Meeting reprocessing functionality
- **MEETING-003:** Meeting deletion with cascade cleanup
- **MEETING-004:** Meeting status updates (pending → completed)
- **MEETING-005:** Meeting detail views and transcripts

**Expected Results:**
- ✅ Meetings display with correct processing status
- ✅ Reprocessing regenerates content hooks
- ✅ Deletion removes all associated content

### 2.8 Company Settings
**Risk Level:** MEDIUM - Configuration critical

#### Test Cases:
- **SETTINGS-001:** Company profile updates
- **SETTINGS-002:** Brand voice data modifications
- **SETTINGS-003:** Webhook URL generation and rotation
- **SETTINGS-004:** Custom prompt viewing and editing
- **SETTINGS-005:** Prompt regeneration from brand voice
- **SETTINGS-006:** Scheduling preferences configuration

**Expected Results:**
- ✅ Settings changes save and reflect across app
- ✅ Webhook URLs include proper authentication tokens
- ✅ Custom prompts generate and can be manually edited

---

## 3. API ENDPOINT TESTING

### 3.1 Health & Status
| Endpoint | Method | Test Scenarios |
|----------|--------|---------------|
| `/health` | GET | Service availability, response time |

### 3.2 Authentication
| Endpoint | Method | Test Scenarios |
|----------|--------|---------------|
| All protected routes | ALL | Token validation, auth bypass in dev |

### 3.3 Company Management
| Endpoint | Method | Test Scenarios |
|----------|--------|---------------|
| `/api/company/current` | GET | Company retrieval, null handling |
| `/api/company` | POST | Company creation/update, validation |
| `/api/company/scheduling` | PUT | Schedule config updates |
| `/api/company/webhook` | GET | Webhook URL retrieval |
| `/api/company/webhook/generate` | POST | URL generation, token security |
| `/api/company/webhook/toggle` | PUT | Enable/disable functionality |
| `/api/company/prompt` | GET | Custom prompt retrieval |
| `/api/company/prompt` | PUT | Prompt updates, validation |
| `/api/company/prompt/regenerate` | POST | AI prompt regeneration |

### 3.4 Content Management
| Endpoint | Method | Test Scenarios |
|----------|--------|---------------|
| `/api/content/dashboard` | GET | Dashboard data aggregation |
| `/api/content/queue` | GET | Post queue with pagination/filtering |
| `/api/content/:id/status` | PUT | Status updates, validation |
| `/api/content/:id/content` | PUT | Content editing, validation |
| `/api/content/:id/rewrite` | POST | AI rewriting functionality |
| `/api/content/meetings` | GET | Meeting list retrieval |
| `/api/content/meetings/:id/reprocess` | POST | Meeting reprocessing |
| `/api/content/meetings/:id` | DELETE | Meeting deletion cascade |
| `/api/content/demo/generate` | POST | Demo content generation |

### 3.5 Webhook Processing
| Endpoint | Method | Test Scenarios |
|----------|--------|---------------|
| `/api/webhooks/readai/:companyId/:token` | POST | Data ingestion, authentication |

---

## 4. DATABASE INTEGRITY TESTING

### 4.1 Data Relationships
**Test Scenarios:**
- User → Company (one-to-one relationship)
- Company → Meetings (one-to-many relationship)  
- Meeting → ContentHooks (one-to-many relationship)
- ContentHook → ContentPosts (one-to-many relationship)
- Cascade deletion integrity
- Foreign key constraint enforcement

### 4.2 Data Validation
**Test Scenarios:**
- Required field validation
- JSON field structure validation
- Enum value constraints (PostStatus, ProcessedStatus)
- Index performance on large datasets
- Transaction rollback scenarios

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance Requirements
| Metric | Target | Test Method |
|--------|--------|-------------|
| Dashboard Load Time | < 2s | Automated timing |
| API Response Time | < 500ms | Load testing |
| Webhook Processing | < 5s | Queue monitoring |
| Content Generation | < 30s | End-to-end timing |
| Database Query Performance | < 100ms | Query analysis |

### 5.2 Security Requirements
| Area | Requirement | Test Method |
|------|-------------|-------------|
| Authentication | JWT validation on all protected routes | Security scanning |
| Authorization | User can only access own company data | Access control testing |
| Webhook Security | Token-based authentication required | Penetration testing |
| Data Encryption | Sensitive tokens encrypted at rest | Code review |
| Input Validation | All user input sanitized | OWASP testing |

### 5.3 Reliability Requirements
| Area | Target | Test Method |
|------|--------|-------------|
| Uptime | 99.9% | Monitoring |
| Error Recovery | Automatic retry on transient failures | Chaos testing |
| Data Backup | Zero data loss on failures | Backup verification |
| Queue Processing | Failed jobs retry with exponential backoff | Queue monitoring |

---

## 6. BROWSER & DEVICE COMPATIBILITY

### 6.1 Browser Support
**Priority 1 (Must Work):**
- Chrome 90+ (Desktop/Mobile)
- Firefox 88+ (Desktop)
- Safari 14+ (Desktop/Mobile)
- Edge 90+ (Desktop)

**Priority 2 (Should Work):**
- Older browser versions with graceful degradation

### 6.2 Device Testing
- Desktop: 1920x1080, 1366x768
- Tablet: iPad (1024x768), Android tablets
- Mobile: iPhone (375x667), Android (360x640)
- Accessibility: Screen readers, keyboard navigation

---

## 7. QUALITY GATES & ACCEPTANCE CRITERIA

### 7.1 PASS Criteria
✅ **All authentication flows work correctly**
✅ **Brand onboarding completes and generates custom prompts**
✅ **Webhooks process Read.ai data successfully**
✅ **AI content generation produces relevant, branded content**
✅ **Content approval workflow functions end-to-end**
✅ **Settings and configuration changes persist**
✅ **No critical security vulnerabilities**
✅ **Performance meets target thresholds**
✅ **Cross-browser compatibility maintained**

### 7.2 CONCERNS Criteria  
⚠️ **Minor UI/UX issues that don't block core functionality**
⚠️ **Performance slightly below targets but acceptable**
⚠️ **Non-critical edge cases not handled**
⚠️ **Minor accessibility improvements needed**

### 7.3 FAIL Criteria
❌ **Authentication system compromised or non-functional**
❌ **Core content generation pipeline broken**
❌ **Data loss or corruption scenarios**
❌ **Critical security vulnerabilities**
❌ **Application crashes or becomes unresponsive**

---

## 8. TEST EXECUTION STRATEGY

### 8.1 Manual Testing Priority
**High Priority (Test First):**
1. Authentication & onboarding flow
2. Webhook processing and content generation
3. Content approval and management workflow
4. Settings and configuration changes

**Medium Priority:**
1. Dashboard and data display
2. Meeting management
3. API error handling
4. Cross-browser compatibility

**Low Priority:**
1. Edge cases and error scenarios
2. Performance optimization
3. Accessibility enhancements

### 8.2 Automated Testing Recommendations
- **Unit Tests:** API endpoints, business logic functions
- **Integration Tests:** Database operations, queue processing  
- **E2E Tests:** Critical user journeys with Playwright/Cypress
- **Performance Tests:** Load testing with k6 or Artillery

---

## 9. RISK ASSESSMENT MATRIX

| Risk Area | Probability | Impact | Priority | Mitigation |
|-----------|-------------|---------|----------|------------|
| Webhook Authentication Bypass | Low | High | HIGH | Token validation testing |
| AI API Rate Limiting | Medium | High | HIGH | Error handling & retry logic |
| Data Corruption During Migration | Low | High | HIGH | Backup procedures |
| Third-party Service Downtime | High | Medium | MEDIUM | Graceful degradation |
| Cross-browser Compatibility Issues | Medium | Low | LOW | Progressive enhancement |

---

## 10. TEST DATA REQUIREMENTS

### 10.1 Test Company Data
- **Company 1:** Complete brand voice profile (B2B SaaS)
- **Company 2:** Minimal brand voice profile (Consulting)
- **Company 3:** Rich brand voice profile (E-commerce)

### 10.2 Test Meeting Data
- **Meeting 1:** Rich transcript with multiple speakers
- **Meeting 2:** Short transcript with summary only
- **Meeting 3:** Technical discussion (edge case content)
- **Meeting 4:** Invalid/malformed data (error testing)

### 10.3 User Personas
- **New User:** No company setup, needs onboarding
- **Active User:** Complete setup, regular usage patterns
- **Admin User:** Company management and configuration
- **Power User:** Heavy content generation and customization

---

**Quality Gate Decision: PENDING**  
*Awaiting test execution results*

**Next Steps:**
1. Execute high-priority manual test scenarios
2. Set up automated test infrastructure
3. Performance benchmark establishment  
4. Security assessment completion

---

*Test Plan Version: 1.0*  
*Last Updated: 2025-09-12*  
*Test Architect: Quinn - BMad QA Team*