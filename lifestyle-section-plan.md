# Lifestyle / Daily Wellness Section — Implementation Plan

> Based on: Lifestyle_Daily_Questionnaire_Engine_PRD.pdf (scoring/questions/AI coach) and Lifestyle_Section_PRD.pdf (screens/DB/free-premium split)

---

## 1. Current State

The lifestyle pillar is **partially implemented** — onboarding data collection and a simple 4-factor score exist, but no dedicated section screens, no daily/weekly logging, no adaptive plan, and no lifestyle engine.

**What exists today:**
- `apps/mobile/app/onboarding/questionnaire.tsx` — collects: sleep hours, alcohol frequency, tobacco use, screen time
- `apps/mobile/lib/pillar-scoring.ts` → `scoreLifestyle()` — simple 4-factor weighted score (sleep 35%, alcohol 25%, tobacco 25%, screen 15%)
- `apps/mobile/lib/user-store.ts` → `UserProfile.scoreLifestyle` — stored and displayed on dashboard
- Dashboard lifestyle segment tap → "coming soon" alert
- DB schema: `sleepHours`, `alcoholFrequency`, `tobacco`, `screenHours` on Profile model
- No `lifestyleOnboardingDone` flag exists

**What's missing (per the PRDs):**
- Full 28-question onboarding across 7 domains (vs current 4 questions)
- 6-domain scoring engine: Sleep 30%, Nutrition 25%, Hydration 15%, Movement 15%, Digital 10%, Nature/Routine 5%
- Daily check-in (8 questions, < 60 seconds)
- Weekly review (8 questions)
- Monthly review (7 questions)
- Adaptive plan engine with domain-specific rules
- AI coach logic by band (green/yellow/orange/red)
- Hub screen with Today dashboard, domain cards, quick logging
- Individual domain screens (sleep, food, hydration, movement, digital balance, nature)
- Weekly review + insights screens
- Local store + API routes
- Override rules (sleep collapse, digital overload → force downgrade)

---

## 2. Architecture Overview

Mirrors the mental/spiritual sections 1:1:

```
packages/types/src/lifestyle.ts              — Type definitions
packages/engines/lifestyle-engine/           — Pure scoring + plan logic
packages/db/prisma/schema.prisma             — DB models (extend)
apps/web/app/api/lifestyle/                  — API routes
apps/mobile/lib/lifestyle-store.ts           — Local AsyncStorage cache
apps/mobile/app/lifestyle/                   — All screens
apps/mobile/app/(tabs)/dashboard.tsx         — Route lifestyle segment tap
```

All data flows: **local-first (AsyncStorage) + async API sync**.

---

## 3. Implementation Phases

### Phase 1 — Foundation (types, engine, store)
### Phase 2 — Full Onboarding Assessment (28 questions, 7 domains)
### Phase 3 — Hub / Today Dashboard
### Phase 4 — Daily Check-in + Quick Logging
### Phase 5 — Domain Detail Screens (sleep, food, hydration, movement, digital, nature)
### Phase 6 — Weekly Review + Insights
### Phase 7 — Dashboard Integration + Polish

---

## 4. Phase 1 — Foundation

### 4.1 Types (`packages/types/src/lifestyle.ts`)

Export from `packages/types/src/index.ts`.

```typescript
// ── Domain identifiers ──
export type LifestyleDomain = "sleep" | "nutrition" | "hydration" | "movement" | "digital" | "nature_routine";

// ── Score band ──
export type LifestyleBand = "green" | "yellow" | "orange" | "red";

// ── Score weights (from PRD) ──
export const LIFESTYLE_SCORE_WEIGHTS = {
  sleep: 0.30,
  nutrition: 0.25,
  hydration: 0.15,
  movement: 0.15,
  digital: 0.10,
  nature_routine: 0.05,
} as const;

// ── Blocker tags for daily check-in ──
export const LIFESTYLE_BLOCKER_TAGS = [
  "work", "travel", "stress", "social", "fatigue", "other",
] as const;
export type LifestyleBlockerTag = (typeof LIFESTYLE_BLOCKER_TAGS)[number];

// ── Routine types ──
export type RoutineType = "morning" | "afternoon" | "evening";

// ── Drink types ──
export const DRINK_TYPES = [
  "water", "tea", "coffee", "juice", "electrolyte", "other",
] as const;
export type DrinkType = (typeof DRINK_TYPES)[number];

// ── Movement break types ──
export const MOVEMENT_BREAK_TYPES = [
  "walk", "stretch", "stand", "stairs", "micro_activity",
] as const;
export type MovementBreakType = (typeof MOVEMENT_BREAK_TYPES)[number];

// ── Onboarding question definition ──
export interface LifestyleQuestion {
  id: string;
  domain: LifestyleDomain;
  text: string;
  options: { label: string; value: number }[];
  reverseScored: boolean;
}

// ── Baseline (output of onboarding assessment) ──
export interface LifestyleBaseline {
  sleepScore: number;           // 0-100
  nutritionScore: number;       // 0-100
  hydrationScore: number;       // 0-100
  movementScore: number;        // 0-100
  digitalScore: number;         // 0-100
  natureRoutineScore: number;   // 0-100
  totalScore: number;           // 0-100 weighted composite
  band: LifestyleBand;
  weakestDomain: LifestyleDomain;
  rawAnswers: number[];         // all 28 answers
  createdAt: string;
}

// ── Daily check-in ──
export interface LifestyleDailyCheckIn {
  id: string;
  date: string;                        // ISO date
  sleepHours: number;                  // actual hours
  sleepQuality: number;                // 0-10
  fruitVegServings: number;            // count
  waterMl: number;                     // milliliters
  screenHoursNonWork: number;          // hours
  gotOutdoors: boolean;
  routineCompletion: "yes" | "partly" | "no";
  blockers: LifestyleBlockerTag[];
  createdAt: string;
}

// ── Weekly review ──
export interface LifestyleWeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  goodSleepDays: number;               // 0-7
  hydrationTargetDays: number;         // 0-7
  mealLogDays: number;                 // 0-7
  movementDays: number;                // 0-7
  screenInterferenceDays: number;      // 0-7 (bad = higher)
  outdoorDays: number;                 // 0-7
  helpedMostHabit: string | null;
  blockedMostHabit: string | null;
  scoreChange: number;
  createdAt: string;
}

// ── Monthly review ──
export interface LifestyleMonthlyReview {
  id: string;
  month: string;                       // YYYY-MM
  sleepImproved: boolean;
  mealQualityImproved: boolean;
  hydrationImproved: boolean;
  movementImproved: boolean;
  screenBalanceImproved: boolean;
  routineImproved: boolean;
  planPreference: "simpler" | "same" | "advanced";
  createdAt: string;
}

// ── Lifestyle profile / goals ──
export interface LifestyleProfile {
  sleepGoalHours: number;              // target sleep hours
  waterGoalMl: number;                 // daily water target
  movementGoalSteps: number;           // daily steps target
  screenLimitMinutes: number;          // max screen time
  preferredRoutineTime: RoutineType;
  dietStyle: string | null;
}

// ── Adaptive plan ──
export interface LifestyleWellnessPlan {
  dailyAnchorHabit: string;
  recoveryHabit: string;
  weeklyGoal: string;
  trendInsight: string;
  bestNextAction: string;
  followUpTime: string;                // "morning" | "evening" | ISO time
  expertRecommendation: string | null; // premium
  focusDomain: LifestyleDomain;
  band: LifestyleBand;
  createdAt: string;
}

// ── AI coach message ──
export interface LifestyleCoachMessage {
  text: string;
  band: LifestyleBand;
  weakDomain: LifestyleDomain;
  suggestedAction: string | null;
}

// ── Score run (for history) ──
export interface LifestyleScoreRun {
  sleepScore: number;
  nutritionScore: number;
  hydrationScore: number;
  movementScore: number;
  digitalScore: number;
  natureRoutineScore: number;
  totalScore: number;
  band: LifestyleBand;
  createdAt: string;
}

// ── Logging types (for domain-specific tracking) ──

export interface SleepLog {
  id: string;
  date: string;
  bedtime: string;                     // HH:mm
  wakeTime: string;                    // HH:mm
  durationMinutes: number;
  qualityScore: number;                // 0-10
  latencyMinutes: number;              // time to fall asleep
  wakeups: number;
  notes: string | null;                // caffeine, alcohol, screens, stress
  createdAt: string;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  calories: number | null;
  proteinG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  foodQualityFlag: "good" | "fair" | "poor";
  createdAt: string;
}

export interface HydrationLog {
  id: string;
  date: string;
  drinkType: DrinkType;
  volumeMl: number;
  caffeineFlag: boolean;
  createdAt: string;
}

export interface MovementLog {
  id: string;
  date: string;
  steps: number | null;
  activeMinutes: number;
  sedentaryMinutes: number | null;
  breakType: MovementBreakType | null;
  createdAt: string;
}

export interface DigitalBalanceLog {
  id: string;
  date: string;
  screenTimeMinutes: number;
  bedtimeScreenMinutes: number;
  notificationCount: number | null;
  focusSessionCount: number;
  createdAt: string;
}

export interface NatureLog {
  id: string;
  date: string;
  outdoorMinutes: number;
  lightMinutes: number;
  greenSpaceMinutes: number;
  moodAfterScore: number | null;       // 1-10
  createdAt: string;
}

export interface RoutineCompletion {
  id: string;
  date: string;
  routineType: RoutineType;
  habitName: string;
  completed: boolean;
  streakDay: number;
  createdAt: string;
}
```

### 4.2 Scoring Engine (`packages/engines/lifestyle-engine/`)

**Directory structure:**
```
packages/engines/lifestyle-engine/
  src/
    index.ts              — barrel exports
    questions.ts          — 28-question bank with domain + reverse-score flags
    baseline.ts           — onboarding scoring (6 domains → composite)
    scoring.ts            — composite scoring (baseline + daily + engagement)
    plan-generator.ts     — adaptive plan rules by domain/band
    checkin-analyzer.ts   — daily trend analysis
    weekly-reviewer.ts    — 7-day retrospective
    monthly-reviewer.ts   — 30-day retrospective
    coach.ts              — AI coach response templates by band
  package.json
  tsconfig.json
```

**4.2.1 Question Bank (`questions.ts`)**

All 28 questions from the PRD, organized by domain:

| Domain | # Questions | Reverse-Scored Items |
|--------|-------------|----------------------|
| Sleep & Recovery | 5 | Q4 (screens before bed), Q5 (caffeine/alcohol affect sleep) |
| Nutrition & Meal Quality | 5 | Q4 (ultra-processed food), Q5 (emotional eating) |
| Hydration | 3 | Q3 (forget to drink) |
| Movement & Sedentary Balance | 4 | Q2 (time spent sitting) |
| Digital Balance | 4 | Q1 (screen time amount), Q2 (screen into bedtime), Q3 (notification interrupts) |
| Nature, Light, Recovery | 3 | None |
| Routine & Stability | 4 | None |

Each question scored 0-3 (4 options, mapped healthiest→3, weakest→0).
Reverse-scored items: invert so healthiest=3, weakest=0.

**Note:** The PRD says "map healthiest to 4 and weakest to 0" but questions have only 4 options (0-3 range). We use 0-3 consistently and normalize to 0-100 per domain.

**4.2.2 Baseline Scoring (`baseline.ts`)**

```
Per domain:
  1. Apply reverse-scoring where flagged
  2. Average all items in domain (0-3 range)
  3. Normalize to 0-100: (average / 3) * 100

Composite score (from PRD Section 2/7):
  totalScore = sleep * 0.30 + nutrition * 0.25 + hydration * 0.15
             + movement * 0.15 + digital * 0.10 + nature_routine * 0.05

Band classification:
  80-100 → green  (strong lifestyle balance)
  60-79  → yellow (healthy, needs consistency)
  40-59  → orange (gaps present, increase support)
  0-39   → red    (significant imbalance, reset plan)

Override rules (from PRD):
  - Sleep score < 30 AND digital score < 40 → force orange or red
  - Repeated erratic nutrition (3+ days below threshold) → force orange
  - Digital overload repeatedly damaging recovery → force plan downgrade
```

Export functions:
- `computeDomainScore(answers: number[], reverseIndices: number[]): number`
- `computeLifestyleScore(domainScores): { totalScore, band, weakestDomain }`
- `buildLifestyleBaseline(rawAnswers): LifestyleBaseline`
- `classifyBand(score: number): LifestyleBand`

**4.2.3 Composite Scoring (`scoring.ts`)**

For ongoing score updates (not just onboarding):

```
Composite = baseline_component * 0.35
           + daily_component * 0.30
           + engagement_component * 0.20
           + consistency_component * 0.15

Where:
  baseline_component  = most recent LifestyleBaseline.totalScore
  daily_component     = weighted average of last 7 daily check-ins mapped to 0-100:
    - sleepHours (7+ = 100, 6 = 70, 5 = 40, <5 = 20)
    - sleepQuality (0-10 → 0-100)
    - fruitVegServings (4+ = 100, 2-3 = 70, 0-1 = 30)
    - waterMl (target+ = 100, 75% = 70, 50% = 40, <50% = 20)
    - screenHoursNonWork inverted (<2 = 100, 2-4 = 80, 4-6 = 50, 6+ = 20)
    - gotOutdoors (yes = 100, no = 0)
    - routineCompletion (yes = 100, partly = 50, no = 0)
  engagement_component = weighted sum of:
    - check-in streak (7/7 = 100)
    - log entries this week (sleep/meal/hydration logs)
    - routine completions this week
  consistency_component = habit streak days (7+ = 100)
```

Export:
- `computeLifestyleWellnessScore(baseline, checkIns, logs): LifestyleScoreRun`

**4.2.4 Adaptive Plan Generator (`plan-generator.ts`)**

Rules by domain weakness (from PRD Section 8):

| Weak Domain | Daily Anchor Habit | Recovery Habit | Next Best Action |
|-------------|-------------------|----------------|------------------|
| **Sleep** | Set consistent bedtime alarm | No screens 30min before bed | Caffeine cut-off by 2PM |
| **Nutrition** | Log one meal at each slot | Replace one ultra-processed snack | Add 1 fruit/veg serving |
| **Hydration** | Set hourly water reminder | Drink water before each meal | Track cups on home screen |
| **Movement** | 10-minute walk after lunch | 3-minute stretch break every 2h | Take stairs today |
| **Digital** | Enable digital sunset at 9PM | Phone-free morning first 30min | Use focus mode during work |
| **Nature/Routine** | 5-minute outdoor break | Complete morning routine before phone | Walk in nature for 15min |

Routing by band:
- **Green**: maintain habits, offer advanced tracking, praise consistency
- **Yellow**: recommend one focused habit fix + keep routine simple
- **Orange**: reduce complexity, simplify plan, focus on weakest domain only
- **Red**: stop normal flow, reduce all goals to minimum, recommend reset week

Export:
- `generateLifestylePlan(baseline, checkIns, logs): LifestyleWellnessPlan`
- `generateInitialPlan(baseline): LifestyleWellnessPlan`

**4.2.5 AI Coach (`coach.ts`)**

Response templates by band (from PRD Section 9):

```
Green:  "You are on track. Keep the routine that is working."
Yellow: "One habit is slipping. Let's keep it small and fix that first."
Orange: "Your recovery pattern needs support. I recommend a simpler plan for the next 7 days."
Red:    "Your routine is showing a strong strain. Let's reduce load and reset the plan now."
```

Rules:
- One clear recommendation per response
- No judgmental language
- Always reference the user's current weak domain
- If daily behavior suggests repeated risk → recommend plan reduction

Export:
- `generateCoachMessage(band, weakestDomain, recentTrend): LifestyleCoachMessage`

**4.2.6 Check-in Analyzer (`checkin-analyzer.ts`)**

Daily judgement criteria (from PRD Section 4):
- Sleep < 7h = yellow; < 6h = orange; < 5h repeatedly = red
- Meal imbalance or missing meals = yellow/orange depending on repetition
- Hydration below target = yellow; repeated low = orange
- High screen time after bedtime = yellow/orange; repeated = plan change
- No nature or no routine for several days = yellow

Export:
- `analyzeLifestyleCheckIns(checkIns, days): TrendData`
- `detectDailyAlerts(checkIn, recentHistory): Alert[]`

**4.2.7 Weekly Reviewer (`weekly-reviewer.ts`)**

Weekly judgement criteria (from PRD Section 5):
- 3 or fewer good-sleep days = orange
- Low hydration on 3+ days = yellow/orange
- High screen interference + poor sleep = orange
- No progress in movement or routine = yellow
- Repeated over-eating or irregular meals = yellow/orange

Export:
- `generateLifestyleWeeklyReview(checkIns, logs): LifestyleWeeklyReview`
- `shouldChangePlan(review, currentPlan): boolean`

**4.2.8 Monthly Reviewer (`monthly-reviewer.ts`)**

Monthly judgement criteria (from PRD Section 6):
- Improvement in 3+ domains = plan is working
- Decline in sleep or screen balance = plan must change
- No improvement after 30 days = switch to more guided routine

Export:
- `generateMonthlyReview(checkIns, reviews): LifestyleMonthlyReview`
- `shouldEscalatePlan(review): boolean`

### 4.3 Database Schema Extension

Add to `packages/db/prisma/schema.prisma`:

```prisma
model LifestyleBaseline {
  id                   String   @id @default(cuid())
  userId               String   @map("user_id")
  user                 User     @relation(fields: [userId], references: [id])
  sleepScore           Int      @map("sleep_score")
  nutritionScore       Int      @map("nutrition_score")
  hydrationScore       Int      @map("hydration_score")
  movementScore        Int      @map("movement_score")
  digitalScore         Int      @map("digital_score")
  natureRoutineScore   Int      @map("nature_routine_score")
  totalScore           Int      @map("total_score")
  band                 String
  weakestDomain        String   @map("weakest_domain")
  rawAnswers           Json     @map("raw_answers")
  createdAt            DateTime @default(now()) @map("created_at")

  @@map("lifestyle_baselines")
}

model LifestyleCheckin {
  id                   String   @id @default(cuid())
  userId               String   @map("user_id")
  user                 User     @relation(fields: [userId], references: [id])
  date                 String
  sleepHours           Float    @map("sleep_hours")
  sleepQuality         Int      @map("sleep_quality")
  fruitVegServings     Int      @map("fruit_veg_servings")
  waterMl              Int      @map("water_ml")
  screenHoursNonWork   Float    @map("screen_hours_non_work")
  gotOutdoors          Boolean  @map("got_outdoors")
  routineCompletion    String   @map("routine_completion")
  blockers             Json     @default("[]")
  createdAt            DateTime @default(now()) @map("created_at")

  @@unique([userId, date])
  @@map("lifestyle_checkins")
}

model LifestyleSleepLog {
  id                String   @id @default(cuid())
  userId            String   @map("user_id")
  user              User     @relation(fields: [userId], references: [id])
  date              String
  bedtime           String
  wakeTime          String   @map("wake_time")
  durationMinutes   Int      @map("duration_minutes")
  qualityScore      Int      @map("quality_score")
  latencyMinutes    Int      @map("latency_minutes")
  wakeups           Int
  notes             String?
  createdAt         DateTime @default(now()) @map("created_at")

  @@map("lifestyle_sleep_logs")
}

model LifestyleMealLog {
  id               String   @id @default(cuid())
  userId           String   @map("user_id")
  user             User     @relation(fields: [userId], references: [id])
  date             String
  mealType         String   @map("meal_type")
  description      String
  calories         Int?
  proteinG         Float?   @map("protein_g")
  fiberG           Float?   @map("fiber_g")
  sugarG           Float?   @map("sugar_g")
  foodQualityFlag  String   @map("food_quality_flag")
  createdAt        DateTime @default(now()) @map("created_at")

  @@map("lifestyle_meal_logs")
}

model LifestyleHydrationLog {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  user          User     @relation(fields: [userId], references: [id])
  date          String
  drinkType     String   @map("drink_type")
  volumeMl      Int      @map("volume_ml")
  caffeineFlag  Boolean  @map("caffeine_flag")
  createdAt     DateTime @default(now()) @map("created_at")

  @@map("lifestyle_hydration_logs")
}

model LifestyleMovementLog {
  id                String   @id @default(cuid())
  userId            String   @map("user_id")
  user              User     @relation(fields: [userId], references: [id])
  date              String
  steps             Int?
  activeMinutes     Int      @map("active_minutes")
  sedentaryMinutes  Int?     @map("sedentary_minutes")
  breakType         String?  @map("break_type")
  createdAt         DateTime @default(now()) @map("created_at")

  @@map("lifestyle_movement_logs")
}

model LifestyleDigitalLog {
  id                    String   @id @default(cuid())
  userId                String   @map("user_id")
  user                  User     @relation(fields: [userId], references: [id])
  date                  String
  screenTimeMinutes     Int      @map("screen_time_minutes")
  bedtimeScreenMinutes  Int      @map("bedtime_screen_minutes")
  notificationCount     Int?     @map("notification_count")
  focusSessionCount     Int      @map("focus_session_count")
  createdAt             DateTime @default(now()) @map("created_at")

  @@map("lifestyle_digital_logs")
}

model LifestyleNatureLog {
  id                String   @id @default(cuid())
  userId            String   @map("user_id")
  user              User     @relation(fields: [userId], references: [id])
  date              String
  outdoorMinutes    Int      @map("outdoor_minutes")
  lightMinutes      Int      @map("light_minutes")
  greenSpaceMinutes Int      @map("green_space_minutes")
  moodAfterScore    Int?     @map("mood_after_score")
  createdAt         DateTime @default(now()) @map("created_at")

  @@map("lifestyle_nature_logs")
}

model LifestyleRoutineCompletion {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id])
  date         String
  routineType  String   @map("routine_type")
  habitName    String   @map("habit_name")
  completed    Boolean
  streakDay    Int      @map("streak_day")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("lifestyle_routine_completions")
}

model LifestyleWeeklyReport {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  user            User     @relation(fields: [userId], references: [id])
  weekStart       String   @map("week_start")
  weekEnd         String   @map("week_end")
  scoreChange     Int      @map("score_change")
  reviewData      Json?    @map("review_data")
  nextActions     Json?    @map("next_actions")
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("lifestyle_weekly_reports")
}

model LifestylePlanVersion {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id])
  planJson   Json     @map("plan_json")
  reasonCode String   @map("reason_code")
  active     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("lifestyle_plan_versions")
}
```

Also add to Profile model:
```prisma
lifestyleOnboardingDone Boolean @default(false) @map("lifestyle_onboarding_done")
```

And add `lifestyleOnboardingDone` to `UserProfile` interface in `apps/mobile/lib/user-store.ts`.

### 4.4 Local Store (`apps/mobile/lib/lifestyle-store.ts`)

Mirrors `mental-store.ts` / `spiritual-store.ts`. AsyncStorage key: `@aura/lifestyle`.

**State structure:**
```typescript
interface LifestyleState {
  baseline?: LifestyleBaseline;
  profile?: LifestyleProfile;
  checkIns?: LifestyleDailyCheckIn[];
  weeklyReviews?: LifestyleWeeklyReview[];
  monthlyReviews?: LifestyleMonthlyReview[];
  plan?: LifestyleWellnessPlan;
  sleepLogs?: SleepLog[];
  mealLogs?: MealLog[];
  hydrationLogs?: HydrationLog[];
  movementLogs?: MovementLog[];
  digitalLogs?: DigitalBalanceLog[];
  natureLogs?: NatureLog[];
  routineCompletions?: RoutineCompletion[];
}
```

**Functions to export:**

| Function | Purpose |
|----------|---------|
| `saveLifestyleBaseline(baseline)` | Store assessment results |
| `getLifestyleBaseline()` | Load baseline |
| `saveLifestyleProfile(profile)` | Store goals/preferences |
| `getLifestyleProfile()` | Load goals |
| `saveLifestyleCheckIn(checkIn)` | Store daily check-in (dedup by date, keep 30) |
| `getTodayLifestyleCheckIn()` | Get today's check-in |
| `getLifestyleCheckInHistory(days)` | Get last N days |
| `saveLifestylePlan(plan)` | Store active plan |
| `getCurrentLifestylePlan()` | Get active plan |
| `saveSleepLog(log)` | Log sleep (keep 90) |
| `getSleepLogs(days)` | Get sleep history |
| `saveMealLog(log)` | Log meal (keep 200) |
| `getMealLogs(date)` | Get meals for a date |
| `saveHydrationLog(log)` | Log drink (keep 200) |
| `getHydrationLogs(date)` | Get hydration for a date |
| `getTodayHydrationTotal()` | Sum today's water ml |
| `saveMovementLog(log)` | Log movement (keep 90) |
| `getMovementLogs(days)` | Get movement history |
| `saveDigitalLog(log)` | Log screen time (keep 90) |
| `saveNatureLog(log)` | Log outdoor time (keep 90) |
| `saveRoutineCompletion(entry)` | Log habit completion |
| `getRoutineCompletions(date)` | Get completions for a date |
| `saveWeeklyReview(review)` | Store review (keep 12) |
| `saveMonthlyReview(review)` | Store review (keep 12) |

### 4.5 API Routes (`apps/web/app/api/lifestyle/`)

Mirror the mental/spiritual API pattern:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/lifestyle/baseline` | POST, GET | Save/retrieve onboarding assessment |
| `/api/lifestyle/checkin` | POST | Submit daily check-in |
| `/api/lifestyle/checkin/history` | GET | Fetch check-in history |
| `/api/lifestyle/sleep` | POST, GET | Log/fetch sleep entries |
| `/api/lifestyle/meal` | POST, GET | Log/fetch meal entries |
| `/api/lifestyle/hydration` | POST, GET | Log/fetch hydration entries |
| `/api/lifestyle/movement` | POST, GET | Log/fetch movement entries |
| `/api/lifestyle/digital` | POST, GET | Log/fetch digital balance entries |
| `/api/lifestyle/nature` | POST, GET | Log/fetch nature entries |
| `/api/lifestyle/routine` | POST, GET | Log/fetch routine completions |
| `/api/lifestyle/weekly-review` | POST, GET | Save/fetch weekly review |
| `/api/lifestyle/plan` | GET | Fetch current wellness plan |
| `/api/lifestyle/score` | GET | Fetch composite score |

All routes: auth-protected via `resolveAuthContext()`, Prisma-backed.

### 4.6 Replace Existing Simple Scoring

The current `scoreLifestyle()` in `pillar-scoring.ts` uses only 4 factors (sleep, alcohol, tobacco, screen). After the full lifestyle engine is built:

1. **Onboarding questionnaire** (`apps/mobile/app/onboarding/questionnaire.tsx`): Keep existing 4 lifestyle questions as-is for the general onboarding. The full 28-question assessment lives in the dedicated lifestyle onboarding screen.
2. **`computePillarScores()`** continues to use the simple `scoreLifestyle()` for initial onboarding.
3. Once the user completes the full lifestyle assessment, `scoreLifestyle` in user-store is updated with the detailed engine score (same pattern as mental: simple at onboarding, upgraded after dedicated section assessment).

---

## 5. Phase 2 — Full Onboarding Assessment

### Screen: `apps/mobile/app/lifestyle/onboarding.tsx`

**9 steps total:**

| Step | Content | Questions |
|------|---------|-----------|
| 0 | Welcome — "Let's understand your daily habits" | Info card: sleep, food, water, movement, screen, nature, routine |
| 1 | Sleep & Recovery (5 questions, 0-3 scale) | Hours, consistency, quality, screens before bed, caffeine/alcohol |
| 2 | Nutrition & Meal Quality (5 questions) | Fruit/veg, meal logging, balance, ultra-processed, emotional eating |
| 3 | Hydration (3 questions) | Water intake, consistency, forgetting to drink |
| 4 | Movement & Sedentary Balance (4 questions) | Movement days, sitting time, breaks, strength/mobility |
| 5 | Digital Balance (4 questions) | Screen time, bedtime screen, notifications, focus mode |
| 6 | Nature, Light & Recovery (3 questions) | Outdoors, morning light, nature restoration |
| 7 | Routine & Stability (4 questions) | Morning routine, evening routine, habit ease, wake time consistency |
| 8 | Summary — shows 6 domain scores, composite, generated plan | CTA: "Go to Lifestyle Hub" |

**UI pattern:** Match mental/spiritual onboarding — progress dots, back button, orange theme `#FF9500`.

**Scoring flow:**
1. Collect all 28 answers (0-3 each)
2. Call `buildLifestyleBaseline(rawAnswers)` from engine
3. Call `generateInitialPlan(baseline)` from engine
4. Save locally via `saveLifestyleBaseline()` + `saveLifestylePlan()`
5. Update unified profile: `updateProfile({ lifestyleOnboardingDone: true, scoreLifestyle: baseline.totalScore })`
6. Sync to API (fire & forget)

---

## 6. Phase 3 — Hub / Today Dashboard

### Screen: `apps/mobile/app/lifestyle/hub.tsx`

**Layout (from PRD Section 5 "Today Dashboard"):**

```
[Back button]                    [Settings gear]

Today                            ← header
Tuesday, April 1                 ← date

┌─────────────────────────────┐
│  Lifestyle Score Ring       │  ← ScoreRing component (orange theme)
│       72 / 100              │
│  Band: Yellow               │
│  "One habit is slipping"    │  ← AI coach one-liner
└─────────────────────────────┘

┌────────┐ ┌────────┐ ┌────────┐
│ Sleep  │ │  Food  │ │ Water  │  ← 6 domain cards (2x3 grid)
│  68    │ │   75   │ │   82   │
└────────┘ └────────┘ └────────┘
┌────────┐ ┌────────┐ ┌────────┐
│Movement│ │Digital │ │Nature  │
│  60    │ │   55   │ │   70   │
└────────┘ └────────┘ └────────┘

Quick Log:
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│🥤 Water│ │🍎 Meal │ │😴 Sleep│ │🚶 Move │
└────────┘ └────────┘ └────────┘ └────────┘

[AI Coach Card — contextual message based on band + weakest domain]

[Best Next Action card — from plan engine]

Quick Actions:
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Daily    │ │ Weekly   │ │ Insights │
│ Check-in │ │ Review   │ │          │
└──────────┘ └──────────┘ └──────────┘

[Your Plan card — current plan summary]

Footer:
[Redo Lifestyle Assessment — link]
```

**Data loading (useFocusEffect):**
1. Read `scoreLifestyle` from unified profile
2. Load baseline (for domain sub-scores)
3. Load today's check-in
4. Load today's quick logs (hydration total, meals, sleep)
5. Load current plan
6. Generate coach message from engine

---

## 7. Phase 4 — Daily Check-in + Quick Logging

### 7.1 Daily Check-in: `apps/mobile/app/lifestyle/checkin.tsx`

**Must complete in < 60 seconds** (acceptance criteria).

**UI flow (from PRD Section 4):**
1. **Sleep hours** — number stepper (large, easy to tap)
2. **Sleep quality** — 0-10 slider
3. **Fruit/veg servings** — stepper (0-8)
4. **Water intake** — ml stepper or cup buttons
5. **Screen time (non-work)** — hours stepper
6. **Got outdoors?** — Yes / No toggle
7. **Routine completion** — Yes / Partly / No
8. **Blockers** — multi-select chips (work, travel, stress, social, fatigue, other)

**Post-save:** Save locally + sync API. Update lifestyle score.

### 7.2 Quick Log Screens

These are lightweight bottom-sheet or modal screens for one-tap logging:

- `apps/mobile/app/lifestyle/log-water.tsx` — One-tap cup buttons (250ml, 500ml, custom), drink type chips
- `apps/mobile/app/lifestyle/log-meal.tsx` — Meal type selector, description, quality flag
- `apps/mobile/app/lifestyle/log-sleep.tsx` — Bedtime + wake time pickers, quality slider, notes
- `apps/mobile/app/lifestyle/log-movement.tsx` — Break type chips, active minutes, steps

---

## 8. Phase 5 — Domain Detail Screens

### 8.1 Sleep Screen: `apps/mobile/app/lifestyle/sleep.tsx`
- Sleep score, duration trend (7-day sparkline), bedtime/wake time consistency
- Buttons: Start sleep diary, set bedtime reminder, start wind-down
- Sleep notes: caffeine, alcohol, screens, stress
- Recent sleep logs list
- Premium area: advanced sleep reports

### 8.2 Food Screen: `apps/mobile/app/lifestyle/food.tsx`
- Today calorie/meal summary (breakfast, lunch, dinner, snacks)
- Quick add button → log-meal
- Nutrition summary: fruit/veg count, quality flags
- Recent meal log list
- Premium area: meal planner link (routes to existing nutrition-plan)

### 8.3 Hydration Screen: `apps/mobile/app/lifestyle/hydration.tsx`
- Goal ring (current ml / target ml)
- One-tap log buttons: cup, bottle, tea, coffee
- Two-week history chart
- Reminder toggle
- Premium area: smart goal adjustment

### 8.4 Movement Screen: `apps/mobile/app/lifestyle/movement.tsx`
- Active minutes today, sedentary minutes, movement breaks
- Buttons: 3-min walk, stretch now, stand up, add micro-activity
- Weekly movement chart
- Link to physical module for deeper workouts

### 8.5 Digital Balance Screen: `apps/mobile/app/lifestyle/digital.tsx`
- Screen time today, bedtime screen use
- Buttons: Digital sunset, focus mode, bedtime lock
- Prompt: "Did screen use affect sleep or mood?"
- Premium area: deeper pattern analysis

### 8.6 Nature/Light Screen: `apps/mobile/app/lifestyle/nature.tsx`
- Outdoor minutes today and this week
- Morning light prompt, nature break prompt
- Button: Log a walk in nature
- Premium area: pattern insights

---

## 9. Phase 6 — Weekly Review + Insights

### 9.1 Weekly Review: `apps/mobile/app/lifestyle/weekly-review.tsx`

**Questions (from PRD Section 5):**
1. How many days did you sleep 7+ hours? (0-7 stepper)
2. How many days did you hit your hydration target? (0-7)
3. How many days did you log meals or follow your plan? (0-7)
4. How many days did you complete at least one movement break? (0-7)
5. How often did screen time interfere with sleep or focus? (Never/Rarely/Sometimes/Often)
6. How often did you get outdoors or daylight? (Never/Rarely/Sometimes/Often)
7. Which habit helped most this week? (domain chips)
8. Which habit blocked you most this week? (blocker chips)

**Post-submit:**
- Compute score change
- Generate new plan if needed
- Show insights card
- Sync to API

### 9.2 Insights: `apps/mobile/app/lifestyle/insights.tsx`

**Same pattern as mental/spiritual insights:**
- Time window selector (7 or 30 days)
- Lifestyle score trend sparkline
- Domain breakdown cards
- Sleep vs screen time correlation insight
- Streak tracker
- AI insight: "What improved your lifestyle most this week"

---

## 10. Phase 7 — Dashboard Integration + Polish

### 10.1 Dashboard Routing

Update `apps/mobile/app/(tabs)/dashboard.tsx` segment press handler:

```typescript
} else if (pillar.key === "lifestyle") {
  if (lifestyleDone) {
    router.push("/lifestyle/hub");
  } else {
    router.push("/lifestyle/onboarding");
  }
}
```

Read `lifestyleOnboardingDone` from unified profile.

Add CTA card on dashboard:
```
┌─────────────────────────────────────┐
│ 🌿 Complete Lifestyle Assessment    │
│ Track sleep, food, water & more     │
└─────────────────────────────────────┘
```

### 10.2 Layout

Create `apps/mobile/app/lifestyle/_layout.tsx`:
```typescript
import { Stack } from "expo-router";
export default function LifestyleLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
```

### 10.3 UserProfile Extension

Add to `UserProfile` in `apps/mobile/lib/user-store.ts`:
```typescript
lifestyleOnboardingDone: boolean;
```

### 10.4 Shared Components

Create reusable components under `apps/mobile/components/lifestyle/`:

| Component | Purpose | Reuse from |
|-----------|---------|------------|
| `LifestyleScoreRing.tsx` | Donut score ring (orange theme) | Adapt MentalScoreRing |
| `DomainCard.tsx` | Sub-score card with icon + label | Adapt spiritual DomainCard |
| `QuickLogButton.tsx` | One-tap log button (water, meal, etc.) | New |
| `CoachCard.tsx` | AI coach message display | Adapt spiritual CoachCard |
| `GoalRing.tsx` | Circular progress for hydration/movement goals | New |

---

## 11. File Creation Summary

### New files to create:

```
# Types
packages/types/src/lifestyle.ts

# Engine (9 files)
packages/engines/lifestyle-engine/package.json
packages/engines/lifestyle-engine/tsconfig.json
packages/engines/lifestyle-engine/src/index.ts
packages/engines/lifestyle-engine/src/questions.ts
packages/engines/lifestyle-engine/src/baseline.ts
packages/engines/lifestyle-engine/src/scoring.ts
packages/engines/lifestyle-engine/src/plan-generator.ts
packages/engines/lifestyle-engine/src/checkin-analyzer.ts
packages/engines/lifestyle-engine/src/weekly-reviewer.ts
packages/engines/lifestyle-engine/src/monthly-reviewer.ts
packages/engines/lifestyle-engine/src/coach.ts

# Local store
apps/mobile/lib/lifestyle-store.ts

# API routes (13 route files)
apps/web/app/api/lifestyle/baseline/route.ts
apps/web/app/api/lifestyle/checkin/route.ts
apps/web/app/api/lifestyle/checkin/history/route.ts
apps/web/app/api/lifestyle/sleep/route.ts
apps/web/app/api/lifestyle/meal/route.ts
apps/web/app/api/lifestyle/hydration/route.ts
apps/web/app/api/lifestyle/movement/route.ts
apps/web/app/api/lifestyle/digital/route.ts
apps/web/app/api/lifestyle/nature/route.ts
apps/web/app/api/lifestyle/routine/route.ts
apps/web/app/api/lifestyle/weekly-review/route.ts
apps/web/app/api/lifestyle/plan/route.ts
apps/web/app/api/lifestyle/score/route.ts

# Mobile screens (18 files)
apps/mobile/app/lifestyle/_layout.tsx
apps/mobile/app/lifestyle/onboarding.tsx
apps/mobile/app/lifestyle/hub.tsx
apps/mobile/app/lifestyle/checkin.tsx
apps/mobile/app/lifestyle/log-water.tsx
apps/mobile/app/lifestyle/log-meal.tsx
apps/mobile/app/lifestyle/log-sleep.tsx
apps/mobile/app/lifestyle/log-movement.tsx
apps/mobile/app/lifestyle/sleep.tsx
apps/mobile/app/lifestyle/food.tsx
apps/mobile/app/lifestyle/hydration.tsx
apps/mobile/app/lifestyle/movement.tsx
apps/mobile/app/lifestyle/digital.tsx
apps/mobile/app/lifestyle/nature.tsx
apps/mobile/app/lifestyle/weekly-review.tsx
apps/mobile/app/lifestyle/monthly-review.tsx
apps/mobile/app/lifestyle/insights.tsx
apps/mobile/app/lifestyle/goals.tsx

# Shared components (5 files)
apps/mobile/components/lifestyle/LifestyleScoreRing.tsx
apps/mobile/components/lifestyle/DomainCard.tsx
apps/mobile/components/lifestyle/QuickLogButton.tsx
apps/mobile/components/lifestyle/CoachCard.tsx
apps/mobile/components/lifestyle/GoalRing.tsx
```

### Files to modify:

```
packages/types/src/index.ts              — export lifestyle types
packages/db/prisma/schema.prisma         — add 12 lifestyle models + lifestyleOnboardingDone
apps/mobile/lib/user-store.ts            — add lifestyleOnboardingDone to UserProfile
apps/mobile/app/(tabs)/dashboard.tsx     — route lifestyle segment, remove "coming soon" alert, read lifestyleDone
apps/web/app/api/profile/route.ts        — handle lifestyleOnboardingDone field
```

**Total: ~48 new files, ~5 modified files.**

---

## 12. Color Theme

All lifestyle screens use the pillar color **`#FF9500` (orange)** as the accent:
- Active state: `#FF9500`
- Background tint: `#FF950010` or `#FF950015`
- Border highlight: `#FF950040`
- Text on white: `#FF9500`

---

## 13. Implementation Order (recommended)

| Step | Task | Depends on |
|------|------|------------|
| 1 | Define types in `packages/types/src/lifestyle.ts` | Nothing |
| 2 | Build scoring engine (`baseline.ts`, `scoring.ts`, `questions.ts`) | Step 1 |
| 3 | Build plan generator + coach (`plan-generator.ts`, `coach.ts`) | Step 2 |
| 4 | Build check-in analyzer + weekly/monthly reviewer | Step 2 |
| 5 | Extend Prisma schema + run `prisma db push` | Step 1 |
| 6 | Build local store (`lifestyle-store.ts`) | Step 1 |
| 7 | Build API routes | Steps 5, 6 |
| 8 | Build `_layout.tsx` + onboarding screen | Steps 2, 3, 6 |
| 9 | Build hub screen + shared components | Steps 2, 6 |
| 10 | Build daily check-in screen | Steps 4, 6 |
| 11 | Build quick log screens (water, meal, sleep, movement) | Step 6 |
| 12 | Build domain detail screens (sleep, food, hydration, movement, digital, nature) | Steps 6, 11 |
| 13 | Build weekly review + monthly review + insights screens | Steps 4, 6 |
| 14 | Integrate dashboard routing + CTA card | Step 9 |
| 15 | Add `lifestyleOnboardingDone` to user-store + profile API | Step 5 |
| 16 | End-to-end testing | All |

---

## 14. Key Differences from Current Implementation

| Aspect | Current (simple) | New (full PRD) |
|--------|-----------------|----------------|
| Questions | 4 (sleep, alcohol, tobacco, screen) | 28 across 7 categories |
| Domains scored | Sleep, alcohol, tobacco, screen (4-factor) | Sleep, nutrition, hydration, movement, digital, nature/routine (6-domain) |
| Weights | Sleep 35%, alcohol 25%, tobacco 25%, screen 15% | Sleep 30%, nutrition 25%, hydration 15%, movement 15%, digital 10%, nature 5% |
| Daily tracking | None | 8-question check-in + domain-specific quick logs |
| Weekly review | None | 8-question weekly review with plan adjustment |
| Monthly review | None | 7-question monthly review with plan escalation |
| Adaptive plan | None | Domain-specific habits, band-based routing |
| AI coach | None | Band-matched response templates |
| Hub screen | "Coming soon" alert | Full Today dashboard with domain cards |
| Override rules | None | Sleep collapse, digital overload → force downgrade |

---

## 15. Acceptance Criteria (from PRDs)

- [ ] User completes onboarding in under 5 minutes
- [ ] Daily check-in completes in under 60 seconds
- [ ] App correctly computes 6 sub-scores and overall lifestyle score (0-100)
- [ ] Reverse-scored items handled correctly
- [ ] Score bands map to Green/Yellow/Orange/Red correctly
- [ ] Adaptive plan changes when the weakest domain changes
- [ ] AI coach gives one short, clear next action matched to band
- [ ] System clearly flags when sleep or digital balance is hurting recovery
- [ ] Override rule downgrades plan when sleep collapses or digital overload damages recovery
- [ ] Weekly review shows what helped and what hurt wellbeing
- [ ] Free tier remains useful without feeling empty
- [ ] All lifestyle scores consistent across dashboard, hub, and profile screens
- [ ] All data syncs to API (offline-first, local save always works)
- [ ] User can log water, meal, sleep, movement in under 60 seconds total
