# Spiritual / Inner Calm Section — Implementation Plan

> Based on: SPIRITUAL 1.pdf (content/monetization), SPIRITUAL 2.pdf (engine/AI coach), SPIRITUAL 3.pdf (questionnaire/screens/DB)

---

## 1. Architecture Overview

The spiritual section mirrors the mental section 1:1 in architecture:

```
packages/types/src/spiritual.ts          — Type definitions
packages/engines/spiritual-engine/       — Pure scoring + plan logic
packages/db/prisma/schema.prisma         — DB models (extend)
apps/web/app/api/spiritual/              — API routes
apps/mobile/lib/spiritual-store.ts       — Local AsyncStorage cache
apps/mobile/app/spiritual/               — All screens
apps/mobile/app/(tabs)/dashboard.tsx     — Route spiritual segment tap
```

All data flows follow the existing pattern: **local-first (AsyncStorage) + async API sync**.

---

## 2. Implementation Phases

### Phase 1 — Foundation (types, engine, DB, store, API)
### Phase 2 — Onboarding Assessment (24 questions across 5 domains)
### Phase 3 — Hub + Daily Check-in
### Phase 4 — Practice Library (meditation, breathwork, soundscapes)
### Phase 5 — Journal / Gratitude / Reflection
### Phase 6 — Weekly Progress + Insights
### Phase 7 — Live Sessions Hub (placeholder for Phase 2 launch)
### Phase 8 — Dashboard Integration + Polish

---

## 3. Phase 1 — Foundation

### 3.1 Types (`packages/types/src/spiritual.ts`)

Export from `packages/types/src/index.ts`.

```typescript
// ── Domain identifiers ──
export type SpiritualDomain = "meaning" | "peace" | "mindfulness" | "connection" | "practice";

// ── Score band (maps to adaptive plan routing) ──
export type SpiritualBand = "green" | "yellow" | "orange" | "red";

// ── Feeling chips for daily check-in ──
export const SPIRITUAL_FEELING_TAGS = [
  "peaceful", "distracted", "heavy", "grateful", "restless", "inspired",
] as const;
export type SpiritualFeelingTag = (typeof SPIRITUAL_FEELING_TAGS)[number];

// ── Calm blockers ──
export const SPIRITUAL_BLOCKER_TAGS = [
  "work", "conflict", "phone_overload", "loneliness", "worry", "health", "other",
] as const;
export type SpiritualBlockerTag = (typeof SPIRITUAL_BLOCKER_TAGS)[number];

// ── Practice types ──
export const SPIRITUAL_PRACTICE_TYPES = [
  "meditation", "breathwork", "prayer", "gratitude", "journaling",
  "nature", "soundscape", "silent_sitting", "kindness_act",
] as const;
export type SpiritualPracticeType = (typeof SPIRITUAL_PRACTICE_TYPES)[number];

// ── Content categories ──
export const SPIRITUAL_CONTENT_CATEGORIES = [
  "sleep", "stress_release", "focus", "gratitude", "anxiety_relief",
  "self_compassion", "chakra", "silent_sitting",
] as const;
export type SpiritualContentCategory = (typeof SPIRITUAL_CONTENT_CATEGORIES)[number];

// ── Onboarding question definition ──
export interface SpiritualQuestion {
  id: string;
  domain: SpiritualDomain;
  text: string;
  reverseScored: boolean;
}

// ── Baseline (output of onboarding assessment) ──
export interface SpiritualBaseline {
  meaningScore: number;       // 0-100
  peaceScore: number;         // 0-100
  mindfulnessScore: number;   // 0-100
  connectionScore: number;    // 0-100
  practiceScore: number;      // 0-100
  totalScore: number;         // 0-100 weighted composite
  band: SpiritualBand;
  weakestDomain: SpiritualDomain;
  preferredPracticeTime: string | null;    // "morning" | "evening" | "anytime"
  preferredSupportStyle: string | null;    // "guided" | "self_directed" | "community"
  rawAnswers: number[];       // all 24 answers (0-4 each)
  createdAt: string;
}

// ── Daily check-in ──
export interface SpiritualDailyCheckIn {
  id: string;
  date: string;                            // ISO date
  calmScore: number;                       // 0-10 slider
  didPractice: boolean;                    // meditation/prayer/breathwork/quiet
  feltConnected: "yes" | "a_little" | "no";
  natureOrReflectionHelped: "yes" | "a_little" | "no";
  blockers: SpiritualBlockerTag[];
  feelings: SpiritualFeelingTag[];
  createdAt: string;
}

// ── Practice session log ──
export interface SpiritualPracticeSession {
  id: string;
  type: SpiritualPracticeType;
  contentId: string | null;
  durationMinutes: number;
  completedAt: string;
  rating: number | null;       // 1-5
}

// ── Journal / gratitude / reflection entry ──
export interface SpiritualJournalEntry {
  id: string;
  promptType: "free" | "gratitude" | "reflection";
  moodTag: SpiritualFeelingTag | null;
  gratitudeText: string | null;
  reflectionText: string | null;
  whatBroughtCalm: string | null;
  whatTriggeredDiscomfort: string | null;
  whatHelped: string | null;
  createdAt: string;
}

// ── Weekly review ──
export interface SpiritualWeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  calmFrequency: number;       // 0-4 (never..very_often)
  presenceFrequency: number;   // 0-4
  practiceRecovery: number;    // 0-4
  gratitudeFrequency: number;  // 0-4
  connectionFrequency: number; // 0-4
  whatHelpedMost: SpiritualPracticeType | null;
  whatHurtMost: SpiritualBlockerTag | null;
  planIntensity: "increase" | "keep" | "reduce";
  calmScoreChange: number;
  engagementSummary: string | null;
  createdAt: string;
}

// ── Adaptive plan ──
export interface SpiritualWellnessPlan {
  primaryGoal: string;
  dailyAnchorHabit: string;
  recoveryAction: string;
  weeklyReflectionPrompt: string;
  liveExpertSuggestion: string | null;
  contentBundle: string[];
  followUpDate: string;
  focusDomain: SpiritualDomain;
  band: SpiritualBand;
  escalationRisk: "info" | "warning" | "critical";
  createdAt: string;
}

// ── AI coach message ──
export interface SpiritualCoachMessage {
  text: string;
  band: SpiritualBand;
  suggestedAction: string | null;
}

// ── Score run (for history) ──
export interface SpiritualScoreRun {
  meaningScore: number;
  peaceScore: number;
  mindfulnessScore: number;
  connectionScore: number;
  practiceScore: number;
  totalScore: number;
  band: SpiritualBand;
  confidence: number;    // 0-1
  createdAt: string;
}
```

### 3.2 Scoring Engine (`packages/engines/spiritual-engine/`)

**Directory structure:**
```
packages/engines/spiritual-engine/
  src/
    index.ts              — barrel exports
    questions.ts          — 24 question bank with domain + reverse-score flags
    baseline.ts           — onboarding scoring (5 domains → composite)
    scoring.ts            — composite scoring (baseline + daily + engagement)
    plan-generator.ts     — adaptive plan rules by domain/band
    checkin-analyzer.ts   — daily trend analysis
    weekly-reviewer.ts    — 7-day retrospective
    coach.ts              — AI coach response templates by band
    alert-engine.ts       — safety/escalation detection
  package.json
  tsconfig.json
```

**3.2.1 Question Bank (`questions.ts`)**

All 24 questions from PRD Section 3, organized by domain:

| Domain | # Questions | Reverse-Scored |
|--------|-------------|----------------|
| Meaning | 5 | None |
| Peace | 5 | None |
| Mindfulness | 5 | Q3 ("I often move through my day on autopilot") |
| Connection | 5 | None |
| Practice | 4 | None |

Each question scored 0-4 (Never=0, Rarely=1, Sometimes=2, Often=3, Always=4).
Reverse-scored: Always=0, Often=1, Sometimes=2, Rarely=3, Never=4.

**3.2.2 Baseline Scoring (`baseline.ts`)**

```
Per domain:
  1. Apply reverse-scoring where flagged
  2. Average all items in domain (0-4 range)
  3. Normalize to 0-100: (average / 4) * 100

Composite score:
  totalScore = meaning * 0.25 + peace * 0.25 + mindfulness * 0.20 + connection * 0.20 + practice * 0.10

Band classification:
  80-100 → green  (strong inner calm)
  60-79  → yellow (healthy, needs consistency)
  40-59  → orange (mild gap, increase support)
  0-39   → red    (low inner calm, deeper support)

Override rules:
  - Any severe distress / hopelessness / self-harm signal → force red
  - Repeated inability to cope (3+ days) → force orange or red
  - Low confidence (< 75% questions answered) → do not overstate certainty
```

Export functions:
- `computeDomainScore(answers: number[], reverseIndices: number[]): number`
- `computeInnerCalmScore(domainScores): { totalScore, band, weakestDomain }`
- `buildSpiritualBaseline(rawAnswers, preferences): SpiritualBaseline`
- `classifyBand(score: number): SpiritualBand`

**3.2.3 Composite Scoring (`scoring.ts`)**

For ongoing score updates (not just onboarding):

```
Composite = baseline_component * 0.35
           + daily_component * 0.25
           + engagement_component * 0.20
           + practice_component * 0.20

Where:
  baseline_component  = most recent SpiritualBaseline.totalScore
  daily_component     = average calmScore from last 7 daily check-ins, mapped to 0-100
  engagement_component = weighted sum of:
    - journal entries this week (0-100, 3+ = 100)
    - live sessions attended (0-100, 1+ = 100)
    - community participation (0-100)
  practice_component  = weighted sum of:
    - practice minutes this week (0-100, 70min+ = 100)
    - streak days (0-100, 7+ = 100)
    - nature exposure minutes (0-100, 30min+ = 100)
```

Export:
- `computeSpiritualWellnessScore(baseline, checkIns, sessions, journalEntries): SpiritualScoreRun`

**3.2.4 Adaptive Plan Generator (`plan-generator.ts`)**

Rules by domain weakness (from PRD Section 7):

| Weak Domain | Actions |
|-------------|---------|
| **Meaning** | Purpose prompts, values-alignment journaling, kindness challenge, reduce passive content |
| **Peace** | Breathing/stillness/guided meditation, shorter tasks, bedtime calm routine, limit overstimulation |
| **Mindfulness** | Body-awareness check-ins, micro pause-and-notice notifications, 1-min attention training, present-moment logging |
| **Connection** | Gratitude/relationship prompts, community/live sessions, nature sessions, support-person reminders |
| **Practice** | Reduce routine length, one-tap actions only, streak protection, easier entry (1-min reset vs 10-min) |

Routing by band:
- **Green**: maintain habits, praise consistency, offer advanced practices
- **Yellow**: recommend one focused habit + short routine
- **Orange**: reduce complexity, increase guided support, suggest live expert
- **Red**: stop normal flow, route to human support / crisis pathway

Export:
- `generateSpiritualPlan(baseline, checkIns, preferences): SpiritualWellnessPlan`
- `generateInitialPlan(baseline): SpiritualWellnessPlan`

**3.2.5 AI Coach (`coach.ts`)**

Response templates by band (PRD Section 8):

```
Green:  "You are doing well today. Keep the routine that is helping you."
Yellow: "Your inner calm is a little lower than usual. Let's do one short practice now."
Orange: "This week looks heavy. I recommend a simpler plan and a live session with an expert."
Red:    "I want to help you reach support now. Tap here to connect with a professional."
```

Context inputs: current band, weakest domain, last 3 days trend, most recent trigger, recent practice history, user preference, support availability.

Export:
- `generateCoachMessage(band, weakestDomain, recentTrend, trigger): SpiritualCoachMessage`

**3.2.6 Check-in Analyzer (`checkin-analyzer.ts`)**

Daily judgement criteria from PRD Section 4:
- 0-2 calm = red
- 3-4 = orange
- 5-6 = yellow
- 7-10 = green
- Repeated "No" on practice/connection for several days = yellow/orange
- Worsening distress / inability to cope → escalate to human support

Export:
- `analyzeSpiritualCheckIns(checkIns: SpiritualDailyCheckIn[], days: number): TrendData`
- `detectDailyAlerts(checkIn: SpiritualDailyCheckIn, recentHistory: SpiritualDailyCheckIn[]): Alert[]`

**3.2.7 Weekly Reviewer (`weekly-reviewer.ts`)**

Weekly judgement criteria from PRD Section 5:
- Low calm + low mindfulness + low practice adherence = orange
- Weak connection + weak purpose + weak practice = orange/red
- Improvement in one area but not others = keep plan, change dominant practice type

Export:
- `generateSpiritualWeeklyReview(checkIns, sessions, journal, baseline): SpiritualWeeklyReview`
- `shouldChangePlan(review, currentPlan): boolean`

### 3.3 Database Schema Extension

Add to `packages/db/prisma/schema.prisma`:

```prisma
model SpiritualBaseline {
  id                    String   @id @default(cuid())
  userId                String   @map("user_id")
  user                  User     @relation(fields: [userId], references: [id])
  meaningScore          Int      @map("meaning_score")
  peaceScore            Int      @map("peace_score")
  mindfulnessScore      Int      @map("mindfulness_score")
  connectionScore       Int      @map("connection_score")
  practiceScore         Int      @map("practice_score")
  totalScore            Int      @map("total_score")
  band                  String
  weakestDomain         String   @map("weakest_domain")
  preferredPracticeTime String?  @map("preferred_practice_time")
  preferredSupportStyle String?  @map("preferred_support_style")
  rawAnswers            Json     @map("raw_answers")
  createdAt             DateTime @default(now()) @map("created_at")

  @@map("spiritual_baselines")
}

model SpiritualCheckin {
  id                       String   @id @default(cuid())
  userId                   String   @map("user_id")
  user                     User     @relation(fields: [userId], references: [id])
  date                     String
  calmScore                Int      @map("calm_score")
  didPractice              Boolean  @map("did_practice")
  feltConnected            String   @map("felt_connected")
  natureOrReflectionHelped String   @map("nature_reflection_helped")
  blockers                 Json     @default("[]")
  feelings                 Json     @default("[]")
  createdAt                DateTime @default(now()) @map("created_at")

  @@unique([userId, date])
  @@map("spiritual_checkins")
}

model SpiritualPracticeSession {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  user            User     @relation(fields: [userId], references: [id])
  type            String
  contentId       String?  @map("content_id")
  durationMinutes Int      @map("duration_minutes")
  completedAt     DateTime @map("completed_at")
  rating          Int?
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("spiritual_practice_sessions")
}

model SpiritualJournalEntry {
  id                       String   @id @default(cuid())
  userId                   String   @map("user_id")
  user                     User     @relation(fields: [userId], references: [id])
  promptType               String   @map("prompt_type")
  moodTag                  String?  @map("mood_tag")
  gratitudeText            String?  @map("gratitude_text")
  reflectionText           String?  @map("reflection_text")
  whatBroughtCalm          String?  @map("what_brought_calm")
  whatTriggeredDiscomfort   String?  @map("what_triggered_discomfort")
  whatHelped               String?  @map("what_helped")
  createdAt                DateTime @default(now()) @map("created_at")

  @@map("spiritual_journal_entries")
}

model SpiritualWeeklyReport {
  id                    String   @id @default(cuid())
  userId                String   @map("user_id")
  user                  User     @relation(fields: [userId], references: [id])
  weekStart             String   @map("week_start")
  weekEnd               String   @map("week_end")
  calmScoreChange       Int      @map("calm_score_change")
  engagementSummary     String?  @map("engagement_summary")
  suggestedNextActions  Json?    @map("suggested_next_actions")
  reviewData            Json?    @map("review_data")
  createdAt             DateTime @default(now()) @map("created_at")

  @@map("spiritual_weekly_reports")
}

model SpiritualPlanVersion {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id])
  planJson   Json     @map("plan_json")
  reasonCode String   @map("reason_code")
  active     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("spiritual_plan_versions")
}
```

Also add `spiritualOnboardingDone` to Profile model:
```prisma
spiritualOnboardingDone Boolean @default(false) @map("spiritual_onboarding_done")
```

And add `spiritualOnboardingDone` to `UserProfile` interface in `apps/mobile/lib/user-store.ts`.

### 3.4 Local Store (`apps/mobile/lib/spiritual-store.ts`)

Mirrors `mental-store.ts` exactly. AsyncStorage key: `@aura/spiritual`.

**State structure:**
```typescript
interface SpiritualState {
  baseline?: SpiritualBaseline;
  checkIns?: SpiritualDailyCheckIn[];
  practiceSessions?: SpiritualPracticeSession[];
  journalEntries?: SpiritualJournalEntry[];
  weeklyReviews?: SpiritualWeeklyReview[];
  plan?: SpiritualWellnessPlan;
  contentProgress?: Record<string, number>;
}
```

**Functions to export (same pattern as mental-store):**

| Function | Purpose |
|----------|---------|
| `saveSpiritualBaseline(baseline)` | Store assessment results |
| `getSpiritualBaseline()` | Load baseline |
| `saveSpiritualCheckIn(checkIn)` | Store daily check-in (dedup by date, keep 30) |
| `getTodaySpiritualCheckIn()` | Get today's check-in |
| `getSpiritualCheckInHistory(days)` | Get last N days |
| `savePracticeSession(session)` | Log practice (keep 100) |
| `getPracticeSessions()` | Get all sessions |
| `saveSpiritualJournal(entry)` | Save journal entry (keep 200) |
| `getSpiritualJournals()` | Get all entries |
| `deleteSpiritualJournal(id)` | Remove entry |
| `saveSpiritualWeeklyReview(review)` | Store review (keep 12) |
| `getLatestSpiritualWeeklyReview()` | Get most recent |
| `saveSpiritualPlan(plan)` | Store active plan |
| `getCurrentSpiritualPlan()` | Get active plan |
| `saveSpiritualContentProgress(moduleId, percent)` | Track learning |
| `getSpiritualContentProgress()` | Get progress map |

### 3.5 API Routes (`apps/web/app/api/spiritual/`)

Mirror the mental API pattern exactly:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/spiritual/baseline` | POST, GET | Save/retrieve assessment |
| `/api/spiritual/checkin` | POST | Submit daily check-in |
| `/api/spiritual/checkin/history` | GET | Fetch check-in history |
| `/api/spiritual/practice` | POST | Log practice session |
| `/api/spiritual/practice/history` | GET | Fetch practice history |
| `/api/spiritual/journal` | POST, GET | Save/fetch journal entries |
| `/api/spiritual/weekly-review` | POST, GET | Save/fetch weekly review |
| `/api/spiritual/plan` | GET | Fetch current wellness plan |
| `/api/spiritual/score` | GET | Fetch composite score |
| `/api/spiritual/content` | GET | Fetch content library |
| `/api/spiritual/content/progress` | POST | Update content progress |

All routes: auth-protected via `resolveAuthContext()`, Prisma-backed, proper error responses.

---

## 4. Phase 2 — Onboarding Assessment

### Screen: `apps/mobile/app/spiritual/onboarding.tsx`

**8 steps total:**

| Step | Content | Questions |
|------|---------|-----------|
| 0 | Welcome — "Let's understand your inner balance" | Info card: what we'll cover |
| 1 | Meaning & Purpose (5 questions, 0-4 Likert) | "I feel my life has a clear purpose", etc. |
| 2 | Inner Peace & Emotional Settling (5 questions) | "I feel calm inside most days", etc. |
| 3 | Mindful Presence (5 questions, 1 reverse-scored) | "I notice what I am feeling...", etc. |
| 4 | Connection (5 questions) | "I feel connected to people...", etc. |
| 5 | Daily Practices (4 questions) | "I regularly practice meditation...", etc. |
| 6 | Preferences — practice time, support style, live session interests | Not scored, used by plan engine |
| 7 | Summary — shows 5 domain scores, composite, generated plan | CTA: "Go to Inner Calm Hub" |

**Scoring flow:**
1. Collect all 24 answers (0-4 each)
2. Call `buildSpiritualBaseline(rawAnswers, preferences)` from engine
3. Call `generateInitialPlan(baseline)` from engine
4. Save locally via `saveSpiritualBaseline()` + `saveSpiritualPlan()`
5. Update unified profile: `updateProfile({ spiritualOnboardingDone: true, scoreSpiritual: baseline.totalScore })`
6. Sync to API (fire & forget)

**UI pattern:** Match mental onboarding exactly — progress dots, back button, purple theme replaced with teal `#30B0C7` (spiritual pillar color).

**Answer UI per question:** Vertical list of 5 radio-style options (Never / Rarely / Sometimes / Often / Always) with teal highlight — same as mental's Likert scale but with spiritual color.

---

## 5. Phase 3 — Hub + Daily Check-in

### 5.1 Hub Screen: `apps/mobile/app/spiritual/hub.tsx`

**Layout (matches mental hub pattern):**

```
[Back button]                    [Lock icon: Private]

Good morning                     ← greeting
Tuesday, April 1                 ← date

How are you feeling right now?

┌─────────────────────────────┐
│  Start 5-min Reset          │  ← Primary CTA (breathwork timer)
│  Quick calm practice        │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Inner Calm Score Ring      │  ← SpiritualScoreRing component
│       67 / 100              │
│  (with previous score delta)│
└─────────────────────────────┘

┌──────────┐  ┌──────────┐
│ Meaning  │  │  Peace   │  ← 5 domain sub-score cards (2x3 grid)
│   72     │  │   58     │
└──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│Mindful   │  │Connection│
│   65     │  │   70     │
└──────────┘  └──────────┘
┌──────────┐
│ Practice │
│   45     │
└──────────┘

[AI Coach Card — contextual message based on band]

Quick Actions:
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Daily    │ │ Journal  │ │ Get Help │
│ Check-in │ │ & Grat.  │ │          │
└──────────┘ └──────────┘ └──────────┘

Quick Tiles:
┌────────┐ ┌────────┐ ┌────────┐
│Meditate│ │Breathe │ │Gratitude│
└────────┘ └────────┘ └────────┘
┌────────┐ ┌────────┐ ┌────────┐
│Reflect │ │Sound-  │ │Nature  │
│        │ │scape   │ │Break   │
└────────┘ └────────┘ └────────┘

[Your Wellness Plan card — if plan exists]

Footer:
┌──────────┐ ┌──────────┐
│ Weekly   │ │ Insights │
│ Review   │ │          │
└──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│ Learn    │ │ Community│
└──────────┘ └──────────┘

[Redo Inner Calm Assessment — link]
```

**Data loading (useFocusEffect):**
1. Read `scoreSpiritual` from unified profile (single source of truth)
2. Load baseline (for domain sub-scores)
3. Load latest check-in (for metric cards)
4. Load current plan (for plan summary card)
5. Generate coach message from engine

### 5.2 Daily Check-in: `apps/mobile/app/spiritual/checkin.tsx`

**Must complete in < 30 seconds** (acceptance criteria).

**UI flow:**
1. **Calm slider** (0-10) — large, easy to drag
2. **Feeling chips** — multi-select: peaceful, distracted, heavy, grateful, restless, inspired
3. **Quick yes/no questions:**
   - Did you pause for quiet, breath, prayer, or meditation today?
   - Did you feel connected to yourself or others today? (Yes / A little / No)
   - Did time in nature, silence, or reflection help today? (Yes / A little / No)
4. **Blocker selector** — what blocked your calm? (multi-select chips)
5. **CTA:** "Save Check-in"

**Scoring judgment (from PRD):**
- 0-2 calm = red indicator
- 3-4 = orange
- 5-6 = yellow
- 7-10 = green

**Post-save:** Save locally + sync API. If trend shows worsening → show coach message.

---

## 6. Phase 4 — Practice Library

### 6.1 Meditation / Breathwork Library: `apps/mobile/app/spiritual/library.tsx`

**Categories:** sleep, stress release, focus, gratitude, anxiety relief, self-compassion, chakra, silent sitting

**Content card fields:**
- Title, duration, teacher/source, difficulty, free/premium badge
- Category tag, mood tag

**Content sourcing** (from PRD Section 2 of SPIRITUAL 1):
- Store `content_assets` with: id, title, asset_type, source_name, source_url, license_type, commercial_use_allowed, attribution_required, status
- Only publish verified licensed content
- Sources: YouTube Audio Library, Pixabay, Mixkit, FreePD, Freesound (CC0/commercial-safe only)

**Initial implementation:** Hardcoded seed content (like mental learning modules) with structure ready for API-sourced content later.

### 6.2 Breathwork Timer: `apps/mobile/app/spiritual/breathwork.tsx`

**Reuse mental calm-toolkit breathwork pattern:**
- Breathing pattern selector (4-7-8, box breathing, calm breath)
- Animated circle that expands/contracts with timing
- Duration selector (1, 3, 5, 10 min)
- Completion logging as `SpiritualPracticeSession`

### 6.3 Soundscape Player: `apps/mobile/app/spiritual/soundscape.tsx`

**UI (from PRD Section 7.5):**
- Calming visual background
- Title, duration, license badge, mood tag
- Controls: play/pause, loop, timer, volume, favorite
- Suggested usage tags: pre-sleep, deep work, stress reset, recovery

**Initial implementation:** Local placeholder audio references. Full audio streaming is Phase 2 scope.

### 6.4 Meditation Timer: `apps/mobile/app/spiritual/meditation.tsx`

- Duration selector (1, 3, 5, 10, 15, 20 min)
- Optional background soundscape
- Progress ring
- Bell at start/end
- Logs as `SpiritualPracticeSession` with type "meditation" or "silent_sitting"

---

## 7. Phase 5 — Journal / Gratitude / Reflection

### Screen: `apps/mobile/app/spiritual/journal.tsx` + `journal-entry.tsx`

**Mirror mental journal pattern with spiritual-specific prompts.**

**Journal hub (`journal.tsx`):**
- Weekly summary (entries this week, gratitude count)
- Filter by type: All / Gratitude / Reflection / Free
- Entry list (newest first)
- FAB for new entry

**Entry editor (`journal-entry.tsx`):**
- Prompt type selector: Free writing / Gratitude / Reflection
- Mood tag row (feeling chips)
- **Gratitude field** — "What are you grateful for today?"
- **Reflection questions:**
  - What brought calm today?
  - What triggered discomfort?
  - What helped?
- CTA: "Save Reflection"

**Storage:** Local via `saveSpiritualJournal()` + sync to `/api/spiritual/journal`.

---

## 8. Phase 6 — Weekly Progress + Insights

### 8.1 Weekly Review: `apps/mobile/app/spiritual/weekly-review.tsx`

**Questions (from PRD Section 5):**
1. How often did you feel calm this week? (Never/Rarely/Sometimes/Often/Very often)
2. How often did you feel present rather than on autopilot?
3. How often did your practices help you recover from stress?
4. How often did you feel gratitude or appreciation?
5. How often did you feel connected to others or to something larger?
6. What helped most this week? (practice type chips)
7. What hurt your calm most this week? (blocker chips)
8. Do you want the app to increase, keep, or reduce the intensity? (3 buttons)

**Post-submit:**
- Compute score change
- Generate new plan if needed (via engine)
- Show insights card
- Sync to API

### 8.2 Insights: `apps/mobile/app/spiritual/insights.tsx`

**Same pattern as mental insights:**
- Time window selector (7 or 30 days)
- Calm score trend sparkline
- Practice minutes chart
- Domain breakdown cards
- Streak tracker
- AI insight: "What improved your calm most this week"

---

## 9. Phase 7 — Live Sessions Hub (Placeholder)

### Screen: `apps/mobile/app/spiritual/live-sessions.tsx`

**Phase 1 implementation:** Coming soon placeholder with:
- Description of what's coming (free live community sessions, premium expert sessions)
- "Notify me" opt-in button
- Hardcoded example session cards showing the future UI

**Full implementation (Phase 2 launch) requires:**
- Live event booking flow
- Payment integration
- Calendar integration
- Replay access
- Host management
- This is out of scope for Phase 1 but the screen structure and navigation should exist.

---

## 10. Phase 8 — Dashboard Integration + Polish

### 10.1 Dashboard Routing

Update `apps/mobile/app/(tabs)/dashboard.tsx` segment press handler:

```typescript
} else if (pillar.key === "spiritual") {
  if (spiritualDone) {
    router.push("/spiritual/hub");
  } else {
    router.push("/spiritual/onboarding");
  }
}
```

Read `spiritualOnboardingDone` from unified profile alongside `mentalDone` and `physicalDone`.

Add CTA card on dashboard (same pattern as mental/physical):
```
┌─────────────────────────────────────┐
│ 🧘 Complete Inner Calm Assessment   │
│ Unlock meditation, breathwork & more│
└─────────────────────────────────────┘
```

### 10.2 Layout

Create `apps/mobile/app/spiritual/_layout.tsx`:
```typescript
import { Stack } from "expo-router";
export default function SpiritualLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
```

### 10.3 UserProfile Extension

Add to `UserProfile` in `apps/mobile/lib/user-store.ts`:
```typescript
spiritualOnboardingDone: boolean;
```

Update all places that create default profiles to include `spiritualOnboardingDone: false`.

### 10.4 Shared Components

Create reusable components under `apps/mobile/components/spiritual/`:

| Component | Purpose | Reuse from |
|-----------|---------|------------|
| `SpiritualScoreRing.tsx` | Donut score ring (teal theme) | Adapt `MentalScoreRing` |
| `DomainCard.tsx` | Sub-score card with icon + label | New |
| `CalmSlider.tsx` | 0-10 slider for check-in | Adapt `MoodSlider` |
| `PracticeTimer.tsx` | Circular timer for meditation/breathwork | Adapt calm-toolkit timer |
| `CoachCard.tsx` | AI coach message display | New |

---

## 11. File Creation Summary

### New files to create:

```
# Types
packages/types/src/spiritual.ts

# Engine (8 files)
packages/engines/spiritual-engine/package.json
packages/engines/spiritual-engine/tsconfig.json
packages/engines/spiritual-engine/src/index.ts
packages/engines/spiritual-engine/src/questions.ts
packages/engines/spiritual-engine/src/baseline.ts
packages/engines/spiritual-engine/src/scoring.ts
packages/engines/spiritual-engine/src/plan-generator.ts
packages/engines/spiritual-engine/src/checkin-analyzer.ts
packages/engines/spiritual-engine/src/weekly-reviewer.ts
packages/engines/spiritual-engine/src/coach.ts
packages/engines/spiritual-engine/src/alert-engine.ts

# Local store
apps/mobile/lib/spiritual-store.ts

# API routes (11 route files)
apps/web/app/api/spiritual/baseline/route.ts
apps/web/app/api/spiritual/checkin/route.ts
apps/web/app/api/spiritual/checkin/history/route.ts
apps/web/app/api/spiritual/practice/route.ts
apps/web/app/api/spiritual/practice/history/route.ts
apps/web/app/api/spiritual/journal/route.ts
apps/web/app/api/spiritual/weekly-review/route.ts
apps/web/app/api/spiritual/plan/route.ts
apps/web/app/api/spiritual/score/route.ts
apps/web/app/api/spiritual/content/route.ts
apps/web/app/api/spiritual/content/progress/route.ts

# Mobile screens (14 files)
apps/mobile/app/spiritual/_layout.tsx
apps/mobile/app/spiritual/onboarding.tsx
apps/mobile/app/spiritual/hub.tsx
apps/mobile/app/spiritual/checkin.tsx
apps/mobile/app/spiritual/library.tsx
apps/mobile/app/spiritual/breathwork.tsx
apps/mobile/app/spiritual/meditation.tsx
apps/mobile/app/spiritual/soundscape.tsx
apps/mobile/app/spiritual/journal.tsx
apps/mobile/app/spiritual/journal-entry.tsx
apps/mobile/app/spiritual/weekly-review.tsx
apps/mobile/app/spiritual/insights.tsx
apps/mobile/app/spiritual/live-sessions.tsx
apps/mobile/app/spiritual/community.tsx

# Shared components (5 files)
apps/mobile/components/spiritual/SpiritualScoreRing.tsx
apps/mobile/components/spiritual/DomainCard.tsx
apps/mobile/components/spiritual/CalmSlider.tsx
apps/mobile/components/spiritual/PracticeTimer.tsx
apps/mobile/components/spiritual/CoachCard.tsx
```

### Files to modify:

```
packages/types/src/index.ts              — export spiritual types
packages/db/prisma/schema.prisma         — add 6 spiritual models + spiritualOnboardingDone
apps/mobile/lib/user-store.ts            — add spiritualOnboardingDone to UserProfile
apps/mobile/app/(tabs)/dashboard.tsx     — route spiritual segment, add CTA card, read spiritualDone
apps/mobile/app/onboarding/questionnaire.tsx — (optional) simplify spiritual questions since full assessment lives in section
apps/web/app/api/profile/route.ts        — handle spiritualOnboardingDone field
```

**Total: ~45 new files, ~6 modified files.**

---

## 12. Color Theme

All spiritual screens use the pillar color **`#30B0C7` (teal)** as the accent, replacing:
- Mental's `#AF52DE` (purple)
- Physical's `#007AFF` (blue)

Highlight variations:
- Active state: `#30B0C7`
- Background tint: `#30B0C710` or `#30B0C715`
- Border highlight: `#30B0C740`
- Text on white: `#30B0C7`

---

## 13. Implementation Order (recommended)

| Step | Task | Depends on |
|------|------|------------|
| 1 | Define types in `packages/types/src/spiritual.ts` | Nothing |
| 2 | Build scoring engine (`baseline.ts`, `scoring.ts`, `questions.ts`) | Step 1 |
| 3 | Build plan generator + coach (`plan-generator.ts`, `coach.ts`) | Step 2 |
| 4 | Build check-in analyzer + weekly reviewer + alert engine | Step 2 |
| 5 | Extend Prisma schema + run `prisma db push` | Step 1 |
| 6 | Build local store (`spiritual-store.ts`) | Step 1 |
| 7 | Build API routes | Steps 5, 6 |
| 8 | Build `_layout.tsx` + onboarding screen | Steps 2, 3, 6 |
| 9 | Build hub screen + shared components | Steps 2, 6 |
| 10 | Build daily check-in screen | Steps 4, 6 |
| 11 | Build practice screens (breathwork, meditation, soundscape) | Step 6 |
| 12 | Build journal / gratitude screens | Step 6 |
| 13 | Build library screen | Step 6 |
| 14 | Build weekly review + insights screens | Steps 4, 6 |
| 15 | Build community + live sessions (placeholder) | Step 6 |
| 16 | Integrate dashboard routing + CTA card | Step 9 |
| 17 | Add `spiritualOnboardingDone` to user-store + profile API | Step 5 |
| 18 | End-to-end testing | All |

Steps 1-4 can be done in parallel with steps 5-6.
Steps 8-15 can be partially parallelized.

---

## 14. Acceptance Criteria (from PRDs)

- [ ] User completes onboarding and receives a first inner calm plan (< 5 minutes)
- [ ] Daily check-in completes in under 30 seconds
- [ ] App correctly computes 5 sub-scores and overall calm score (0-100)
- [ ] Reverse-scored items (mindfulness Q3) handled correctly
- [ ] Score bands map to Green/Yellow/Orange/Red correctly
- [ ] Adaptive plan changes based on weakest domain and recent trends
- [ ] AI coach returns short response matched to score band
- [ ] Any safety signal overrides normal coaching and opens human support
- [ ] Journal entries are saved and reflected in weekly insights
- [ ] Weekly and monthly reviews update the plan automatically
- [ ] Free users access at least one daily practice and basic features
- [ ] Premium content is clearly labeled (not blocking free experience)
- [ ] All spiritual scores consistent across dashboard, hub, and profile screens
- [ ] All data syncs to API (offline-first, local save always works)
