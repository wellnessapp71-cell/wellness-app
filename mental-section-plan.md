# Mental Wellness Module — Phased Implementation Plan

> **App**: Aura Wellness  
> **Module**: Mental Wellbeing  
> **Platform**: React Native (Expo) + Next.js API + Prisma (PostgreSQL)  
> **Scoring Model**: 4-signal weighted composite (Baseline 35% · Daily 25% · rPPG 20% · Engagement 20%)  
> **Date**: 2026-03-29  

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| rPPG Engine | `react-native-vision-camera` + custom native frame processor plugin using POS (Plane Orthogonal to Skin) algorithm | No production-grade open-source rPPG SDK exists for React Native. Vision Camera's frame processor API provides real-time native frame access. POS algorithm is the most accurate unsupervised rPPG method, ported from [rPPG-Toolbox](https://github.com/ubicomplab/rPPG-Toolbox). Requires custom C++ native module for signal processing. |
| Community | Local-first AsyncStorage + WebSocket-ready API stubs | Full local-first community with AsyncStorage-backed posts. Architecture designed so WebSocket backend can be plugged in without UI changes. |
| State Management | `AsyncStorage` via dedicated `mental-store.ts` | Consistent with existing `onboarding-store.ts` pattern used by the physical module. |
| Navigation | Expo Router nested stack (`app/mental/`) | Follows the `app/physical/` pattern already established in the codebase. |
| Styling | NativeWind (TailwindCSS) + inline styles | Matches existing app styling approach (e.g., `dashboard.tsx`, `hub.tsx`). |

---

## Phase Overview

| Phase | Name | Scope | Estimated Files |
|-------|------|-------|-----------------|
| **1** | Foundation — Types, Engine & DB | Types, scoring engine, Prisma schema, migration | ~18 files |
| **2** | API Layer | All 18 mental wellness REST endpoints | ~12 files |
| **3** | Local Storage & State | Mobile state management, mental-store, onboarding-store extension | ~3 files |
| **4** | Core Screens — Hub, Onboarding, Check-in | Mental dashboard, mental assessment intake, daily check-in | ~6 files |
| **5** | rPPG Stress Scan | Vision Camera integration, native frame processor, POS algorithm, full 7-step scan flow | ~8 files |
| **6** | Calm Toolkit & Journal | Breathing exercise, grounding, body scan, journal with emotion tags | ~8 files |
| **7** | Learning Library, Community & Booking | Content modules, anonymous community, human support booking | ~9 files |
| **8** | Weekly Review, Insights & Navigation | Weekly review flow, trend charts, insights, navigation wiring, dashboard update | ~7 files |

---

## Phase 1 — Foundation: Types, Scoring Engine & Database

### Goal
Define every TypeScript type the mental module needs. Build the pure-logic scoring engine. Extend the Prisma schema with all 9 mental-specific models.

### 1.1 Types — `packages/types/src/index.ts`

Add the following interfaces/types to the shared types package:

```typescript
// ─── Mental Wellness Types ───────────────────────────────────────

export interface MentalBaseline {
  phq9Score: number;          // PHQ-9 total (0-27)
  gad7Score: number;          // GAD-7 total (0-21)
  stressBase: number;         // perceived stress 1-10
  moodBase: number;           // baseline mood 1-10
}

export interface MentalDailyCheckIn {
  checkinId: string;
  userId: string;
  dateIso: string;
  moodScore: number;          // 1-10, slider
  stressScoreManual: number;  // 1-10, manual self-rating
  anxietyScore: number;       // 1-10, slider
  energyScore: number;        // 1-10, slider
  focusScore: number;         // 1-10, slider
  sleepHours: number;         // float
  stressTriggerTags: string[];// multi-select
  copingActionUsed?: string;  // selected intervention
  supportRequested: boolean;  // default false
  rppgStressScore?: number;   // 0-100, only after scan
}

export interface RppgScanResult {
  scanId: string;
  userId: string;
  heartRateBpm: number;
  stressIndex: number;        // 0-100
  signalQuality: number;      // 0-1
  scanDurationSeconds: number;
  scannedAtIso: string;
}

export interface JournalEntry {
  entryId: string;
  userId: string;
  text: string;
  emotionTags: string[];
  triggerTags: string[];
  linkedScanId?: string;      // optional link to rPPG scan
  createdAtIso: string;
}

export interface CopingSession {
  sessionId: string;
  userId: string;
  interventionType: 'breathing' | 'grounding' | 'body_scan' | 'calm_audio' | 'journal_prompt';
  durationSeconds: number;
  completed: boolean;
  completedAtIso: string;
}

export interface SupportRequest {
  requestId: string;
  userId: string;
  issueType: string;
  preferredMode: 'chat' | 'audio' | 'video' | 'in_person';
  status: 'pending' | 'matched' | 'scheduled' | 'completed' | 'cancelled';
  createdAtIso: string;
}

export interface WeeklyReviewData {
  reviewId: string;
  userId: string;
  trend: {
    moodTrend: number[];       // 7 days
    stressTrend: number[];
    sleepTrend: number[];
    scanFrequency: number;
    copingSessionsCount: number;
  };
  newPlanVersion?: MentalWellnessPlan;
  notes?: string;
  reviewDateIso: string;
}

export interface LearningModule {
  moduleId: string;
  title: string;
  category: 'stress' | 'sleep' | 'boundaries' | 'emotional_regulation' | 'self_worth' | 'grief' | 'resilience';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  content: string;
}

export interface ContentProgressEntry {
  userId: string;
  moduleId: string;
  progressPercent: number;
  updatedAtIso: string;
}

export interface MentalAlertEvent {
  alertId: string;
  userId: string;
  level: 'info' | 'warning' | 'critical';
  reason: string;
  resolvedBy?: string;
  createdAtIso: string;
}

export interface MentalWellnessPlan {
  userId: string;
  createdAtIso: string;
  checkinFrequency: 'daily' | 'twice_daily';
  recommendedInterventions: string[];
  focusAreas: string[];
  weeklyGoals: string[];
}

export interface MentalWellnessScore {
  userId: string;
  compositeScore: number;     // 0-100
  baselineComponent: number;  // 35% weight
  dailyComponent: number;     // 25% weight
  rppgComponent: number;      // 20% weight
  engagementComponent: number;// 20% weight
  calculatedAtIso: string;
}

export interface CommunityPost {
  postId: string;
  topicId: string;
  authorId: string;
  isAnonymous: boolean;
  displayName: string;
  content: string;
  createdAtIso: string;
  reportCount: number;
  isBlocked: boolean;
}

export interface CommunityTopic {
  topicId: string;
  name: string;
  description: string;
  postCount: number;
}
```

### 1.2 Mental Scoring Engine — `packages/engines/mental-engine/`

**New directory**: `packages/engines/mental-engine/`

| File | Responsibility |
|------|----------------|
| `index.ts` | Barrel export |
| `package.json` | Package config (`@aura/mental-engine`) |
| `tsconfig.json` | TypeScript config |
| `scoring.ts` | **4-signal composite score calculator** — weights baseline (35%), daily check-ins (25%), rPPG (20%), engagement (20%). Each component normalized to 0-100. |
| `baseline.ts` | PHQ-9 scoring with clinical cutoffs (0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe). GAD-7 scoring (0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe). Stress & mood baseline normalization. |
| `checkin-analyzer.ts` | 7-day rolling average for mood, stress, anxiety, energy, focus, sleep. Trend detection (improving / stable / declining). Trigger frequency analysis. |
| `rppg-processor.ts` | Post-processing of rPPG scan results. Stress index normalization. Signal quality validation (reject scans with quality < 0.5). |
| `plan-generator.ts` | Rules engine that takes baseline + recent check-ins + scan results → generates a `MentalWellnessPlan`. Rules: high stress → recommend breathing + grounding; poor sleep → recommend sleep hygiene modules; high anxiety → recommend journaling + counselor booking. |
| `intervention-recommender.ts` | Given a stress index (from rPPG or manual), recommend 3-5 calming interventions ranked by relevance. Uses stress level thresholds: low (<30), moderate (30-60), high (60-80), critical (>80). |
| `weekly-reviewer.ts` | Computes weekly trend data, before/after baseline comparison, generates updated plan for next 7 days. Detects escalation events (critical stress sustained >3 days → alert). |
| `alert-engine.ts` | Monitors for escalation triggers: PHQ-9 item 9 positive (self-harm ideation), sustained critical stress, declining trend >2 weeks. Generates `MentalAlertEvent` with appropriate level. |

### 1.3 Database Schema — `packages/db/prisma/schema.prisma`

Extend existing schema with **9 new models**:

| Model | Table Name | Key Fields |
|-------|------------|------------|
| `MentalBaseline` | `mental_baselines` | `baseline_id, user_id, phq9, gad7, stress_base, mood_base` |
| `MentalCheckin` | `daily_checkins` | `checkin_id, user_id, mood, stress_manual, sleep, focus, anxiety, energy` |
| `RppgScan` | `rppg_scans` | `scan_id, user_id, heart_rate, stress_index, signal_quality` |
| `JournalEntry` | `journal_entries` | `entry_id, user_id, text, emotion_tags, trigger_tags` |
| `CopingSession` | `coping_sessions` | `session_id, user_id, intervention_type, duration, completion` |
| `SupportRequest` | `support_requests` | `request_id, user_id, issue_type, preferred_mode, status` |
| `WeeklyReview` | `weekly_reviews` | `review_id, user_id, trend, new_plan_version, notes` |
| `ContentProgress` | `content_progress` | `content_id, user_id, module, progress_percent` |
| `MentalAlert` | `alerts` | `alert_id, user_id, level, reason, resolved_by` |

Update `User` model to add relations to all 9 new models.

### 1.4 Verification

```bash
# Validate schema
cd packages/db && npx prisma validate

# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_mental_wellness_models

# Type check engine
cd packages/engines/mental-engine && npx tsc --noEmit
```

### Deliverables
- [ ] All mental types added to `@aura/types`
- [ ] `@aura/mental-engine` package created with all 10 modules
- [ ] Prisma schema extended with 9 models
- [ ] Migration runs successfully
- [ ] TypeScript compiles with no errors

---

## Phase 2 — API Layer

### Goal
Expose the mental engine via thin Next.js API routes. No business logic in routes — all logic delegated to the engine.

### 2.1 API Routes — `apps/web/app/api/mental/`

| File | Method | Endpoint | What it does |
|------|--------|----------|--------------|
| `baseline/route.ts` | POST | `/api/mental/baseline` | Save baseline assessment scores |
| `baseline/route.ts` | GET | `/api/mental/baseline` | Retrieve user's baseline |
| `checkin/route.ts` | POST | `/api/mental/checkin` | Submit daily check-in |
| `checkin/history/route.ts` | GET | `/api/mental/checkin/history` | Get last 30 days of check-ins |
| `rppg/route.ts` | POST | `/api/mental/rppg` | Save rPPG scan result |
| `rppg/history/route.ts` | GET | `/api/mental/rppg/history` | Get scan history |
| `journal/route.ts` | POST | `/api/mental/journal` | Create journal entry |
| `journal/route.ts` | GET | `/api/mental/journal` | List journal entries (paginated) |
| `coping/route.ts` | POST | `/api/mental/coping` | Log completed coping session |
| `support/route.ts` | POST | `/api/mental/support` | Create support/booking request |
| `support/route.ts` | GET | `/api/mental/support` | List support requests |
| `weekly-review/route.ts` | POST | `/api/mental/weekly-review` | Generate and save weekly review |
| `weekly-review/route.ts` | GET | `/api/mental/weekly-review` | Get latest weekly review |
| `score/route.ts` | GET | `/api/mental/score` | Get composite mental wellness score |
| `insights/route.ts` | GET | `/api/mental/insights` | Get trend data and insights |
| `content/route.ts` | GET | `/api/mental/content` | Get learning library modules |
| `content/progress/route.ts` | POST | `/api/mental/content/progress` | Update content progress |
| `plan/route.ts` | GET | `/api/mental/plan` | Get current mental wellness plan |

### 2.2 API Design Rules
- Every route validates request body with Zod schemas
- Every route requires `userId` from auth token
- All responses follow `{ ok: true, data: T }` or `{ ok: false, error: { message: string } }`
- Sensitive mental health data is audit logged on write
- Rate limiting: max 1 baseline per user, max 1 check-in per day per user

### Deliverables
- [ ] All 18 API routes created
- [ ] Request validation with Zod
- [ ] Audit logging on sensitive writes
- [ ] All routes tested with `curl` / test script

---

## Phase 3 — Local Storage & State Management

### Goal
Create the mobile-side persistence layer so screens can read/write mental wellness data locally (offline-first) and sync with the API.

### 3.1 Mental Store — `apps/mobile/lib/mental-store.ts`

**New file**: Dedicated AsyncStorage module with the key `@aura/mental`.

```
Storage Functions:
├── Baselines
│   ├── saveMentalBaseline(baseline)
│   └── getMentalBaseline(): MentalBaseline | null
├── Check-ins
│   ├── saveMentalCheckIn(checkIn)
│   ├── getTodayMentalCheckIn(): MentalDailyCheckIn | null
│   └── getMentalCheckInHistory(days: 30): MentalDailyCheckIn[]
├── rPPG Scans
│   ├── saveRppgScan(scan)
│   ├── getLatestRppgScan(): RppgScanResult | null
│   └── getRppgHistory(): RppgScanResult[]
├── Journal
│   ├── saveJournalEntry(entry)
│   ├── getJournalEntries(): JournalEntry[]
│   └── deleteJournalEntry(id)
├── Coping Sessions
│   ├── saveCopingSession(session)
│   └── getCopingSessions(): CopingSession[]
├── Support Requests
│   ├── saveSupportRequest(request)
│   └── getSupportRequests(): SupportRequest[]
├── Weekly Reviews
│   ├── saveWeeklyReview(review)
│   └── getLatestWeeklyReview(): WeeklyReviewData | null
├── Content Progress
│   ├── saveContentProgress(moduleId, percent)
│   └── getContentProgress(): Record<string, number>
├── Community (local-first)
│   ├── saveCommunityPost(post)
│   ├── getCommunityPosts(topicId): CommunityPost[]
│   ├── reportPost(postId)
│   └── blockUser(userId)
└── Mental Plan
    ├── saveMentalPlan(plan)
    └── getCurrentMentalPlan(): MentalWellnessPlan | null
```

### 3.2 Onboarding Store Extension — `apps/mobile/lib/onboarding-store.ts`

Add to `OnboardingState`:
```typescript
mentalBaseline?: MentalBaseline;
mentalQuestionnaireDone?: boolean;
mentalPlan?: MentalWellnessPlan;
lastRppgScan?: RppgScanResult;
```

### 3.3 Pillar Scoring Update — `apps/mobile/lib/pillar-scoring.ts`

Replace the simple `scoreMental(phq9, pss)` with the full 4-signal weighted model:

```
scoreMental() now takes:
  - baseline: { phq9, gad7, stress, mood } → 35%
  - recentCheckIns: last 7 days average → 25%
  - latestRppgScan: stress index (inverted) → 20%
  - engagement: { sessionsCompleted, journalEntries, supportUse } → 20%
```

### Deliverables
- [ ] `mental-store.ts` created with all CRUD functions
- [ ] `onboarding-store.ts` extended with mental fields
- [ ] `pillar-scoring.ts` updated with 4-signal model
- [ ] All functions typed with shared `@aura/types`

---

## Phase 4 — Core Screens: Hub, Onboarding, Check-in

### Goal
Build the three highest-priority screens that establish the mental module's entry points and daily usage pattern.

### 4.1 Navigation Layout — `apps/mobile/app/mental/_layout.tsx`

Stack navigator for the mental module (mirrors `physical/_layout.tsx`):
```
mental/
├── _layout.tsx
├── hub.tsx              ← Mental dashboard
├── onboarding.tsx       ← Mental assessment intake
├── checkin.tsx           ← Daily check-in
├── scan.tsx              ← rPPG stress scan (Phase 5)
├── calm-toolkit.tsx      ← Interventions (Phase 6)
├── journal.tsx           ← Journal list (Phase 6)
├── journal-entry.tsx     ← Journal compose (Phase 6)
├── learning.tsx          ← Learning library (Phase 7)
├── lesson.tsx            ← Individual lesson (Phase 7)
├── community.tsx         ← Community feed (Phase 7)
├── booking.tsx           ← Support booking (Phase 7)
├── weekly-review.tsx     ← Weekly review (Phase 8)
└── insights.tsx          ← Insights & progress (Phase 8)
```

### 4.2 Mental Hub — `apps/mobile/app/mental/hub.tsx`

**Screen: Mental Home Dashboard**

Layout from top to bottom:
1. **Header**: Greeting + current day + privacy pill
2. **Start Stress Scan** button — prominent, accent-colored
3. **Mental Wellness Ring** — animated circular progress ring showing composite score (0-100) with change indicator vs last week (+5 ↑ or -3 ↓)
4. **Secondary metric cards** — 4 cards in a 2×2 grid:
   - Mood (latest check-in value, emoji indicator)
   - Stress (latest manual + rPPG, dual indicator)
   - Sleep (hours from last check-in)
   - Focus (latest check-in value)
5. **Next Best Action** card — rules-engine recommendation (e.g., "Your stress is elevated. Try a 3-minute breathing exercise →")
6. **Footer row**: Journal shortcut · Help button · Weekly trend mini-chart

**Wireframe copy**:
- Headline: *"How are you feeling right now?"*
- Primary CTA: *"Start stress scan"*
- Support copy: *"You are in control. Scan only when you want to."*

**Components needed** (built in Phase 4):
- `MentalScoreRing.tsx` — animated ring
- `MetricCard.tsx` — small stat card

### 4.3 Mental Onboarding Assessment — `apps/mobile/app/mental/onboarding.tsx`

**Screen: Multi-step mental wellness intake**

Steps (sections):
1. **Welcome** — explain what we measure, privacy assurance
2. **PHQ-9** — 9 items, each 0-3 scale (reuse existing `LikertSection` component pattern)
3. **GAD-7** — 7 items, each 0-3 scale (new — Generalized Anxiety Disorder screener)
4. **Stress Scale** — single slider 1-10 (*"How stressed do you generally feel?"*)
5. **Mood Baseline** — single slider 1-10 (*"How would you rate your overall mood?"*)
6. **Preferences** — calming style preference (chips: breathing, grounding, audio, journaling), prior therapy experience (yes/no), common triggers (multi-select chips: work, relationships, finances, health, sleep, loneliness, grief, other)
7. **Plan Summary** — warm completion screen showing first generated plan

**UI Components**:
- Progress bar (dots/segments per section)
- Sliders (1-10 with emoji labels at min/max)
- Chip multi-select for triggers & preferences
- Skip-and-continue-later support (saves partial state)

**Wireframe copy**:
- Step copy: *"Let's understand how you feel so we can personalize your support."*
- Question examples: *"Mood today, current stress, common triggers, sleep, support preference, prior therapy, preferred calming style."*
- Submit CTA: *"Create my first wellness plan"*

**Data flow**:
1. User completes steps → answers saved to `mental-store`
2. On submit → call `mental-engine/baseline.ts` to compute clinical scores
3. Call `mental-engine/plan-generator.ts` to generate first plan
4. Save baseline + plan to local store + POST to `/api/mental/baseline`
5. Navigate to hub

### 4.4 Daily Check-In — `apps/mobile/app/mental/checkin.tsx`

**Screen: Quick daily mental snapshot** (must complete in < 30 seconds)

**Fields**:
| Field | Type | Required | UI |
|-------|------|----------|-----|
| `mood_score` | integer 1-10 | Yes | Slider with emoji labels |
| `stress_score_manual` | integer 1-10 | Yes | Slider |
| `anxiety_score` | integer 1-10 | Yes | Slider |
| `energy_score` | integer 1-10 | Yes | Slider |
| `focus_score` | integer 1-10 | Yes | Slider |
| `sleep_hours` | float | Yes | Number input with quick-select buttons (5h, 6h, 7h, 8h, 9h) |
| `stress_trigger_tags` | array | No | Multi-select chips |
| `coping_action_used` | string | No | Single-select from recent interventions |
| `support_requested` | boolean | No | Toggle, default false |

**Design**:
- Single scrollable screen, no stepper
- Large tap targets, sliders with haptic feedback
- Auto-timestamp on submission
- Post-submit: brief "Saved ✓" animation, then return to hub

### 4.5 Shared UI Components — `apps/mobile/components/mental/`

Build these alongside the screens:

| Component | Used By |
|-----------|---------|
| `MentalScoreRing.tsx` | Hub — animated SVG ring |
| `MoodSlider.tsx` | Check-in, Onboarding — 1-10 with emojis (😞 → 😊) |
| `MetricCard.tsx` | Hub — mini stat card |
| `EmotionTagPicker.tsx` | Journal, Check-in — multi-select chips |
| `TriggerTagPicker.tsx` | Check-in, Onboarding — multi-select chips |
| `ActionCard.tsx` | Hub — next-best-action recommendation card |

### 4.6 Root Layout Update — `apps/mobile/app/_layout.tsx`

Add mental stack:
```tsx
<Stack.Screen name="mental" />
```

### 4.7 Dashboard Update — `apps/mobile/app/(tabs)/dashboard.tsx`

Modify `handleSegmentPress` for the mental pillar:
```typescript
if (pillar.key === "mental") {
  if (mentalDone) {
    router.push("/mental/hub");
  } else {
    router.push("/mental/onboarding");
  }
}
```

### Deliverables
- [ ] `mental/_layout.tsx` created
- [ ] `mental/hub.tsx` — full dashboard with score ring, metrics, action card
- [ ] `mental/onboarding.tsx` — 7-step assessment flow
- [ ] `mental/checkin.tsx` — quick daily check-in (< 30s target)
- [ ] 6 UI components created in `components/mental/`
- [ ] Root layout updated with mental stack
- [ ] Dashboard mental segment wired to hub/onboarding
- [ ] Mental pillar score on dashboard uses real data

---

## Phase 5 — rPPG Stress Scan

### Goal
Implement a camera-based stress measurement using the POS (Plane Orthogonal to Skin) rPPG algorithm via `react-native-vision-camera` with a custom native frame processor plugin.

### 5.1 Dependencies

```bash
# Install vision camera
npm install react-native-vision-camera

# Install fast OpenCV for native image processing
npm install react-native-fast-opencv

# Install worklets for frame processor communication
npm install react-native-worklets-core
```

### 5.2 Native Frame Processor Plugin

**New directory**: `apps/mobile/native-modules/rppg-processor/`

| File | Purpose |
|------|---------|
| `android/src/main/java/com/aura/rppg/RppgFrameProcessorPlugin.kt` | Android native plugin — receives camera frames, extracts face ROI, computes average RGB from forehead/cheek regions, feeds into POS algorithm |
| `android/src/main/java/com/aura/rppg/PosAlgorithm.kt` | Port of POS (Plane Orthogonal to Skin) algorithm. Takes 30s of RGB signal samples → bandpass filter (0.7-4.0 Hz) → FFT → peak frequency → heart rate. Computes stress index from HRV (heart rate variability). |
| `ios/RppgFrameProcessorPlugin.swift` | iOS equivalent of the Android plugin |
| `ios/PosAlgorithm.swift` | iOS port of POS algorithm |

**Algorithm pipeline**:
```
Camera Frame (30fps, 30-60 seconds)
  ↓
Face Detection (MediaPipe or OpenCV Haar cascade)
  ↓
ROI Extraction (forehead + cheeks → average RGB per frame)
  ↓
Signal Buffer (collect 900-1800 RGB samples)
  ↓
POS Algorithm (plane orthogonal to skin tone)
  ↓
Bandpass Filter (0.7 - 4.0 Hz → 42-240 BPM range)
  ↓
FFT (Fast Fourier Transform → dominant frequency)
  ↓
Heart Rate (BPM) + HRV (RMSSD) → Stress Index (0-100)
  ↓
Signal Quality Score (SNR-based, 0-1)
```

### 5.3 rPPG Scan Screen — `apps/mobile/app/mental/scan.tsx`

**Replaces**: `apps/mobile/app/stress-scan.tsx` (current placeholder)

**7-step flow** (single screen with state machine):

| Step | Screen State | UI |
|------|-------------|-----|
| 1 | `consent` | Permission screen — camera icon, explanation text: *"Use your camera to estimate your current stress level from facial signal changes."*, "Allow Camera" button |
| 2 | `preparation` | Pre-scan guidance — checklist: good lighting ✓, still position ✓, face visible ✓. Help text: *"Hold still for 30-60 seconds. Good lighting improves accuracy."* |
| 3 | `scanning` | Live camera feed with face frame overlay, real-time signal quality indicator (`ScanIndicator.tsx`), countdown timer (30-60s), pulsing border color to indicate signal lock |
| 4 | `processing` | Brief loading animation while POS algorithm computes final results |
| 5 | `result` | Result screen — heart rate BPM, stress index gauge (`StressMeter.tsx`), signal quality badge. Immediate recommendation below. Copy: *"Your stress level appears elevated. Let's start a 3-minute reset."* |
| 6 | `intervention` | Optional — launches calm toolkit. After completion, offers re-scan option |
| 7 | `saved` | Save confirmation + navigate to hub or weekly trend |

**Components needed**:
| Component | Purpose |
|-----------|---------|
| `ScanIndicator.tsx` | Real-time signal quality bars (like cell signal) |
| `StressMeter.tsx` | Circular stress gauge 0-100 with color gradient |
| `FaceFrameOverlay.tsx` | Camera overlay with face position guide |

**Important product rule**: The rPPG result is presented as a **wellness estimate** that complements the questionnaire, not replaces it.

### 5.4 Verification
- Test on physical Android device (emulator lacks camera)
- Verify heart rate measurement against manual pulse count
- Validate stress index correlates with subjective stress reports
- Ensure signal quality rejects poor scans (< 0.5)

### Deliverables
- [ ] `react-native-vision-camera` integrated
- [ ] Custom native frame processor plugin (Android + iOS)
- [ ] POS algorithm ported and validated
- [ ] 7-step scan flow screen
- [ ] 3 scan-specific UI components
- [ ] Results save to mental-store + API
- [ ] Old `stress-scan.tsx` replaced

---

## Phase 6 — Calm Toolkit & Journal

### Goal
Build the immediate intervention system and the journaling feature.

### 6.1 Calm Toolkit — `apps/mobile/app/mental/calm-toolkit.tsx`

**Screen: Instant calm toolkit** — accessible from scan results, hub action card, or directly.

**Interventions** (3-5 minute each):

| Intervention | Component | Description |
|-------------|-----------|-------------|
| Breathing | `BreathingExercise.tsx` | Animated expanding/contracting circle. Pattern: 4s inhale → 4s hold → 6s exhale → 2s pause. Customizable: box breathing (4-4-4-4), 4-7-8, simple slow breath. Visual + optional haptic timing. |
| Grounding | `GroundingExercise.tsx` | 5-4-3-2-1 senses exercise. Step-by-step prompts: "Name 5 things you can see" → "4 things you can touch" → etc. Timed auto-advance with manual override. |
| Body Scan | `BodyScanGuide.tsx` | Progressive muscle relaxation guide. Body outline SVG with highlighted zones. 5-minute guided sequence: feet → legs → torso → arms → head. |
| Calm Audio | Audio player | Ambient nature sounds (rain, ocean, forest). Requires audio assets or integration with free ambient sound API. Timer: 1, 3, 5 minutes. |
| Quick Journal | Navigation to `journal-entry.tsx` | Guided 1-minute journal prompt: *"Write one sentence about how you feel right now."* |

**Wireframe copy**:
- Headline: *"Take a short reset now"*
- Buttons: *"Breathe 1 minute" · "Ground me" · "Play calm audio" · "Open journal"*

**Post-intervention**:
- Auto-log `CopingSession` with type, duration, completion status
- Offer optional re-scan to show improvement

### 6.2 Journal — `apps/mobile/app/mental/journal.tsx`

**Screen: Journal entry list**

- List of past journal entries (most recent first)
- Each card shows: date, emotion tags as colored chips, preview text (truncated)
- Floating action button to create new entry
- Search/filter by emotion tag
- Weekly pattern summary at top: "You journaled 5 times this week. Most common triggers: work stress, sleep."

### 6.3 Journal Entry — `apps/mobile/app/mental/journal-entry.tsx`

**Screen: Compose/view journal entry**

- Free text input with placeholder: *"Write what is on your mind..."*
- Guided prompt toggle: *"What happened, how did it feel, and what helped?"*
- Emotion tag picker (chips): happy, calm, anxious, sad, angry, hopeful, grateful, overwhelmed, lonely, scared, numb, energized
- Trigger tag picker (chips): work, relationships, finances, health, sleep, loneliness, grief, family, social media, news, other
- "Link to recent scan" button — attaches latest rPPG scan result
- Save button + delete for existing entries

### 6.4 Components

| Component | File |
|-----------|------|
| `BreathingExercise.tsx` | Animated breathing circle with customizable pattern |
| `GroundingExercise.tsx` | 5-4-3-2-1 senses stepper |
| `BodyScanGuide.tsx` | Body outline SVG with progressive highlight |
| `JournalCard.tsx` | Journal entry list item card |

### Deliverables
- [ ] Calm toolkit with 4 working interventions (breathing, grounding, body scan, journal prompt)
- [ ] Audio player with ambient sounds (or placeholders with clear asset slots)
- [ ] Journal list screen with search/filter
- [ ] Journal compose screen with emotion/trigger tags
- [ ] Coping sessions logged automatically
- [ ] Post-intervention re-scan flow

---

## Phase 7 — Learning Library, Community & Booking

### Goal
Build the content, social, and human-support features.

### 7.1 Learning Library — `apps/mobile/app/mental/learning.tsx`

**Screen: Learning library list**

- Categories as horizontal scrollable tabs: All · Stress · Sleep · Boundaries · Emotional Regulation · Self-Worth · Grief · Resilience
- Each lesson card shows: title, duration, difficulty badge, recommended time, progress bar
- Header copy: *"Build calm skills one lesson at a time"*
- Completion tracking via `ContentProgress`
- Completion of lessons feeds into the engagement component (20%) of the mental score

### 7.2 Lesson Screen — `apps/mobile/app/mental/lesson.tsx`

- Rich text content display
- Progress tracking (scroll-based or manual "Mark Complete")
- On completion → update `ContentProgress` in mental-store + POST to API
- Triggers plan engine update (engagement signal)

### 7.3 Community — `apps/mobile/app/mental/community.tsx`

**Screen: Community / Anonymous Support**

**Local-first AsyncStorage implementation**:
- Topic-based spaces (tabs): General · Stress & Anxiety · Sleep · Relationships · Work · Recovery
- Post creation form:
  - Text input
  - Anonymous toggle (*"You can share without revealing your identity."*)
  - Submit button
- Post list:
  - Display name or "Anonymous"
  - Post content
  - Timestamp
  - Report button (3+ reports → auto-hide)
  - Block user button
- Crisis escalation button (persistent, always visible): "If you're in crisis, tap here for immediate help" → links to crisis hotline + in-app booking flow

**Data model** (AsyncStorage, key `@aura/community`):
```typescript
{
  posts: CommunityPost[],
  blockedUsers: string[],
  reportedPosts: string[],
  topics: CommunityTopic[]
}
```

### 7.4 Human Support Booking — `apps/mobile/app/mental/booking.tsx`

**Screen: Book a counselor**

- Issue type selection (chips): Stress · Anxiety · Depression · Relationships · Work · Grief · Sleep · Other
- Language preference selector
- Preferred style: Directive · Non-directive · CBT-based · Mindfulness-based
- Mode selection: Chat · Audio · Video · In-person
- Availability calendar (simple date/time picker)
- Reason for booking (optional text)
- Desired outcome (optional text)
- Submit → `SupportRequest` saved locally + POST to API

**Wireframe copy**:
- CTA: *"Book a counselor"*
- Helper text: *"Choose what feels most comfortable: chat, audio, or video."*

### 7.5 Components

| Component | File |
|-----------|------|
| `LessonCard.tsx` | Learning library item |
| `CommunityPost.tsx` | Community post card |
| `CounselorCard.tsx` | Counselor profile card (for future counselor matching) |
| `CrisisButton.tsx` | Persistent crisis escalation button |

### Deliverables
- [ ] Learning library with category tabs and progress tracking
- [ ] Lesson viewer with completion tracking
- [ ] Community with anonymous posting, report/block
- [ ] Crisis escalation button wired to hotline + booking
- [ ] Booking screen with full form
- [ ] All data persisted locally via mental-store

---

## Phase 8 — Weekly Review, Insights & Final Integration

### Goal
Build the analytics screens, complete navigation wiring, and polish.

### 8.1 Weekly Review — `apps/mobile/app/mental/weekly-review.tsx`

**Screen: Your week in one view**

- 7-day summary cards: mood trend, stress trend, sleep trend
- Scan count for the week
- Coping sessions completed
- Most effective intervention (from coping session data)
- Before/after comparison chart (`WeeklyComparisonChart.tsx`) — baseline vs current week
- Reflection prompt: *"What helped most this week, and what should change next week?"*
- Free text response saved with review
- On submit → calls `mental-engine/weekly-reviewer.ts` to generate updated plan → auto-saves new `MentalWellnessPlan`
- Headline: *"Your week in one view"*

### 8.2 Insights & Progress — `apps/mobile/app/mental/insights.tsx`

**Screen: Insights & Progress**

- **Trend charts** (7-day, 30-day toggleable):
  - Mood score trend line
  - Stress score trend line (manual + rPPG overlaid)
  - Sleep hours bar chart
  - Scan frequency sparkline
  - Coping session frequency sparkline
  - Escalation events timeline
- **AI Insight cards** — data-driven observations:
  - *"Your stress improved on days you used breathing and slept at least 7 hours."*
  - *"Mood dips on Mondays — consider a morning check-in routine."*
  - *"You've completed 5 grounding sessions this week. Keep it up!"*
- Progress vs baseline comparison

**Components needed**:
| Component | Purpose |
|-----------|---------|
| `TrendChart.tsx` | Generic 7/30-day line chart (SVG-based) |
| `InsightCard.tsx` | Data-driven insight card |
| `WeeklyComparisonChart.tsx` | Before/after grouped bar chart |

### 8.3 Final Navigation & Dashboard Wiring

- Ensure all hub cards navigate correctly
- Ensure dashboard mental pillar → hub when done, → onboarding when not
- Check-in accessible from hub and tab bar
- Scan accessible from hub, check-in, and quick actions on main dashboard
- Journal shortcut in hub footer
- Help button in hub footer → booking screen
- Weekly trend chart in hub footer → insights screen

### 8.4 Non-Functional Requirements Checklist

| Requirement | Implementation |
|-------------|----------------|
| Mobile-first responsive design | All screens built for phone form factor with NativeWind responsive classes |
| Low-friction UI with large tap targets | Minimum 44pt touch targets, sliders instead of text input |
| Fast load times on low-end devices | AsyncStorage caching, minimal re-renders, lazy screen loading |
| Local processing for rPPG | All rPPG processing runs on-device via native module (no server upload of video) |
| Encryption in transit and at rest | HTTPS for API calls, AsyncStorage encryption via `expo-secure-store` for sensitive keys |
| Role-based access | User/counselor/admin roles in API auth middleware |
| Accessibility | Captions, contrast ratios (WCAG AA), font scaling support, screen reader labels on all interactive elements |

### 8.5 Comprehensive Testing

```bash
# Type check entire codebase
npx tsc --noEmit

# Run Prisma validation
cd packages/db && npx prisma validate

# Start API server
cd apps/web && npm run dev

# Test all mental API routes
./test-mental-apis.sh

# Start mobile app
cd apps/mobile && npx expo run:android

# Manual testing flow:
# 1. Dashboard → tap Mental segment → Mental Onboarding
# 2. Complete 7-step assessment → First plan generated
# 3. Navigate to Hub → verify score ring, metric cards, action card
# 4. Complete daily check-in (< 30 seconds)
# 5. Run rPPG stress scan → get result
# 6. Launch calm toolkit from result → complete breathing exercise
# 7. Re-scan → verify improvement displayed
# 8. Write journal entry with emotion tags
# 9. Browse learning library → complete a lesson
# 10. Post in community (anonymous)
# 11. Book a counselor
# 12. View weekly review → submit reflection
# 13. View insights → verify trend charts
```

### Deliverables
- [ ] Weekly review screen with plan auto-update
- [ ] Insights screen with trend charts and AI insight cards
- [ ] All navigation wired correctly
- [ ] Dashboard mental segment functional
- [ ] Full acceptance criteria verified
- [ ] Non-functional requirements met
- [ ] End-to-end manual test passing

---

## Acceptance Criteria (from PRD)

| # | Criterion | Phase |
|---|-----------|-------|
| 1 | User can complete onboarding and receive a first mental wellness plan | 4 |
| 2 | User can complete a daily check-in in under 30 seconds | 4 |
| 3 | User can initiate rPPG stress measurement and receive a result within one flow | 5 |
| 4 | The app can recommend a calming intervention based on stress level | 5, 6 |
| 5 | User can journal, save, and revisit past entries | 6 |
| 6 | User can book human support from within the mental module | 7 |
| 7 | The weekly review updates the plan based on the last 7 days of behavior | 8 |
| 8 | Progress charts reflect both questionnaire and rPPG trends | 8 |
| 9 | All sensitive fields are permission-gated and audit logged | 2, 8 |

---

## File Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Types | 0 | 1 (`packages/types/src/index.ts`) |
| Engine | 10 | 0 |
| Database | 0 | 1 (`packages/db/prisma/schema.prisma`) |
| API | 12 | 0 |
| Mobile Store | 1 | 2 (`onboarding-store.ts`, `pillar-scoring.ts`) |
| Components | 15 | 0 |
| Screens | 14 | 0 |
| Navigation | 0 | 2 (`_layout.tsx`, `dashboard.tsx`) |
| Native Modules | 4 | 0 |
| Config | 1 (test script) | 1 (`app.json` for camera) |
| **Total** | **~57** | **~7** |
