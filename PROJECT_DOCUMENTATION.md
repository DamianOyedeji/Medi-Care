# Medi-Care — Complete Project Documentation

> **Mental Wellness Support System**
> A full-stack AI-powered mental health support application built with React, Node.js/Express, Supabase, and multiple AI services.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Frontend](#4-frontend)
   - 4.1 [Application Structure & Routing](#41-application-structure--routing)
   - 4.2 [Context Providers](#42-context-providers)
   - 4.3 [Pages & Components](#43-pages--components)
   - 4.4 [API Client](#44-api-client)
   - 4.5 [Styling & Theming](#45-styling--theming)
5. [Backend](#5-backend)
   - 5.1 [Server Configuration](#51-server-configuration)
   - 5.2 [API Routes & Controllers](#52-api-routes--controllers)
   - 5.3 [Middleware](#53-middleware)
   - 5.4 [Services](#54-services)
6. [Database](#6-database)
   - 6.1 [Schema Overview](#61-schema-overview)
   - 6.2 [Row Level Security](#62-row-level-security)
   - 6.3 [Triggers & Automation](#63-triggers--automation)
7. [AI & Machine Learning Pipeline](#7-ai--machine-learning-pipeline)
8. [Crisis Detection & Safety System](#8-crisis-detection--safety-system)
9. [Location Services](#9-location-services)
10. [Authentication & Security](#10-authentication--security)
11. [Deployment](#11-deployment)
12. [Environment Variables](#12-environment-variables)
13. [Key Features Summary](#13-key-features-summary)

---

## 1. Project Overview

**Medi-Care** is a comprehensive mental wellness support application that provides:

- **AI-powered conversational therapy** — Users chat with an empathetic AI assistant powered by OpenAI GPT-4o-mini
- **Emotion analysis** — Every user message is analyzed for emotional content using HuggingFace's RoBERTa model
- **Crisis detection & intervention** — A keyword-based safety system identifies at-risk users and escalates with crisis resources, email alerts, and helpline information
- **Mood tracking & insights** — Users log moods over time, and the system generates personalized trend charts and AI-driven insights
- **Conversation journaling** — All chat sessions are saved and browsable as a private journal
- **Support resource discovery** — Geolocation-based search for nearby mental health facilities using OpenStreetMap data, plus curated helplines and initiatives
- **Notifications system** — In-app toast notifications and a full notification center for crisis alerts, check-in reminders, and system events
- **Dark mode** — Full light/dark theme support across every component

The project was originally generated from a Figma design (Mental Health Support Landing Page) and was then extended into a fully functional full-stack application with a custom backend, database, AI integrations, and deployment configurations.

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.4+ | Type-safe development |
| **Vite** | 6.3.5 | Build tool & dev server |
| **Tailwind CSS** | 4.1.12 | Utility-first styling |
| **Radix UI** | Various | Accessible headless UI primitives (dialog, dropdown, switch, tabs, accordion, etc.) |
| **Framer Motion** | 12.x (`motion/react`) | Page transitions & animations |
| **Recharts** | 2.15.2 | Mood trend charts |
| **Leaflet / React-Leaflet** | 1.9.4 / 4.2.1 | Interactive maps for support resources |
| **Lucide React** | 0.487.0 | Icon library |
| **MUI (Material UI)** | 7.3.5 | Supplementary UI components & icons |
| **Supabase JS** | 2.95.3 | Direct client for password reset flow |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18.x | Runtime |
| **Express** | 4.18.2 | HTTP server framework |
| **Supabase JS** | 2.39.0 | Database & auth SDK (anon + service key clients) |
| **Axios** | 1.6.5 | HTTP client for external APIs |
| **Helmet** | 7.1.0 | Security headers |
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **express-rate-limit** | 7.1.5 | Request rate limiting |
| **Winston** | 3.11.0 | Structured logging with file rotation |
| **Nodemailer** | 6.9.8 | SMTP email for crisis alerts |
| **Multer** | 1.4.5 | File upload handling |

### External Services
| Service | Purpose |
|---|---|
| **Supabase** | PostgreSQL database + JWT authentication |
| **OpenAI API** (GPT-4o-mini) | Conversational AI responses |
| **HuggingFace Inference API** (RoBERTa) | Emotion classification (GoEmotions model) |
| **Overpass API** (OpenStreetMap) | Nearby mental health facility search |
| **Nominatim** (OpenStreetMap) | Forward geocoding (city name → coordinates) |
| **SMTP** (Gmail) | Crisis alert & welcome emails |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                  │
│                                                               │
│   PublicLandingPage ──► Login / Register ──► Authenticated    │
│                                                App            │
│   ┌───────────────────────────────────────────────────────┐  │
│   │ Chat │ Journal │ Insights │ Support │ Settings │ Notif │  │
│   └───────────────────────────────────────────────────────┘  │
│          │                                                    │
│   api.ts │ (Bearer JWT)          supabase.ts (password reset) │
└──────────┼────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Express Backend (Node.js)                   │
│                                                               │
│  ┌─ Middleware ──────┐    ┌─ Controllers ─────────────────┐  │
│  │ authenticate      │    │ auth.controller     (10 fns)  │  │
│  │ rateLimiter (×6)  │    │ chat.controller     (3 fns)   │  │
│  │ errorHandler      │    │ conversation.controller (4)    │  │
│  └───────────────────┘    │ mood.controller     (5 fns)   │  │
│                            │ insight.controller  (2 fns)   │  │
│  ┌─ Services ────────┐    │ support.controller  (5 fns)   │  │
│  │ ai.service        │    └───────────────────────────────┘  │
│  │  → OpenAI GPT-4o  │                                       │
│  │  → HuggingFace    │                                       │
│  │ safety.service    │                                       │
│  │ email.service     │                                       │
│  │  → SMTP/Gmail     │                                       │
│  │ location.service  │                                       │
│  │  → Overpass API   │                                       │
│  │  → Nominatim      │                                       │
│  └───────────────────┘                                       │
└──────────┬───────────────────────────────────────────────────┘
           │ Supabase SDK (anon + service key)
           ▼
┌──────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Auth)                      │
│                                                               │
│  10 tables │ Row Level Security │ Triggers │ 15 Indexes       │
│  users, conversations, messages, mood_entries, insights,      │
│  crisis_logs, user_settings, support_resources,               │
│  daily_quotes, voice_sessions                                 │
└──────────────────────────────────────────────────────────────┘
```

**Data flow for a chat message:**
1. User types a message in `ChatInterface`
2. Frontend sends `POST /api/chat/message` with the message + conversation ID
3. Backend `authenticate` middleware verifies the JWT
4. `chat.controller.sendMessage()` runs the pipeline:
   - **Safety check** → `safety.service.analyzeCrisisRisk()` scans for crisis keywords
   - **Emotion analysis** → `ai.service.analyzeEmotionWithRoBERTa()` classifies emotion via HuggingFace
   - **User message saved** to `messages` table with risk metadata
   - If **crisis detected**: generates crisis response, logs to `crisis_logs`, sends email alert
   - If **normal**: fetches last 10 messages for context, calls `ai.service.generateAIResponse()` (GPT-4o-mini), saves assistant reply
5. Response returned with AI message + emotion analysis to the frontend

---

## 4. Frontend

### 4.1 Application Structure & Routing

The app uses a **view-state router** pattern (not React Router). A `currentView` state variable in `App.tsx` controls which page is displayed. Views are switched with animated transitions via Framer Motion's `AnimatePresence`.

**Available views:**

| View | Component | Auth Required | Description |
|---|---|---|---|
| `public` | `PublicLandingPage` | No | Marketing landing page for visitors |
| `login` | `Login` | No | Email/password login form |
| `register` | `Register` | No | User registration form |
| `forgot-password` | `ForgotPassword` | No | Password reset request |
| `reset-password` | `ResetPassword` | No | New password form (from email link) |
| `landing` | `Navbar + Hero + Features + Footer` | Yes | Authenticated home dashboard |
| `chat` | `ChatInterface` | Yes | AI chat conversation |
| `history` | `ConversationHistory` | Yes | Past conversation journal |
| `insights` | `Insights` | Yes | Mood trends & AI-generated insights |
| `settings` | `Settings` | Yes | Appearance, privacy, safety settings |
| `support` | `Support` | Yes | Resource finder, helplines, map |
| `notifications` | `Notifications` | Yes | Notification center |

**Authentication guard:** A `useEffect` in `App.tsx` redirects unauthenticated users away from protected views to the `public` page. The app also detects Supabase password recovery links (`type=recovery` in the URL hash) and auto-navigates to the `reset-password` view.

### 4.2 Context Providers

Three React context providers wrap the entire application:

#### AuthContext (`src/contexts/AuthContext.tsx`)
- Manages user authentication state globally
- Provides `login()`, `logout()`, and `setUserFromSession()` functions
- Persists user data in `localStorage` (`medi_care_user`)
- Persists JWT access token in `localStorage` (`medi_care_auth_token`)
- `loading` state prevents flash of unauthenticated content on page load

#### ThemeContext (`src/contexts/ThemeContext.tsx`)
- Manages dark/light mode toggle
- Persists preference in `localStorage` (`mh_dark_mode`)
- Respects system `prefers-color-scheme` on first visit
- Applies/removes `dark` class on `<html>` element for Tailwind dark mode

#### NotificationContext (`src/contexts/NotificationContext.tsx`)
- Global notification system with persistent storage
- Stores up to 100 notifications in `localStorage` (`mh_notifications`)
- Manages active toast overlay (max 5 simultaneous toasts)
- Auto-dismiss timers: 5 seconds for normal, 12 seconds for crisis notifications
- Provides `addNotification()`, `markAllRead()`, `clearAll()`, `dismissToast()`
- Exports `unreadCount` for badge display

### 4.3 Pages & Components

#### PublicLandingPage
The marketing page visitors see before logging in. Self-contained with its own navbar and footer. Features:
- Hero section with Unsplash background image, floating testimonial card, and user avatar stack
- "AI-Powered Support 24/7" badge with animated pulse
- Three feature cards: AI-Powered Chat, Safe & Private, Personalized Support
- CTA buttons leading to Login and Register

#### Login
Email/password form with:
- Show/hide password toggle
- Error display for failed attempts
- Links to Register and Forgot Password
- Decorative teal corner gradient
- Calls `AuthContext.login()` which hits `POST /api/auth/login`

#### Register
Full registration form with:
- Full Name, Email, Password, Confirm Password fields
- Password mismatch validation
- Show/hide toggles for both password fields
- Calls `POST /api/auth/signup` directly
- "Continue with Google" button (UI placeholder)
- On success with session, auto-logs user in via `AuthContext.setUserFromSession()`

#### ForgotPassword
Password reset request:
- Email input form
- Uses Supabase client directly (`supabase.auth.resetPasswordForEmail()`)
- Shows success confirmation screen with instructions (check spam, 1-hour expiry)

#### ResetPassword
New password form (accessed via Supabase email link):
- Detects `type=recovery` in URL hash
- Lets user enter and confirm new password
- Updates via Supabase Auth

#### Authenticated Landing (Navbar + Hero + Features + Footer)
The home screen after login. Composed of:

- **Navbar** — Fixed top bar with glassmorphism (`backdrop-blur-md`). Desktop links: Chat, Journal, Insights, Support, Settings. Dark mode toggle, notification bell with unread badge, user dropdown with logout. Mobile hamburger menu.
- **Hero** — "AI-Powered Support 24/7" badge, two CTAs (Start Chat, Support), hero image, floating "Daily Check-in" card with animated reveal
- **Features** — Three cards: "Safe Conversations" (Shield icon), "Emotional Insights" (BrainCircuit icon), "Crisis Support" (HeartHandshake icon). Scroll-triggered entrance animations.
- **Footer** — Product links, company links, copyright with dynamic year, medical disclaimer about AI limitations

#### ChatInterface
The core AI chat experience. This is the most feature-rich component:

- **Full conversation lifecycle**: Creates new conversations, loads history for existing ones, sends messages, receives AI responses
- **Speech-to-Text**: Web Speech API (`SpeechRecognition`) transcribes voice input. Toggle button with pulsing animation while listening
- **Text-to-Speech**: Reads assistant responses aloud via `SpeechSynthesisUtterance`. Preference persisted in `localStorage`
- **File attachments**: Supports image/document uploads up to 5 MB. Embedded as data URLs with `[FILE:name:type:dataUrl]` markers. Images render inline; documents show a download card
- **Message editing**: Users can inline-edit previously sent messages
- **Crisis detection UI**: If the backend flags `escalated: true`, a safety banner appears and a crisis notification is pushed to the notification system
- **Daily check-in**: On first chat open each day, a greeting notification is emitted
- **Quick-Dial panel**: Fetches nearby mental health facilities using geolocation and renders call-to-action buttons
- **Emotion analysis display**: Shows detected primary emotion, confidence percentage, and provider/model info
- **Auto-scroll**, auto-resize textarea, bouncing-dot typing indicator
- **Dark mode** support throughout

**API calls:**
- `POST /api/conversations` — create conversation
- `POST /api/chat/message` — send message
- `GET /api/chat/history/{id}` — load message history
- `GET /api/support/nearby` — quick-dial facilities

#### ConversationHistory
Journal-style list of past conversations:
- Cards with formatted dates (Today / Yesterday / date) and conversation titles
- Delete button per conversation
- Staggered entrance animations
- Privacy notice: "Private journal — Only you can see this"
- Empty state prompt to start first conversation

#### Insights
Mood analytics dashboard:
- **7-day mood trend chart** using Recharts `AreaChart` with teal gradient fill
- **AI-generated insight cards** (title + content) with sparkle icons
- **"Generate Insights" button** — requires 3+ mood entries in the last 30 days
- Computes average intensity and generates recommendations based on thresholds

#### Settings
User preferences page with four sections:
- **Appearance**: Dark mode toggle using Radix UI Switch
- **Data & Privacy**: Toggle to save conversation history; "Delete all conversations" button
- **Safety**: Links to Support Resources and Crisis Help
- **About**: Version info (Medi-Care v1.0) and disclaimer about AI limitations

#### Support
Comprehensive support resources page — the second most complex component:
- **Daily motivational quote** from the backend (rotates by day-of-year)
- **24/7 helplines** list from the database
- **Location search**: Search by city/area name or use browser geolocation
- **Interactive Leaflet map**: Custom marker icons (pulsing user location dot, hospital/professional emoji markers), `FitBounds` and `FlyToPoint` helpers for smooth navigation
- **Facility list**: Filterable by category (Psychiatric, Wellness, Hospital, Clinic), with favourite-saving to `localStorage`, Google Maps directions, phone call buttons, website links
- **Mental health initiatives**: Organizations with contact info and directions
- **Favourites section**: Persisted across sessions in `localStorage`
- **Map error boundary**: Graceful fallback for rendering failures

#### Notifications
Full-page notification center:
- Groups notifications by day (Today / Yesterday / date)
- Type-specific icons and color accents (crisis=rose, warning=amber, success=teal, info=stone)
- "Mark all read" and "Clear all" buttons
- Unread badge in sticky glassmorphism header

#### ToastNotificationOverlay
Floating toast overlay (top-right of viewport):
- Up to 5 simultaneous toasts
- Animated progress bar (5s normal, 12s crisis)
- Dismissible via X button
- Spring animations for entrance/exit
- Type-specific color styling

### 4.4 API Client (`src/lib/api.ts`)

Centralized HTTP client for all backend communication:
- Generic `request<T>()` function handles all HTTP methods
- Auto-attaches `Authorization: Bearer {token}` header
- On 401 response: automatically clears stored token (forces re-login)
- Base URL from `VITE_API_URL` env var (defaults to `http://localhost:5000`)
- Exports `setAccessToken()`, `clearAccessToken()`, `saveUser()`, `getSavedUser()`
- `initializeAuth()` runs at module load to restore session from `localStorage`

### 4.5 Styling & Theming

- **Tailwind CSS 4.1** with the Vite plugin (`@tailwindcss/vite`)
- **Dark mode**: Class-based strategy (`dark:` variants). Toggled via `ThemeContext`
- **Design language**: Teal as primary accent color (`teal-600/700`), stone palette for neutrals. Rounded corners (`rounded-3xl` for cards), glassmorphism headers (`backdrop-blur-md`)
- **Fonts**: Custom font loading via `src/styles/fonts.css`
- **Animations**: Framer Motion for page transitions, scroll-triggered entrances, staggered reveals, spring-based toasts
- **Build optimization**: Vite config includes manual chunks for vendor (React) and UI (Radix) libraries, plus code splitting

---

## 5. Backend

### 5.1 Server Configuration

**Entry point:** `backend/src/server.js`

The Express server configures:
- **CORS**: Whitelist built from hardcoded Render/localhost origins + `CORS_ORIGINS` env var. Origins normalized via `URL` constructor. Allows no-origin requests for server-to-server communication
- **Security headers**: Helmet middleware
- **JSON parsing**: Express built-in with body limit
- **Health check**: `GET /health` endpoint for container orchestration
- **Six route groups**: `/api/auth`, `/api/chat`, `/api/conversations`, `/api/support`, `/api/mood`, `/api/insights`
- **Global error handler** (500) and 404 handler
- **Listens on `0.0.0.0`** for container deployment compatibility

### 5.2 API Routes & Controllers

#### Authentication (`/api/auth`)

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/signup` | No | Auth limiter (5/15min) | Register new user via Supabase Auth + send verification email |
| POST | `/login` | No | Auth limiter | Password-based sign-in; updates `last_login_at` |
| POST | `/forgot-password` | No | Auth limiter | Send password reset email via Supabase |
| POST | `/verify-email` | No | — | Verify OTP token |
| POST | `/refresh` | No | — | Exchange refresh token for new session |
| POST | `/logout` | Yes | — | Sign out user session |
| GET | `/me` | Yes | — | Fetch user profile + settings |
| PATCH | `/profile` | Yes | — | Update `full_name` in DB and Supabase Auth metadata |
| POST | `/change-password` | Yes | — | Update password (min 6 characters) |
| DELETE | `/account` | Yes | — | Soft-delete: sets `is_active = false` after password confirmation |

**Notable:** Account deletion is a soft-delete (preserves data). Forgot-password returns a generic success message regardless of whether the email exists (prevents user enumeration). Duplicate email detection returns 409.

#### Chat (`/api/chat`)

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/message` | Yes | Chat limiter (20/min) | Multi-step AI chat pipeline (see Architecture section) |
| GET | `/history/:conversationId` | Yes | — | Fetch all messages for a conversation |
| GET | `/summary/:conversationId` | Yes | — | Message counts and risk-detection statistics |

**The `sendMessage` pipeline:**
1. Safety check → keyword-based crisis risk analysis (3 tiers)
2. Emotion analysis → HuggingFace RoBERTa (28 GoEmotions → 7 categories)
3. User message saved with risk metadata
4. If critical/high risk → crisis response + `crisis_logs` entry + email alert
5. If normal/moderate → GPT-4o-mini generates AI response with 10-message context
6. Professional referral suggestion appended if therapy/medication keywords detected
7. Response returned with AI message + emotion analysis

#### Conversations (`/api/conversations`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List all non-archived conversations (ordered by `last_message_at`) |
| POST | `/` | Yes | Create a new conversation |
| PATCH | `/:id` | Yes | Update conversation title or archive status |
| DELETE | `/:id` | Yes | Delete a conversation |

#### Mood (`/api/mood`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/entry` | Yes | Create mood entry (5 moods × intensity 1–10) |
| GET | `/entries` | Yes | Paginated fetch with optional `days` filter |
| GET | `/stats` | Yes | Average intensity, mood distribution, trend direction |
| GET | `/trend` | Yes | Daily aggregation with dominant mood per day |
| DELETE | `/entry/:id` | Yes | Delete a mood entry |

**Trend detection algorithm:** Splits entries chronologically into two halves. If second-half average > first-half + 0.5 → "improving"; < first-half − 0.5 → "declining"; else "stable".

#### Insights (`/api/insights`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Fetch last 10 insights |
| POST | `/generate` | Yes | Generate new AI insight (requires ≥3 mood entries in 30 days) |

**Insight generation:** Computes average mood intensity. Generates text recommendation based on thresholds: ≥7 = "You're doing great", ≥5 = "Keep going", <5 = "Consider seeking support".

#### Support (`/api/support`)

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| GET | `/quote` | Optional | — | Daily motivational quote (deterministic rotation by day-of-year) |
| GET | `/nearby` | Optional | Location limiter (5/min) | Find facilities by lat/lon + radius |
| GET | `/helplines` | Optional | — | Fetch 24/7 helplines from DB |
| GET | `/search` | Optional | Location limiter | Geocode query + find nearby resources |
| GET | `/initiatives` | Optional | — | Return curated Nigerian crisis organizations |

### 5.3 Middleware

#### Authentication (`authenticate.js`)
Two variants:
- **`authenticate`** (mandatory): Extracts `Bearer` token → verifies with `supabase.auth.getUser()` → checks `is_active` in DB → attaches `req.user` and `req.userId`. Rejects inactive accounts (403). Logs invalid token attempts with IP.
- **`optionalAuth`** (soft): Same flow but silently continues if no token is present.

#### Error Handler (`errorHandler.js`)
- Maps error names to HTTP status codes (400, 401, 503, etc.)
- In production: 500 errors return generic message ("An unexpected error occurred")
- In development: returns full details + stack trace
- `asyncHandler` wrapper eliminates try/catch boilerplate in route handlers

#### Rate Limiter (`rateLimiter.js`)
Six profiles:

| Limiter | Window | Max Requests | Purpose |
|---|---|---|---|
| `rateLimiter` | 15 min | 100 | General API endpoints |
| `authRateLimiter` | 15 min | 5 | Login/signup (skips counting successful requests) |
| `chatRateLimiter` | 1 min | 20 | Chat messages |
| `crisisRateLimiter` | 1 hour | 5 | Prevents crisis escalation abuse |
| `voiceRateLimiter` | 1 min | 10 | Voice interaction endpoints |
| `locationRateLimiter` | 1 min | 5 | Protects Overpass API from overuse |

The crisis limiter returns emergency phone numbers (988, 116 123, findahelpline.com) when triggered, so users always have access to help.

### 5.4 Services

#### AI Service (`ai.service.js`)

**OpenAI Integration (GPT-4o-mini):**
- `generateAIResponse()` sends the user message plus the last 20 messages as context
- Uses a detailed system prompt crafted for natural, empathetic conversational responses (2–4 sentences)
- Parameters: `temperature: 0.8`, `max_tokens: 300`, `presence_penalty: 0.7`, `frequency_penalty: 0.5`
- Exponential backoff retry (max 3 retries) for 429/5xx errors
- If the model returns `CRISIS_ESCALATION_REQUIRED`, generates a separate empathetic crisis response

**HuggingFace Integration (RoBERTa):**
- `analyzeEmotionWithRoBERTa()` calls the `SamLowe/roberta-base-go_emotions` model
- Maps 28 GoEmotions labels into 7 primary categories via `EMOTION_MAP`:
  - **Joy**: joy, amusement, excitement, love, gratitude, pride, relief, optimism, admiration, approval, caring, desire
  - **Sadness**: sadness, grief, disappointment, remorse
  - **Anger**: anger, annoyance, disapproval, disgust
  - **Fear**: fear, nervousness
  - **Surprise**: surprise, realization, curiosity, confusion
  - **Disgust**: disgust (standalone)
  - **Neutral**: neutral
- Handles HuggingFace cold-start (503) with dynamic wait based on `estimated_time`
- Returns: `{ primaryEmotion, confidence, allEmotions, provider, model }`

**Fallback behavior:** If both APIs are unreachable, returns a static technical fallback message.

#### Safety Service (`safety.service.js`)

Keyword-based crisis detection with three tiers:

| Tier | Score | Example Keywords |
|---|---|---|
| **Critical** (≥0.95) | 0.95–1.0 | "kill myself", "suicide", "end my life", "want to die", "self harm" |
| **High** (≥0.75) | 0.75–0.94 | "cutting myself", "hurt myself", "no reason to live", "burden" |
| **Moderate** (≥0.50) | 0.50–0.74 | "depressed", "anxious", "lonely", "can't cope", "numb" |
| **Normal** | 0.10 | No keywords detected |

Priority cascade: critical overrides high, which overrides moderate.

`getCrisisResponse()` returns structured responses with Nigerian helplines:
- **SURPIN**: 09080217555
- **MHFA Nigeria**: 09036032505
- **Emergency**: 112

#### Email Service (`email.service.js`)

SMTP-based transactional email via Nodemailer:
- **`sendCrisisAlert()`**: High-priority HTML email with full crisis details (user info, message content, detected keywords, risk score, recommended actions). Includes `X-Priority: 1` and `Importance: high` headers
- **`sendWelcomeEmail()`**: Welcome message for new registrations
- **`testEmailConfig()`**: Verifies SMTP credentials
- Silently returns `{ success: false }` if SMTP is unconfigured (no crash)
- Default SMTP: `smtp.gmail.com:587`

#### Location Service (`location.service.js`)

Geolocation-based mental health facility search using OpenStreetMap:

- **`findNearbyResources()`**: Queries Overpass API for hospitals, clinics, psychiatric facilities within radius. Merges curated Nigerian hospitals. Results are cached.
- **`geocodeAddress()`**: Forward geocoding via Nominatim (city name → lat/lon)
- **`findPsychiatricFacilities()`**: Extended-radius search (100–200 km) for specialized facilities

**Caching:**
- In-memory cache with 15-minute TTL
- Coordinates rounded to ~1 km for cache key sharing
- Max 200 entries with FIFO eviction

**Categorization heuristic:** Checks OSM tags (`healthcare`, `amenity`, `speciality`, `social_facility`) and name patterns (`psychiatr`, `neuropsych`, `counsel`, `therap`, `wellness`, `rehab`).

**Priority sorting:** Psychiatric > Wellness > Hospital > Clinic, then by distance. Capped at 30 results within 100 km.

**Nigeria-specific fallback:** 8 federal neuropsychiatric hospitals + 10 teaching hospitals with phone numbers, served when Overpass results are empty.

**Distance calculation:** Haversine formula for great-circle distance in kilometers.

---

## 6. Database

### 6.1 Schema Overview

The database uses **Supabase (PostgreSQL)** with 10 tables:

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | User profiles (linked to Supabase Auth) | id (FK → auth.users), email, full_name, is_active, last_login_at |
| `conversations` | Chat session containers | user_id, title, is_archived, last_message_at |
| `messages` | Individual chat messages | conversation_id, role (user/assistant/system), content, risk_level, risk_score, was_escalated |
| `mood_entries` | Mood tracking data | user_id, mood (5-enum), intensity (1–10), notes |
| `insights` | AI-generated analytics | user_id, type (4-enum), title, content, data (JSONB) |
| `crisis_logs` | Safety audit trail | user_id, risk_level, detected_keywords[], user_message, email_sent, resolved_at |
| `user_settings` | Per-user preferences | theme, notifications, voice, privacy_mode, crisis_contacts[], data_retention_days |
| `support_resources` | Helpline & facility directory | name, type, phone, lat/lon, is_24_7 |
| `daily_quotes` | Motivational quotes | quote, author, category (5-enum), is_active |
| `voice_sessions` | Voice interaction logs | user_id, duration_seconds, transcript |

**Mood enum values:** `excellent`, `good`, `neutral`, `low`, `poor`

**Insight type enum:** `mood_pattern`, `conversation_summary`, `recommendation`, `progress`

**Support resource types:** `helpline`, `professional`, `hospital`, `crisis_center`

**Quote categories:** `motivational`, `mindfulness`, `self_care`, `resilience`, `gratitude`

### 6.2 Row Level Security

RLS is **enabled on all tables**:
- Users can only SELECT, INSERT, UPDATE, DELETE their own rows (via `auth.uid()`)
- `support_resources` and `daily_quotes` (active) are publicly readable
- The backend uses a **service key client** (`supabaseAdmin`) to bypass RLS for server-side operations (e.g. creating user records on signup)

### 6.3 Triggers & Automation

- **`handle_new_user()`**: Trigger function that auto-creates `users` and `user_settings` rows when a new `auth.users` entry is inserted
- **`update_*_updated_at()`**: Auto-refreshes `updated_at` timestamps on UPDATE for `users`, `conversations`, `user_settings`, `support_resources`

**Indexes (15 total):** Optimized for foreign key lookups, timestamp ordering, and partial indexes on unresolved crisis logs and high/critical risk messages.

**Seed data:** 6 default helplines (US-based) and 10 motivational daily quotes.

**Extensions:** `uuid-ossp` (UUID generation), `pgcrypto` (cryptographic functions).

---

## 7. AI & Machine Learning Pipeline

### Conversational AI (OpenAI GPT-4o-mini)

The system prompt instructs the model to:
- Act as a warm, empathetic mental health companion
- Generate natural, context-aware responses (2–4 sentences)
- Avoid generic advice; reference what the user actually said
- Detect when crisis escalation is needed and emit `CRISIS_ESCALATION_REQUIRED`
- Never diagnose or prescribe medication

**Context window:** Last 20 messages from the conversation are included for continuity.

### Emotion Analysis (HuggingFace RoBERTa)

Every user message is independently analyzed by the `SamLowe/roberta-base-go_emotions` model:
- Returns confidence scores for 28 GoEmotions labels
- Labels are mapped to 7 primary emotion categories
- Primary emotion + confidence percentage are sent to the frontend for display
- Used for mood tracking enrichment and emotion-aware responses

### Professional Referral Detection

A keyword scanner checks if the user mentions therapy, psychiatry, or medication. If detected, the AI response is appended with a note suggesting professional consultation.

---

## 8. Crisis Detection & Safety System

This is a multi-layered safety system:

### Layer 1: Keyword Scanning
- 44 keywords across 3 severity tiers (critical, high, moderate)
- Runs on every user message before AI processing
- Returns risk level, score, and detected keywords

### Layer 2: AI-Level Detection
- GPT-4o-mini can independently identify crisis situations
- Emits `CRISIS_ESCALATION_REQUIRED` flag
- Triggers a specialized empathetic crisis response

### Layer 3: Automated Escalation
When high/critical risk is detected:
1. **Crisis response generated** with specific actions and helpline numbers
2. **`crisis_logs` entry created** with full audit trail (message, keywords, score, timestamp)
3. **Email alert sent** via SMTP to configured recipients with all crisis details
4. **Frontend notified** — safety banner appears + crisis toast notification

### Layer 4: Always-Available Resources
- Support page always accessible
- Crisis rate limiter includes emergency numbers in the 429 response
- Nigerian helplines hardcoded in safety service
- Quick-Dial panel in chat interface

---

## 9. Location Services

### Facility Discovery Flow

1. **User triggers search**: Either by clicking "Find Support Near Me" (geolocation) or entering a city/area name
2. **Geocoding** (if text query): Nominatim converts the query to coordinates
3. **Overpass API query**: Searches for hospitals, clinics, psychiatric facilities within radius
4. **Categorization**: Facilities are classified as Psychiatric, Wellness, Hospital, or Clinic based on OSM tags and name patterns
5. **Nigerian hospital merge**: Curated list of Nigerian teaching and neuropsychiatric hospitals is merged if within range
6. **Sorting**: Psychiatric first, then Wellness, Hospital, Clinic — secondary sort by distance
7. **Caching**: Results cached for 15 minutes with ~1km coordinate rounding
8. **Fallback**: If no Overpass results, returns 3 closest facilities from the hardcoded Nigerian hospital list

### Map Features (Leaflet)
- Custom marker icons per category
- Pulsing blue dot for user's location
- `FitBounds` component auto-zooms to show all markers
- `FlyToPoint` component smoothly pans to selected facility
- `MapErrorBoundary` catches rendering failures gracefully

---

## 10. Authentication & Security

### Authentication Flow
1. **Registration**: `POST /api/auth/signup` → Supabase creates auth user → trigger creates `users` + `user_settings` rows → verification email sent
2. **Login**: `POST /api/auth/login` → Supabase validates credentials → JWT token returned → stored in `localStorage`
3. **Authenticated requests**: `api.ts` auto-attaches `Authorization: Bearer {token}` header
4. **Token verification**: `authenticate` middleware calls `supabase.auth.getUser()` + checks `is_active` in DB
5. **Password reset**: Frontend Supabase client calls `resetPasswordForEmail()` directly → email sent with recovery link → `ResetPassword` component detects `type=recovery` hash

### Security Measures
| Measure | Implementation |
|---|---|
| **JWT Authentication** | Supabase Auth with mandatory + optional middleware variants |
| **Row Level Security** | Enabled on all 10 database tables |
| **Rate Limiting** | 6 distinct profiles (general, auth, chat, crisis, voice, location) |
| **CORS Whitelist** | Origin normalization, credential support, method restriction |
| **Helmet** | Security headers (XSS protection, content type sniffing, etc.) |
| **Input Validation** | All user-facing endpoints validate inputs |
| **Error Suppression** | Production mode hides stack traces and internal details |
| **Soft Delete** | Account deletion sets `is_active = false` (password confirmation required) |
| **Token Auto-Clear** | 401 responses automatically clear stored credentials |
| **Inactive Account Check** | Middleware rejects `is_active = false` users with 403 |
| **User Enumeration Prevention** | Forgot-password returns generic success regardless of email |
| **Crisis Audit Trail** | All escalations logged to `crisis_logs` with full context |
| **Admin Client Isolation** | Supabase service key used only server-side |

---

## 11. Deployment

The project is configured for deployment on **Render** (primary) and **Vercel** (alternative for frontend).

### Render (`render.yaml`)

**Backend — Web Service:**
- Runtime: Node.js
- Region: Frankfurt (closest to UK users)
- Plan: Free
- Root: `backend/`
- Build: `npm install`
- Start: `node src/server.js`
- Health check: `/health`
- Environment variables for Supabase, OpenAI, HuggingFace set as secrets

**Frontend — Static Site:**
- Build: `npm install && npm run build`
- Output: `dist/`
- Headers: `X-Frame-Options: SAMEORIGIN`
- SPA routing: All paths rewrite to `/index.html`
- Environment: `VITE_API_URL` points to backend Render URL

### Vercel (`vercel.json`)
- Framework: Vite
- Node version: 18.x
- Output: `dist/`
- Install: `npm ci`

### Vite Build Configuration
- **Code splitting**: Manual chunks for vendor (react, react-dom) and UI (Radix components)
- **Minification**: esbuild
- **Dev server proxy**: `/api` → `http://localhost:5000`, `/voice/ws` → WebSocket
- **Path alias**: `@` → `./src`

---

## 12. Environment Variables

### Frontend (`.env`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:5000`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

### Backend (`.env`)
| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `HOST` | Bind address (default: `0.0.0.0`) |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `CLIENT_URL` | Frontend URL (for email links) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (respects RLS) |
| `SUPABASE_SERVICE_KEY` | Supabase service key (bypasses RLS) |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o-mini |
| `HUGGINGFACE_API_KEY` | HuggingFace API key for RoBERTa |
| `SMTP_HOST` | SMTP server (default: `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default: `587`) |
| `SMTP_USER` | SMTP username/email |
| `SMTP_PASS` | SMTP password/app password |
| `CRISIS_ALERT_EMAILS` | Comma-separated crisis alert recipients |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window |
| `CRISIS_RATE_LIMIT_MAX` | Max crisis escalations per hour |
| `LOG_LEVEL` | Winston log level (default: `info`) |

---

## 13. Key Features Summary

| Feature | Frontend | Backend | External Service |
|---|---|---|---|
| AI Chat | `ChatInterface` | `chat.controller` + `ai.service` | OpenAI GPT-4o-mini |
| Emotion Analysis | Emotion display in chat | `ai.service` | HuggingFace RoBERTa |
| Crisis Detection | Safety banner + notifications | `safety.service` + `chat.controller` | — (keyword-based) |
| Crisis Email Alerts | — | `email.service` | SMTP/Gmail |
| Mood Tracking | `Insights` (charts) | `mood.controller` | — |
| AI Insights | `Insights` (cards) | `insight.controller` | — |
| Conversation Journal | `ConversationHistory` | `conversation.controller` | — |
| Support Resources | `Support` (map + lists) | `support.controller` + `location.service` | Overpass API + Nominatim |
| Speech-to-Text | `ChatInterface` (Web Speech API) | — | Browser API |
| Text-to-Speech | `ChatInterface` (SpeechSynthesis) | — | Browser API |
| File Attachments | `ChatInterface` (data URLs) | — | — |
| Dark Mode | `ThemeContext` + Tailwind | — | — |
| Notifications | `NotificationContext` + toasts | — | — |
| Authentication | `AuthContext` + forms | `auth.controller` | Supabase Auth |
| Password Reset | `ForgotPassword` + `ResetPassword` | — | Supabase Auth (direct) |
| Rate Limiting | — | `rateLimiter` (6 profiles) | — |
| Geolocation | Browser Geolocation API | `location.service` | Overpass + Nominatim |
| Interactive Map | Leaflet/React-Leaflet | — | OpenStreetMap tiles |

---

*This documentation reflects the complete state of the Medi-Care project as built.*
