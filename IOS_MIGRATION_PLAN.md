# iOS Migration Runbook for AI Agents (2-3 Sessions, No iPhone)

## Goal

Complete the iOS migration workstream as far as possible without a physical iPhone, in 2-3 focused agent sessions, while keeping Android feature parity as the source of truth.

## Constraints

- Developer machine is Windows.
- No physical iPhone is available.
- iOS Simulator is not available on Windows.
- Work must still produce a shippable codebase and successful iOS cloud builds.

## Definition of Done for This Stage

1. iOS builds successfully on EAS preview profile.
2. No obvious iOS config gaps remain in app config, permissions, build settings, and env handling.
3. A parity checklist exists and is executed for all cross-platform logic using Android and web as proxy validation.
4. Known untestable items are explicitly listed for later physical-device validation.

## Session Model

Use either 2 long sessions or 3 shorter sessions.

### Option A: 2 Sessions

- Session 1: Build readiness + config hardening.
- Session 2: Parity validation + release prep artifacts.

### Option B: 3 Sessions

- Session 1: Audit and config fixes.
- Session 2: Runtime parity and no-iPhone test execution.
- Session 3: EAS build verification, release checklist, and handoff.

## Agent Execution Rules

1. Do not add new features.
2. Do not redesign UI.
3. Keep changes minimal and scoped to iOS readiness/parity.
4. Prefer environment and configuration fixes over speculative refactors.
5. At the end of each session, update this file with completed items and blockers.

## Session 1: Audit and Build Readiness

### Objectives

- Confirm iOS metadata and permissions are complete.
- Ensure cloud iOS build pipeline can run from current repository state.
- Remove obvious platform pitfalls before validation.

### Required Tasks

1. Validate iOS configuration in apps/mobile/app.json:

- bundle identifier
- version and build strategy
- camera and audio usage descriptions via plugins/ios config

2. Validate EAS profiles in apps/mobile/eas.json for:

- development
- preview
- production

3. Validate dependency compatibility for Expo SDK 53 and React Native 0.79.

4. Audit API base URL behavior in apps/mobile/lib/api.ts:

- keep expo host fallback for local debug
- enforce explicit EXPO_PUBLIC_API_URL for cloud/device-like scenarios
- avoid hidden localhost assumptions in production-like paths

5. Trigger iOS cloud build:

- eas build -p ios --profile preview

### Deliverables

- Build status captured (success/failure and error summary).
- Any required config/code fixes committed.
- Updated risk list in this document.

### Exit Gate

- At least one iOS preview cloud build starts successfully.

## Session 2: Parity Validation Without iPhone

### Objectives

- Validate all non-device-specific behavior using Android and web as proxies.
- Produce a strict parity report that separates verified vs unverified iOS behaviors.

### Required Tasks

1. Build parity checklist from routes under apps/mobile/app.

2. Validate cross-platform logic on Android:

- onboarding and auth
- tab navigation and stack/modal routing
- plans/track/dashboard data loading
- journal/chat/booking input and keyboard flows
- error states and empty states

3. Validate web or API-level behavior where helpful:

- auth/session persistence assumptions
- API error contract and response parsing

4. Run static quality gates:

- npm run typecheck in apps/mobile
- any existing project tests relevant to mobile logic

5. Mark each feature as:

- validated via proxy
- needs physical iPhone

### Deliverables

- Completed parity matrix in this file.
- Defect list with severity and owner.
- Decision note for go/no-go into release prep.

### Exit Gate

- No blocker defects in shared logic and navigation flows.

## Session 3: Release Prep and Handoff (Optional but Recommended)

### Objectives

- Finalize what can be completed now.
- Create a clean handoff package for later iPhone validation and App Store submission.

### Required Tasks

1. Re-run iOS cloud build after fixes.

2. Prepare release readiness checklist:

- app metadata
- privacy answers draft
- permission wording review
- screenshot and store asset requirements list

3. Produce physical-device validation script for future tester with iPhone.

4. Document final blockers that only iPhone testing can clear.

### Deliverables

- Latest iOS build link/reference.
- Release checklist.
- Physical-device test script.

### Exit Gate

- Migration stage marked complete pending only physical-device validation.

## No-iPhone Test Strategy

## What can be validated now

- Build and signing pipeline via EAS cloud iOS build.
- Most app logic, routing, state, and API behavior via Android/web proxy tests.
- Type safety and static code quality.

## What cannot be fully validated now

- Real iOS camera runtime behavior and performance.
- iOS audio interruption behavior with calls/background transitions.
- iOS-specific UX details such as native keyboard feel, safe area edge cases, and system prompts.

## Minimum future device validation required

1. Install preview build on at least one iPhone.
2. Run camera scan and rep tracker end to end.
3. Run lesson audio, pause/resume, and background/foreground transitions.
4. Execute onboarding, auth, and key tab flows.

## Feature Parity Checklist Template

Status legend:

- PASS_PROXY
- FAIL_PROXY
- NEEDS_IPHONE

Areas to track:

- Onboarding: referral, signup, login, consent, questionnaire, scoring
- Tabs: dashboard, discover, plans, track, profile
- Physical: hub, checkin, questionnaire, workout plan, workout session, nutrition setup, nutrition plan, weight log, progress
- Mental: hub, scan, learning, lesson audio, journal, journal entry, calm toolkit, chatroom, community, booking, weekly review
- Lifestyle: hub, onboarding, checkin, log meal, log water
- Spiritual: hub, onboarding, meditation, breathwork, soundscape, journal, journal entry, insights, library, live sessions, weekly review
- Other: admin modal, stress scan redirect

## Risks and Mitigations

1. Risk: iOS build passes but runtime has camera/audio regressions.

- Mitigation: prioritize physical-device script and block release until completed.

2. Risk: localhost API assumptions break in real device/cloud contexts.

- Mitigation: require EXPO_PUBLIC_API_URL for non-debug scenarios.

3. Risk: App Store privacy rejection.

- Mitigation: prepare privacy and permission wording in Session 3.

## Working Commands

- Mobile typecheck: npm run typecheck
- Android run: npx expo run:android
- iOS cloud build: eas build -p ios --profile preview

## Final Handoff Output Required From Agents

At the end of migration work, agents must provide:

1. Summary of all code/config changes.
2. iOS build status and any failures with fixes.
3. Completed parity checklist with PASS_PROXY, FAIL_PROXY, NEEDS_IPHONE.
4. Explicit list of remaining tasks that require a real iPhone.

## Session 1 Execution Log (Completed)

Date: 2026-04-02

### Completed

1. iOS app config hardened in apps/mobile/app.json:

- Added explicit iOS Info.plist keys:
  - ITSAppUsesNonExemptEncryption: false
  - NSCameraUsageDescription
  - NSMicrophoneUsageDescription
- Added expo-av plugin configuration with microphonePermission copy.

2. EAS profile audit completed in apps/mobile/eas.json:

- development, preview, production profiles present.
- appVersionSource is remote.

3. Dependency audit completed in apps/mobile/package.json:

- Expo SDK 53 and React Native 0.79.x present as expected.

4. API base URL hardening completed in apps/mobile/lib/api.ts:

- Keeps Expo host fallback for local dev.
- Removes implicit localhost behavior in non-dev contexts.
- Throws explicit error when EXPO_PUBLIC_API_URL is missing outside local development.

### Commands Run

1. npm run typecheck (from repository root)

- Result: failed because script not defined at root.

2. cd apps/mobile && npm run typecheck

- Result: failed due pre-existing SVG typing issues in mental chart components (not introduced by Session 1 changes).

3. cd /d/Downloads/wellness-app/apps/mobile && npx eas build -p ios --profile preview --non-interactive

- Result: build did not start due credentials setup in non-interactive mode.

4. cd /d/Downloads/wellness-app/apps/mobile && npx eas build -p ios --profile preview

- Result: reached interactive Apple credential prompt and is waiting for input.

### Blockers

1. iOS credentials provisioning requires interactive EAS setup.

- Next action: run eas build -p ios --profile preview in interactive mode and complete credential prompts.

3. Active interactive prompt currently waiting in terminal:

- "Do you want to log in to your Apple account? (Y/n)"
- Build terminal id: aa052acd-b67a-4af5-b23f-b3e2ad0c3ca5

2. Typecheck has existing unrelated errors in chart components using react-native-svg typings.

- Next action: schedule a dedicated typing cleanup task or isolate these files for temporary compatibility handling.

### Session 1 Status

- Session 1 objective: PARTIALLY COMPLETE.
- Build/config hardening: COMPLETE.
- Cloud build start gate: BLOCKED by non-interactive credentials requirement.
