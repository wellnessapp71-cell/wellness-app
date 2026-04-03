# Wellness App Integration Plan (Codex Execution Guide)

## Objective

Integrate Gym AI modules (PRESENT IN 'GYM 3' FOLDER IN ROOT) into a scalable wellness platform using:

- Next.js (API + Web)
- React Native (Expo)
- Prisma (Database)
- TypeScript (strict, modular)

The system must be:

- API-first
- Modular (engine-based)
- Production-ready (no hacks)

---

## Global Rules (MANDATORY)

1. Always read ARCHITECTURE.md before making changes
2. Do NOT use Python anywhere
3. Keep logic, API, and DB strictly separated
4. Never mix multiple phases in one implementation
5. Prefer small, testable modules over large files
6. All functions must be typed (TypeScript strict mode)
7. Do not introduce UI unless explicitly asked
8. Do not assume missing logic — ask or stub cleanly

---

## Folder Structure (TARGET)

apps/
web/ → Next.js app (API + frontend)
mobile/ → React Native Expo

packages/
engines/
fitness-engine/
nutrition-engine/
yoga-engine/
db/
types/

---

## Execution Strategy

Follow phases strictly in order.
Do NOT skip phases.
Do NOT combine phases.

---

# =========================

# PHASE 1 — ENGINE CREATION

# =========================

## Goal

Convert gym project logic into modular TypeScript engines.

## Scope

- fitness-engine
  - workout planner
  - exercise database
  - progress tracking

- nutrition-engine
  - meal planner
  - calorie logic

- yoga-engine
  - yoga routines
  - flexibility assessment

## Rules

- No API code
- No database code
- Pure logic only
- One function per responsibility
- Reusable modules only

## Output

- /packages/engines/\*
- Clean TypeScript modules
- Proper types/interfaces

## Success Criteria

- Each engine works independently
- No cross-dependency on API or DB

---

# ======================

# PHASE 2 — API LAYER

# ======================

## Goal

Expose engines via Next.js API routes

## Scope

Create APIs:

- /api/workout
- /api/nutrition
- /api/yoga
- /api/assessment

## Rules

- APIs must be thin (call engines only)
- Validate request body
- Return structured JSON
- No business logic inside API

## Output

- API route files in Next.js app

## Success Criteria

- APIs return correct engine outputs
- No duplication of logic

---

# ============================

# PHASE 3 — DATABASE LAYER

# ============================

## Goal

Persist user data and generated plans

## Scope

- Prisma schema
- Models:
  - User
  - Profile
  - Plan
  - Progress

## Rules

- Do not modify engine logic
- Store only structured data (JSON where needed)
- Maintain relations properly

## Output

- Prisma schema
- DB-integrated APIs

## Success Criteria

- Plans saved and retrieved correctly
- No logic duplication

---

# ============================

# PHASE 4 — FRONTEND INTEGRATION

# ============================

## Goal

Connect mobile and web apps to backend

## Scope

- API calls from React Native
- Basic screens:
  - Generate workout
  - View plans
  - Track progress

## Rules

- Do not modify backend logic
- Keep UI consistent with existing ui
- Focus on functionality

## Output

- Working API integration
- Minimal UI screens

## Success Criteria

- End-to-end flow works
- Data flows correctly

---

# ============================

# PHASE 5 — ENHANCEMENTS

# ============================

## Goal

Extend toward full wellness platform

## Features

- Wellness Wheel
- Habit tracker
- Sleep tracking
- AI-enhanced recommendations

## Rules

- Build on existing architecture
- Do not refactor previous phases unless necessary

---

## Execution Protocol (IMPORTANT)

For each phase:

1. Ask Codex to:
   - Analyze
   - Plan
   - THEN implement

2. Review output before moving forward

3. Fix issues before next phase

4. Commit after each phase

---

## Prompting Rules

Always specify:

- Current phase
- Exact scope
- Restrictions

Example:
"Execute Phase 1: Create fitness-engine only. Do not include API or DB."

---

## Failure Handling

If output is:

- inconsistent → refine prompt
- over-engineered → simplify
- incorrect → isolate and fix module

Never proceed with broken phase.

---

## Final Goal

A modular, scalable wellness platform where:

- Engines = intelligence
- API = interface
- DB = persistence
- Apps = experience

No tight coupling.
No spaghetti code.
