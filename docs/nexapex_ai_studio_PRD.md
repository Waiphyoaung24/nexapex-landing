# NexApex.ai AI Solutions Studio — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-19
**Author:** PRD Generator
**Status:** Draft
**Company:** NexApex.ai
**Founder/CTO:** Wai Phyo Aung

---

## Executive Summary

NexApex AI Studio is an interactive demo-driven platform that transforms the existing NexApex.ai marketing site into a live showcase of AI capabilities. Instead of static product pages, prospective SME clients can try real AI demos — computer vision object detection, fine-tuned LLM chat, and document intelligence — directly on the site. The platform targets SMEs in Myanmar and Thailand who need custom AI solutions but cannot afford traditional consultancies. By letting prospects experience the technology before buying, NexApex converts visitors into project clients ($2K-$10K per engagement) with minimal sales friction. MVP target: 4-6 weeks, solo build.

---

## Problem Statement

**Current state:** SMEs in Southeast Asia are increasingly aware of AI's potential but face three barriers: (1) big consultancies charge $50K+ and target enterprises, (2) generic AI tools don't solve industry-specific problems, and (3) there's no way to "try before you buy" — SMEs must commit budget based on promises alone.

**Pain points:**
1. **Trust gap** — SME owners have seen AI demos online but don't believe it works for *their* specific use case until they see it applied to *their* data
2. **Cost barrier** — Professional AI development starts at $50K+ from established firms; most SEA SMEs have budgets under $10K
3. **Talent scarcity** — Few developers in Myanmar/Thailand can deliver end-to-end AI products (model training → backend → mobile deployment)
4. **Vendor lock-in fear** — SMEs worry about depending on solutions they can't understand or maintain
5. **No local providers** — Most AI service companies operate from Singapore, India, or the West with no SEA-specific domain expertise

**Impact:** SMEs that delay AI adoption lose competitive advantage to larger competitors who can afford enterprise solutions. The SEA AI services market is projected at $15B+ by 2028, with SME adoption being the primary growth driver.

---

## Goals & Success Metrics

| Goal | Metric | Target | Measurement Method |
|------|--------|--------|-------------------|
| Generate qualified leads | Email signups through demo gate | 100 in first 3 months | Database count |
| Convert demos to calls | Demo-to-booking conversion rate | > 8% | Analytics funnel |
| Close project deals | Signed project engagements | 3 in first 6 months | CRM tracking |
| Demonstrate AI accuracy | Vision demo detection confidence | > 85% mAP on general objects | Model evaluation |
| User engagement | Average demo session duration | > 3 minutes | Analytics |
| Demo completion rate | Users who complete at least 1 full demo | > 60% of signups | Event tracking |

---

## User Personas

### SME Business Owner (Primary)
- **Role:** Owner or GM of a small-medium business (10-200 employees) in manufacturing, F&B, retail, or agriculture
- **Goals:** Automate manual processes, reduce operational costs, improve quality control
- **Pain points:** Doesn't understand AI technically; needs to see results before committing budget; limited time to evaluate vendors
- **Technical proficiency:** Low
- **Usage context:** Visits nexapex.ai from a referral, LinkedIn post, or search. Wants to understand what AI can do for their specific business within 5 minutes

### Operations / IT Manager (Secondary)
- **Role:** Technical decision-maker at an SME who evaluates tools and vendors
- **Goals:** Find a reliable AI partner who can deliver and maintain solutions; needs technical credibility
- **Pain points:** Has been burned by vendors who oversell and underdeliver; needs proof of capability
- **Technical proficiency:** Medium-High
- **Usage context:** Runs demos with their own data to validate capability. Reviews technical architecture. Reports findings to the business owner

### Startup Founder (Tertiary)
- **Role:** Founder building a product that needs AI capabilities (vision, NLP, or document processing)
- **Goals:** Find a technical partner or AI-focused CTO-as-a-service to build their AI-powered MVP
- **Pain points:** Can't afford a full-time ML engineer; needs someone who ships end-to-end (not just models)
- **Technical proficiency:** Medium
- **Usage context:** Explores demos to validate NexApex's breadth of capability. Looking for a long-term technical partner

---

## Functional Requirements

### FR-001: Email-Gated Demo Access

**Description:** Visitors must provide their email (and optionally company name + industry) before accessing any demo.

**User story:** As a site visitor, I want to sign up quickly so that I can try the AI demos without friction.

**Acceptance criteria:**
- [ ] Sign-up form collects: email (required), name (required), company name (optional), industry dropdown (optional)
- [ ] Form validation completes in < 200ms client-side
- [ ] Successful signup stores lead in database and sends a welcome email within 30 seconds
- [ ] After signup, user is redirected to the demo hub with all 3 demos accessible
- [ ] Returning users can access demos by entering their email (magic link or simple lookup — no password)
- [ ] Rate limit: max 5 signup attempts per IP per hour

**Priority:** P0

**Dependencies:** None

---

### FR-002: Vision Inspector Demo

**Description:** Users upload an image or use their device camera to run real-time object detection powered by a YOLO model. Results show bounding boxes, class labels, and confidence scores.

**User story:** As an SME owner, I want to upload a photo and see AI detect objects in it so that I can understand how computer vision could apply to my business.

**Acceptance criteria:**
- [ ] Supports image upload (JPEG, PNG, WebP) up to 10MB
- [ ] Supports live camera feed on mobile and desktop browsers
- [ ] Inference returns results in < 3 seconds for uploaded images
- [ ] Results display: bounding boxes overlaid on image, class labels, confidence percentages
- [ ] Minimum 80 COCO classes detected (people, vehicles, animals, household objects, food, etc.)
- [ ] Results include a "How this applies to your business" section with 2-3 contextual suggestions based on detected objects
- [ ] Users can download annotated image as PNG
- [ ] Demo limits: 10 inferences per session before prompting to book a call
- [ ] Graceful error handling for unsupported formats, oversized files, and model timeouts

**Priority:** P0

**Dependencies:** FR-001

---

### FR-003: Smart Assistant Demo (Fine-Tuned LLM Chat)

**Description:** An interactive chat interface powered by a fine-tuned LLM that demonstrates NexApex's custom AI assistant capabilities. The assistant is trained to be a helpful business AI consultant that understands SEA market context.

**User story:** As an SME owner, I want to chat with an AI assistant about my business challenges so that I can see how a custom-trained AI could help my operations.

**Acceptance criteria:**
- [ ] Chat UI with message bubbles, typing indicator, and timestamp
- [ ] Supports Burmese, Thai, and English input/output (auto-detected or user-selected)
- [ ] First response generated in < 2 seconds (streaming)
- [ ] Conversation context maintained for up to 20 messages per session
- [ ] Assistant introduces itself as "NexApex AI" and guides users to describe their business problem
- [ ] Responses include actionable suggestions with "NexApex can build this for you" CTAs where relevant
- [ ] Chat history exportable as text/PDF
- [ ] Demo limits: 20 messages per session before prompting to book a call
- [ ] Input sanitization prevents prompt injection and inappropriate content

**Priority:** P0

**Dependencies:** FR-001

---

### FR-004: Document Intelligence Demo

**Description:** Users upload a document (PDF, image of a document, or photo of a receipt/invoice) and the system extracts structured data using OCR + RAG pipeline.

**User story:** As an operations manager, I want to upload a business document and see AI extract key data from it so that I can evaluate automated document processing for my company.

**Acceptance criteria:**
- [ ] Supports PDF (up to 5 pages), JPEG, PNG uploads up to 15MB
- [ ] Extracts: text content, key-value pairs (dates, amounts, names, addresses), table data
- [ ] Results displayed in structured JSON view and human-readable summary
- [ ] Processing completes in < 10 seconds for single-page documents
- [ ] Handles documents in English, Burmese, and Thai
- [ ] Extracted data downloadable as JSON or CSV
- [ ] Demo limits: 5 documents per session before prompting to book a call
- [ ] Uploaded documents are deleted from server within 1 hour (privacy notice displayed)

**Priority:** P1

**Dependencies:** FR-001

---

### FR-005: Demo Hub Dashboard

**Description:** Central page after login showing all 3 demo modules with descriptions, use case examples, and usage counters.

**User story:** As a logged-in user, I want to see all available demos in one place so that I can choose which AI capability to explore.

**Acceptance criteria:**
- [ ] Displays 3 demo cards: Vision Inspector, Smart Assistant, Document Intelligence
- [ ] Each card shows: icon, title, 1-line description, "Try Now" button, usage counter (X/N remaining)
- [ ] Cards show industry-specific use case examples (manufacturing, F&B, retail, agriculture)
- [ ] Responsive layout: 3-column grid on desktop, single column scrollable on mobile
- [ ] Page loads in < 1.5 seconds
- [ ] Includes a persistent "Book a Consultation" CTA button

**Priority:** P0

**Dependencies:** FR-001

---

### FR-006: Consultation Booking

**Description:** Integrated booking system for prospects to schedule a call with the NexApex team after trying demos.

**User story:** As a prospect impressed by a demo, I want to book a consultation call so that I can discuss a custom AI solution for my business.

**Acceptance criteria:**
- [ ] Calendar widget showing available time slots (integrated with Google Calendar or Cal.com)
- [ ] Booking form pre-fills email and name from demo signup
- [ ] Includes field for "What problem do you want to solve?" (textarea)
- [ ] Confirmation email sent within 30 seconds of booking
- [ ] Booking creates a lead record with demo usage history attached
- [ ] Supports timezone selection (default: Asia/Bangkok)

**Priority:** P0

**Dependencies:** FR-001

---

### FR-007: Admin Analytics Dashboard

**Description:** Internal dashboard for NexApex team to track leads, demo usage, and conversion funnel.

**User story:** As the NexApex founder, I want to see how many people signed up, which demos they tried, and who booked calls so that I can optimize the funnel and follow up with hot leads.

**Acceptance criteria:**
- [ ] Displays: total signups, demo usage by type, conversion rates, booking count
- [ ] Lead list with: email, company, industry, demos tried, last active, booking status
- [ ] Filterable by date range, industry, and demo type
- [ ] Export leads as CSV
- [ ] Protected by admin authentication (separate from demo signup)
- [ ] Real-time updates (polling every 30 seconds or WebSocket)

**Priority:** P1

**Dependencies:** FR-001, FR-006

---

### FR-008: Mobile Flutter Demo App (QR Access)

**Description:** A companion Flutter app that showcases mobile-specific AI capabilities — particularly the camera-based Vision Inspector running on-device inference.

**User story:** As an SME owner at a trade show or meeting, I want to scan a QR code and instantly try AI on my phone so that I can see how mobile AI deployment works in practice.

**Acceptance criteria:**
- [ ] QR code on nexapex.ai opens the app in App Store / Play Store or a web fallback
- [ ] Vision Inspector runs on-device using TensorFlow Lite / ONNX (no server round-trip for basic detection)
- [ ] Camera feed shows real-time bounding boxes at > 15 FPS on mid-range devices
- [ ] App includes the same email gate as the web platform (shared lead database)
- [ ] Offline-capable: basic object detection works without internet
- [ ] App size < 50MB
- [ ] Supports iOS 15+ and Android 10+

**Priority:** P2

**Dependencies:** FR-001, FR-002

---

## Non-Functional Requirements

### Performance
- Marketing pages load in < 2 seconds (LCP) on 4G connections
- Demo pages load in < 3 seconds including model initialization
- Vision inference API response: < 3 seconds for images up to 10MB
- LLM chat first token: < 1 second (streaming)
- Document extraction: < 10 seconds per page
- Concurrent demo users supported: 50 simultaneous

### Security
- Authentication: Magic link email (no passwords to manage)
- Admin auth: Email + password with 2FA (TOTP)
- Data encryption: TLS 1.3 in transit, AES-256 at rest for uploaded files
- Uploaded files auto-deleted after 1 hour
- Input sanitization on all user inputs (prevent XSS, SQL injection, prompt injection)
- Rate limiting: 100 API requests per user per hour
- CORS restricted to nexapex.ai domain

### Scalability
- Expected initial load: 50-100 demo users/month
- Growth target: 500 demo users/month within 6 months
- Scaling approach: Serverless inference endpoints (auto-scale), static frontend (CDN)
- Model serving: Single GPU instance initially, auto-scale to 2-3 for peak loads

### Availability
- Uptime target: 99.5% (allows ~3.6 hours downtime/month — acceptable for MVP)
- Database backup: Daily automated snapshots (Neon)
- Disaster recovery: RTO 4 hours, RPO 24 hours

---

## Technical Architecture

### System Overview

The platform extends the existing NexApex.ai Astro site with interactive demo pages that call a FastAPI inference backend. The backend serves 3 AI pipelines: YOLO object detection, fine-tuned LLM chat (via Unsloth-exported model), and OCR + document extraction. A Flutter companion app reuses the same API endpoints for mobile-native demos.

### Technology Stack

- **Frontend (Marketing):** Astro 5 + React 19 + Tailwind CSS 4 + Three.js + GSAP (existing site)
- **Frontend (Demos):** React components within Astro islands — interactive demo UIs
- **Backend (API):** FastAPI + Python 3.11 + Pydantic v2
- **AI/ML:**
  - Vision: YOLOv8/v11 (Ultralytics) + OpenCV for pre/post-processing
  - LLM: Fine-tuned model via Unsloth → exported to GGUF → served via vLLM or llama.cpp
  - Document: Tesseract OCR + Gemini API for structured extraction
- **Database:** Neon PostgreSQL (leads, analytics, admin)
- **Storage:** Cloudflare R2 or Supabase Storage (temporary file uploads)
- **Hosting:**
  - Frontend: Cloudflare Pages or Vercel (static + edge)
  - Backend: Railway or Fly.io (GPU-capable for inference)
  - Mobile: App Store + Play Store
- **Email:** Resend or SendGrid (transactional emails)
- **Booking:** Cal.com embed or Google Calendar API
- **Analytics:** PostHog (self-hosted or cloud) for funnel tracking
- **Mobile:** Flutter 3 + TensorFlow Lite (on-device inference)

### Architecture Diagram (Description)

```
User visits nexapex.ai (Astro static site on Cloudflare Pages)
  → Email gate collects lead → stored in Neon PostgreSQL
  → User enters Demo Hub (React island)

Vision Demo:
  → User uploads image or streams camera
  → POST /api/v1/vision/detect (FastAPI on Railway/Fly.io)
  → YOLOv8 inference → returns bounding boxes + labels
  → Frontend renders annotated image with overlay

LLM Chat Demo:
  → User sends message
  → POST /api/v1/chat/stream (SSE streaming)
  → Fine-tuned model (vLLM/llama.cpp) generates response
  → Frontend displays streamed tokens

Document Demo:
  → User uploads PDF/image
  → POST /api/v1/docs/extract
  → Tesseract OCR → Gemini structured extraction
  → Returns JSON key-value pairs + summary

Mobile App (Flutter):
  → Same API endpoints for cloud features
  → TFLite model for on-device vision (offline capable)
  → Shared lead database via API

Admin Dashboard:
  → Protected route on /admin
  → Reads from Neon PostgreSQL
  → Displays leads, usage analytics, conversion funnel
```

---

## API Specifications

### POST /api/v1/auth/signup

**Purpose:** Register a new demo user and create a lead record

**Authentication:** None

**Request:**
```json
{
  "email": "string — required, valid email",
  "name": "string — required, 2-100 chars",
  "company": "string — optional, company name",
  "industry": "string — optional, enum: manufacturing|fnb|retail|agriculture|technology|other"
}
```

**Response (201):**
```json
{
  "id": "string — UUID",
  "email": "string",
  "name": "string",
  "token": "string — JWT access token, expires in 24h",
  "demos_remaining": {
    "vision": 10,
    "chat": 20,
    "document": 5
  }
}
```

**Error responses:**
- 400: Invalid email format or missing required fields
- 409: Email already registered (returns existing token via magic link)
- 429: Rate limit exceeded

---

### POST /api/v1/vision/detect

**Purpose:** Run object detection on an uploaded image

**Authentication:** Required (Bearer token from signup)

**Request:** `multipart/form-data`
- `image`: file (JPEG/PNG/WebP, max 10MB)
- `confidence_threshold`: float (optional, default 0.5)

**Response (200):**
```json
{
  "detections": [
    {
      "class": "string — object class name",
      "confidence": 0.95,
      "bbox": [x1, y1, x2, y2],
      "area_percentage": 12.5
    }
  ],
  "processing_time_ms": 1200,
  "image_dimensions": {"width": 1920, "height": 1080},
  "suggestions": [
    "This type of detection can be used for inventory counting in retail",
    "NexApex can train a custom model specific to your products"
  ],
  "demos_remaining": 9
}
```

**Error responses:**
- 400: Unsupported file format or file too large
- 401: Invalid or expired token
- 429: Demo limit reached — prompt to book consultation

---

### POST /api/v1/chat/stream

**Purpose:** Send a message to the fine-tuned LLM assistant and receive streamed response

**Authentication:** Required (Bearer token)

**Request:**
```json
{
  "message": "string — user message, max 2000 chars",
  "conversation_id": "string — optional, UUID to continue conversation",
  "language": "string — optional, enum: en|my|th, auto-detected if omitted"
}
```

**Response (200):** Server-Sent Events (SSE) stream
```
data: {"token": "Hello", "conversation_id": "uuid-123"}
data: {"token": ", how", "conversation_id": "uuid-123"}
data: {"token": " can I help", "conversation_id": "uuid-123"}
data: {"token": "?", "conversation_id": "uuid-123", "done": true, "demos_remaining": 19}
```

**Error responses:**
- 400: Message too long or empty
- 401: Invalid or expired token
- 429: Demo limit reached

---

### POST /api/v1/docs/extract

**Purpose:** Extract structured data from an uploaded document

**Authentication:** Required (Bearer token)

**Request:** `multipart/form-data`
- `file`: file (PDF/JPEG/PNG, max 15MB, PDF max 5 pages)

**Response (200):**
```json
{
  "raw_text": "string — extracted text content",
  "structured_data": {
    "key_value_pairs": [
      {"key": "Invoice Number", "value": "INV-2026-001", "confidence": 0.98}
    ],
    "tables": [
      {
        "headers": ["Item", "Qty", "Price"],
        "rows": [["Widget A", "10", "$5.00"]]
      }
    ],
    "dates": ["2026-03-19"],
    "amounts": ["$50.00", "$8.50"]
  },
  "summary": "string — 2-3 sentence summary of document contents",
  "processing_time_ms": 4500,
  "demos_remaining": 4
}
```

**Error responses:**
- 400: Unsupported format, file too large, or PDF exceeds 5 pages
- 401: Invalid or expired token
- 429: Demo limit reached

---

### GET /api/v1/admin/leads

**Purpose:** List all registered leads with demo usage data

**Authentication:** Required (Admin Bearer token)

**Request query params:**
- `page`: int (default 1)
- `limit`: int (default 50, max 200)
- `industry`: string (optional filter)
- `date_from`: ISO date (optional)
- `date_to`: ISO date (optional)
- `has_booking`: boolean (optional)

**Response (200):**
```json
{
  "leads": [
    {
      "id": "uuid",
      "email": "user@company.com",
      "name": "John",
      "company": "Thai Foods Co.",
      "industry": "manufacturing",
      "created_at": "2026-03-19T10:00:00Z",
      "demos_used": {"vision": 5, "chat": 12, "document": 2},
      "last_active": "2026-03-19T14:30:00Z",
      "has_booking": true,
      "booking_date": "2026-03-22T09:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 3
}
```

---

## UI/UX Requirements

### Email Gate / Signup Page

**Purpose:** Collect lead information before granting demo access

**Key elements:**
- NexApex logo and tagline ("AI Solutions for Southeast Asian Businesses")
- Signup form: email, name, company (optional), industry dropdown (optional)
- "Try Our AI" primary CTA button (cyan accent #94fcff, matching brand)
- Social proof: "Trusted by businesses in Myanmar & Thailand" + client logos if available
- 1-line privacy notice: "Your data is never shared. Uploads auto-delete in 1 hour."

**User flow:**
1. Visitor lands on demo page → sees email gate overlay
2. Fills in email + name → clicks "Try Our AI"
3. System creates lead, returns JWT → redirects to Demo Hub
4. Returning users: enter email → magic link sent → click to access

**States:**
- Empty state: Clean form, focused on email field
- Loading state: Button shows spinner, disabled
- Error state: Inline validation messages (red text below field)
- Success state: Brief "Welcome!" flash → redirect to Demo Hub

---

### Demo Hub

**Purpose:** Central navigation to all 3 AI demo modules

**Key elements:**
- 3 demo cards in a grid (matches NexApex cinematic aesthetic — dark theme, cyan accents, glassmorphism)
- Each card: icon/animation, title, description, "Try Now" button, usage counter badge
- Sidebar or top bar: user email, "Book Consultation" button, remaining demo counts
- Industry context: small tags showing "Great for: Manufacturing, Retail, F&B"

**User flow:**
1. User sees 3 demo cards
2. Clicks "Try Now" on any card
3. Navigates to that demo's full-page experience
4. Can return to hub via breadcrumb or back button

---

### Vision Inspector Demo Page

**Purpose:** Interactive object detection experience

**Key elements:**
- Split layout: left = upload zone / camera view, right = results panel
- Upload zone: drag-and-drop area with "Upload Image" and "Use Camera" buttons
- Results panel: annotated image with bounding boxes, detection list (class + confidence), business suggestions
- "Download Result" button for annotated image
- Bottom CTA: "Want a model trained on YOUR products? Book a call."

**States:**
- Empty: Upload zone with sample images to try ("Try with these examples")
- Loading: Progress bar + "Analyzing..." animation
- Results: Annotated image + detection list + suggestions
- Limit reached: Gentle overlay — "You've used all 10 demos. Book a free consultation to see more."

---

### Smart Assistant Chat Page

**Purpose:** Interactive LLM chat demonstrating custom AI assistant capability

**Key elements:**
- Full-screen chat interface (dark theme, matching brand)
- Message bubbles: user (right, dark gray), assistant (left, cyan border)
- Language selector: EN / MY / TH toggle
- Typing indicator with NexApex branding
- Suggested prompts: "How can AI help my restaurant?", "What can computer vision do for manufacturing?"
- "Export Chat" button

**States:**
- Empty: Welcome message from NexApex AI + 3-4 suggested prompt buttons
- Active: Message thread with streaming responses
- Limit reached: Final message from assistant suggesting to book a call

---

### Document Intelligence Demo Page

**Purpose:** Document upload and structured data extraction

**Key elements:**
- Upload zone for PDF/image files
- Results: two-panel view — original document (left), extracted data (right)
- Extracted data tabs: "Key-Value Pairs", "Tables", "Summary"
- "Download as JSON" and "Download as CSV" buttons
- Sample documents available ("Try with a sample invoice")

---

## Data Models

### Lead

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| email | VARCHAR(255) | Yes | Unique, indexed |
| name | VARCHAR(100) | Yes | Full name |
| company | VARCHAR(200) | No | Company name |
| industry | ENUM | No | manufacturing, fnb, retail, agriculture, technology, other |
| token_hash | VARCHAR(64) | Yes | Hashed JWT token for auth |
| vision_demos_used | INT | Yes | Default 0, max 10 |
| chat_demos_used | INT | Yes | Default 0, max 20 |
| doc_demos_used | INT | Yes | Default 0, max 5 |
| last_active_at | TIMESTAMP | No | Last demo usage |
| created_at | TIMESTAMP | Yes | Registration time |
| updated_at | TIMESTAMP | Yes | Last update |

**Indexes:**
- email (unique) — for login lookups
- created_at — for admin date filtering
- industry — for admin filtering

---

### DemoSession

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| lead_id | UUID | Yes | FK to Lead |
| demo_type | ENUM | Yes | vision, chat, document |
| input_metadata | JSONB | No | File size, type, dimensions (no PII) |
| result_summary | JSONB | No | Detection count, response length, extraction count |
| processing_time_ms | INT | Yes | Inference duration |
| created_at | TIMESTAMP | Yes | Session timestamp |

**Relationships:**
- Many-to-one to Lead

**Indexes:**
- lead_id — for user session history
- demo_type + created_at — for analytics aggregation

---

### Booking

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| lead_id | UUID | Yes | FK to Lead |
| scheduled_at | TIMESTAMP | Yes | Booking datetime (UTC) |
| timezone | VARCHAR(50) | Yes | IANA timezone |
| problem_description | TEXT | No | What problem they want to solve |
| status | ENUM | Yes | pending, confirmed, completed, cancelled |
| calendar_event_id | VARCHAR(255) | No | External calendar reference |
| created_at | TIMESTAMP | Yes | Booking creation time |

**Relationships:**
- Many-to-one to Lead

---

### AdminUser

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| email | VARCHAR(255) | Yes | Unique |
| password_hash | VARCHAR(255) | Yes | bcrypt hash |
| totp_secret | VARCHAR(32) | No | 2FA secret |
| role | ENUM | Yes | admin, viewer |
| created_at | TIMESTAMP | Yes | Account creation |

---

## Integration Points

### Cal.com (Booking)

**Purpose:** Embed scheduling widget for consultation bookings

**Integration type:** Embed SDK + Webhook

**Data exchanged:**
- Inbound: Booking confirmation webhook (datetime, attendee info)
- Outbound: Pre-filled attendee name/email from lead record

**Authentication:** API key for webhook verification

**Fallback behavior:** If Cal.com is down, show a "Email us at hello@nexapex.ai" fallback with mailto link

---

### Resend (Email)

**Purpose:** Transactional emails — welcome, magic link, booking confirmation

**Integration type:** REST API (SDK)

**Data exchanged:**
- Outbound: Email address, subject, HTML body
- Inbound: Delivery status webhooks

**Authentication:** API key

**Rate limits:** 100 emails/day on free tier, 50K/month on pro ($20/mo)

**Fallback behavior:** Queue emails for retry; log failures for manual follow-up

---

### PostHog (Analytics)

**Purpose:** Track demo funnel, user behavior, and conversion events

**Integration type:** JavaScript SDK (frontend) + Python SDK (backend)

**Data exchanged:**
- Outbound: Page views, demo starts, demo completions, booking clicks, signup events
- Inbound: None (dashboard only)

**Authentication:** Project API key

**Fallback behavior:** Analytics failure is silent — never blocks user experience

---

### Google Gemini API (Document Extraction)

**Purpose:** Structured data extraction from OCR output

**Integration type:** REST API

**Data exchanged:**
- Outbound: OCR text + extraction prompt
- Inbound: Structured JSON response

**Authentication:** API key

**Rate limits:** 60 RPM on free tier, 1000 RPM on pay-as-you-go

**Fallback behavior:** Return raw OCR text without structured extraction if Gemini is unavailable

---

## Edge Cases & Error Handling

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User uploads a 50MB image to Vision demo | Client-side validation rejects before upload; shows "Max 10MB" error |
| User uploads a blank/white image | Model returns 0 detections; show "No objects detected. Try a different image." |
| User sends prompt injection to LLM chat | System prompt guardrails reject; respond with "I can only help with business-related questions." |
| User uploads a non-document image to Doc Intelligence | OCR returns minimal text; show "This doesn't appear to be a document. Try uploading a PDF or photo of a document." |
| User's session token expires mid-demo | Show gentle re-auth modal; preserve any in-progress work |
| Concurrent users exceed GPU capacity | Queue requests with position indicator; timeout after 30 seconds with retry suggestion |
| User signs up with a disposable email | Allow it — lead quality filtering is an admin-side concern, not a gate |
| Camera permission denied on mobile | Show fallback upload-only mode with clear "Enable camera for live detection" prompt |

### Error Handling Strategy

- **User-facing errors:** Friendly messages in the brand voice. Never show stack traces. Always suggest a next action.
- **System errors:** Log to structured logging (JSON) with request ID, user ID, error type. Alert on error rate > 5% via PostHog or simple webhook to Slack.
- **Retry logic:** Inference API retries once after 5-second timeout. Email delivery retries 3 times with exponential backoff.
- **Graceful degradation:** If inference backend is down, show cached sample results with "Live demo temporarily unavailable — here's an example of what our AI can do" + booking CTA.

---

## Testing Requirements

### Unit Tests
- Auth: JWT generation, validation, expiry, magic link flow
- Vision: Image preprocessing, YOLO output parsing, suggestion generation
- Chat: Message sanitization, conversation context management, streaming serialization
- Docs: OCR text cleaning, structured extraction parsing, file type validation
- Lead: CRUD operations, demo counter increment, rate limiting

### Integration Tests
- Full signup → demo → booking flow (happy path)
- Vision: Upload image → receive detections → download annotated image
- Chat: Send message → receive streamed response → maintain conversation context
- Docs: Upload PDF → receive structured JSON → download CSV export
- Admin: Login → view leads → filter → export CSV

### E2E Tests
- Complete user journey: land on site → signup → try all 3 demos → book consultation
- Mobile responsive: signup + vision demo on mobile viewport
- Rate limiting: exhaust demo limits → verify gating message appears
- Returning user: signup → close browser → return → access demos with email

### Performance Tests
- Vision inference: 50 concurrent image uploads → all complete in < 5 seconds
- Chat: 20 concurrent streaming sessions → all first tokens in < 2 seconds
- Page load: Lighthouse score > 90 for marketing pages
- API: 100 req/sec sustained for 60 seconds without errors

---

## Implementation Notes for AI

### Build Order
1. **Database schema** (Neon PostgreSQL — Lead, DemoSession, Booking, AdminUser tables)
2. **FastAPI backend scaffold** (auth, middleware, CORS, error handling)
3. **Auth endpoints** (signup, magic link, token validation)
4. **Vision inference endpoint** (YOLO model loading, image processing, detection API)
5. **Chat endpoint** (model loading, streaming SSE, conversation management)
6. **Document extraction endpoint** (OCR pipeline, Gemini integration)
7. **Frontend demo components** (React islands within Astro — Vision, Chat, Doc UIs)
8. **Email gate UI** (signup form, magic link flow)
9. **Demo Hub page** (card layout, usage counters)
10. **Admin dashboard** (leads table, analytics charts, CSV export)
11. **Booking integration** (Cal.com embed, webhook handler)
12. **Analytics integration** (PostHog events)
13. **Flutter mobile app** (P2 — after web MVP is validated)

### File Structure Suggestion

```
nexapex-studio/
├── frontend/                    # Astro site (extends existing nexapex-web)
│   ├── src/
│   │   ├── components/
│   │   │   ├── cinematic/       # Existing animation engine
│   │   │   ├── demos/           # NEW: Demo UI components (React)
│   │   │   │   ├── VisionInspector.tsx
│   │   │   │   ├── SmartAssistant.tsx
│   │   │   │   ├── DocIntelligence.tsx
│   │   │   │   ├── DemoHub.tsx
│   │   │   │   └── EmailGate.tsx
│   │   │   └── admin/           # NEW: Admin dashboard components
│   │   ├── pages/
│   │   │   ├── index.astro      # Existing home page
│   │   │   ├── demos/           # NEW: Demo pages
│   │   │   │   ├── index.astro  # Demo Hub
│   │   │   │   ├── vision.astro
│   │   │   │   ├── chat.astro
│   │   │   │   └── docs.astro
│   │   │   └── admin/           # NEW: Admin pages
│   │   └── lib/
│   │       ├── api.ts           # API client
│   │       └── auth.ts          # Token management
│   └── astro.config.mjs
│
├── backend/                     # FastAPI inference API
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, middleware
│   │   ├── config.py            # Environment config
│   │   ├── auth/
│   │   │   ├── router.py        # /auth/signup, /auth/verify
│   │   │   ├── jwt.py           # Token creation/validation
│   │   │   └── models.py        # Auth Pydantic models
│   │   ├── vision/
│   │   │   ├── router.py        # /vision/detect
│   │   │   ├── yolo_service.py  # YOLO model loading + inference
│   │   │   └── models.py        # Vision Pydantic models
│   │   ├── chat/
│   │   │   ├── router.py        # /chat/stream (SSE)
│   │   │   ├── llm_service.py   # Model loading + generation
│   │   │   └── models.py        # Chat Pydantic models
│   │   ├── docs/
│   │   │   ├── router.py        # /docs/extract
│   │   │   ├── ocr_service.py   # Tesseract + preprocessing
│   │   │   ├── extraction.py    # Gemini structured extraction
│   │   │   └── models.py        # Doc Pydantic models
│   │   ├── admin/
│   │   │   ├── router.py        # /admin/leads, /admin/analytics
│   │   │   └── models.py        # Admin Pydantic models
│   │   └── db/
│   │       ├── database.py      # Neon connection + async session
│   │       ├── models.py        # SQLAlchemy ORM models
│   │       └── migrations/      # Alembic migrations
│   ├── models/                  # AI model weights
│   │   ├── yolov8n.pt           # YOLO weights
│   │   └── nexapex-llm.gguf     # Fine-tuned LLM (Unsloth export)
│   ├── pyproject.toml
│   └── Dockerfile
│
├── mobile/                      # Flutter companion app (P2)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── screens/
│   │   ├── services/
│   │   └── models/
│   └── pubspec.yaml
│
└── docker-compose.yml           # Local dev: backend + DB
```

### Critical Implementation Details
- **YOLO model:** Use `yolov8n` (nano) for fast inference. Load model once at startup, reuse across requests. Use `ultralytics` Python package.
- **LLM serving:** Export from Unsloth to GGUF format. Serve with `llama-cpp-python` for simplicity (no separate vLLM server needed for MVP scale). Load model at startup.
- **Streaming:** Use FastAPI's `StreamingResponse` with `text/event-stream` content type for SSE. Frontend uses `EventSource` API or `fetch` with `ReadableStream`.
- **File uploads:** Store temporarily in `/tmp` with UUID filenames. Delete via background task after processing. Never store user uploads permanently.
- **Demo counters:** Increment atomically in PostgreSQL (`UPDATE leads SET vision_demos_used = vision_demos_used + 1 WHERE id = $1 RETURNING vision_demos_used`). Check limit before inference, not after.
- **Existing site integration:** Add demo pages as new Astro routes. The existing cinematic components, navigation, and styling remain unchanged. Demos use React islands within Astro for interactivity.
- **Brand consistency:** All demo UIs must use the existing NexApex design system: `#050505` background, `#94fcff` cyan accent, Nexa font, glassmorphism cards, subtle glow effects.

### Libraries to Use
- `ultralytics` for YOLO inference — production-tested, simple API
- `llama-cpp-python` for LLM serving — single-process, no infrastructure overhead
- `pytesseract` + `Pillow` for OCR — mature, supports Myanmar/Thai with traineddata
- `google-generativeai` for Gemini API — structured extraction
- `python-jose` for JWT — lightweight, async-compatible
- `sqlalchemy[asyncio]` + `asyncpg` for async database
- `alembic` for migrations
- `resend` Python SDK for emails
- `posthog-python` for server-side analytics
- `@tanstack/react-query` (frontend) for API state management
- `react-dropzone` for file uploads
- `react-markdown` for chat rendering

### Libraries to Avoid
- `transformers` (HuggingFace) for LLM serving — too heavy for MVP, use llama-cpp-python instead
- `celery` for task queue — overkill for MVP; use FastAPI background tasks
- `next.js` for frontend — project is already Astro, don't switch
- `prisma` for Python — not mature enough; use SQLAlchemy

### Common Pitfalls
- **Model loading time:** YOLO and LLM models take 5-30 seconds to load. Load at startup (lifespan event), never per-request. Use `@asynccontextmanager` lifespan in FastAPI.
- **Memory management:** YOLO + LLM in same process can use 4-8GB RAM. Monitor with `/health` endpoint that reports memory usage. Consider separate processes if needed.
- **CORS for SSE:** SSE streaming requires specific CORS headers. Set `Access-Control-Allow-Headers: *` and allow the frontend origin explicitly.
- **Astro + React hydration:** Demo components must use `client:only="react"` directive (not `client:load`) to avoid SSR issues with browser APIs (camera, file upload).
- **Myanmar script OCR:** Tesseract needs `mya` traineddata file. Download and include in Docker image. Quality varies — set expectations in UI.

### Testing Approach
- Write tests for: auth flow, demo counter logic, API input validation, admin CSV export
- Skip tests for: YOLO inference accuracy (tested upstream), Gemini API responses (mock in tests)
- Use `pytest` + `httpx` for async API testing
- Use `Playwright` for E2E demo flow testing
- Mock external services (Resend, Gemini, Cal.com) in tests

---

## Decision Log

| Decision | Alternatives Considered | Why Chosen |
|----------|------------------------|------------|
| Astro + React islands (frontend) | Next.js, standalone React SPA | Existing NexApex site is Astro; avoids rewrite. React islands give interactivity where needed |
| FastAPI (backend) | Hono/Node.js, Django | User's strongest Python backend framework. Best ML/AI library ecosystem for YOLO + LLM serving |
| llama-cpp-python (LLM serving) | vLLM, Ollama, HuggingFace TGI | Simplest single-process setup for MVP. No separate inference server needed. Good GGUF support from Unsloth export |
| Neon PostgreSQL (database) | Supabase, PlanetScale | User already uses Neon across projects. Serverless scaling, branching for dev/staging |
| Email gate (not fully open) | Open demos, password auth | Maximizes lead capture. Simple magic link avoids password management complexity |
| YOLOv8 nano (vision model) | YOLOv8 large, custom trained | Fastest inference for general object detection demo. Accuracy sufficient for showcase. Custom models are the upsell |
| Cal.com (booking) | Calendly, custom booking | Open source, embeddable, webhook support. Free tier sufficient for MVP |
| PostHog (analytics) | Mixpanel, Amplitude, Plausible | Open source, generous free tier, funnel analysis built-in. Can self-host later |
| Railway/Fly.io (backend hosting) | AWS EC2, Render, Cloudflare Workers | GPU-capable instances available. Simple deployment. Pay-per-use pricing fits MVP budget |
| Temporary file storage only | S3/R2 permanent storage | Privacy-first approach. Demo files have no long-term value. Reduces storage costs and liability |

---

## Appendix: Revenue Model

| Service | Price Range | Description |
|---------|------------|-------------|
| Custom Vision Model | $3,000 - $8,000 | Train YOLO on client's specific products/defects. Includes model + API deployment |
| Custom AI Assistant | $2,000 - $5,000 | Fine-tune LLM for client's domain. Includes chat widget or API integration |
| Document Automation | $2,000 - $4,000 | Custom extraction pipeline for client's document types |
| Full AI Solution | $5,000 - $15,000 | End-to-end: vision + LLM + mobile app, tailored to client's workflow |
| Monthly Support | $500 - $1,500/mo | Model retraining, monitoring, updates, priority support |

---

*Generated by NexApex PRD Generator — Version 1.0*
