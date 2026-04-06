/**
 * Unified user store — single source of truth for the entire app.
 * All user data is stored locally (AsyncStorage) AND synced to the API.
 * Local-first: works offline, syncs when possible.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import type { SupportRequest } from "@aura/types";

const KEY_AUTH = "@aura/auth";
const KEY_PROFILE = "@aura/profile";
const KEY_WORKSPACE = "@aura/workspace";

// ── Types ────────────────────────────────────────────────────────

export interface AuthState {
  token: string;
  userId: string;
  email: string;
  username: string;
  name: string | null;
  referralCode: string;
  role: string;
  organization?: {
    id: string;
    name: string;
    referralCode: string;
    membershipRole?: string;
  } | null;
}

export interface WebinarNotification {
  id: string;
  title: string;
  message: string;
  scheduledFor: string;
  deliveryStatus: string;
  audience: string;
}

export interface EmployeeWorkspace {
  organization: {
    id: string;
    name: string;
    referralCode: string;
    membershipRole?: string;
  } | null;
  webinars: WebinarNotification[];
  supportRequests: SupportRequest[];
  lastSyncedAt: string;
}

export interface UserProfile {
  // Demographics
  age: number;
  gender: "male" | "female" | "other";
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number | null;
  bodyShape?: string | null;

  // Scores (single source of truth — consistent across all screens)
  scorePhysical: number;
  scoreMental: number;
  scoreSpiritual: number;
  scoreLifestyle: number;

  // Physical / fitness
  activityLevel?: string | null;
  exerciseDaysPerWeek?: number | null;
  fitnessLevel?: string | null;
  fitnessScore?: number | null;
  hasGymAccess: boolean;
  hasHomeEquipment: boolean;

  // Benchmarks
  pushUps?: number | null;
  pullUps?: number | null;
  squats?: number | null;
  plankSeconds?: number | null;
  burpees?: number | null;

  // Nutrition
  dietType?: string | null;
  allergies: string[];
  medicalConditions: string[];
  waterGlassesPerDay?: number | null;

  // Lifestyle
  sleepHours?: number | null;
  alcoholFrequency?: number | null;
  tobacco: boolean;
  screenHours?: number | null;

  // Spiritual
  spiritualAnswers?: number[] | null;

  // Onboarding flags
  mentalOnboardingDone: boolean;
  physicalOnboardingDone: boolean;
  spiritualOnboardingDone: boolean;
  lifestyleOnboardingDone: boolean;

  // Tracking
  streakDays: number;
  totalWorkouts: number;
  totalCaloriesBurned: number;
}

export interface FullUserState {
  auth: AuthState | null;
  profile: UserProfile | null;
  onboardingComplete: boolean;
  plans: Record<string, { planId: string; content: unknown; createdAt: string }>;
  consentState: { hrSharing: boolean; research: boolean; dataExport: boolean } | null;
  employeeWorkspace: EmployeeWorkspace | null;
}

const DEFAULT_STATE: FullUserState = {
  auth: null,
  profile: null,
  onboardingComplete: false,
  plans: {},
  consentState: null,
  employeeWorkspace: null,
};

// ── Auth ─────────────────────────────────────────────────────────

export async function getAuth(): Promise<AuthState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_AUTH);
    return raw ? normalizeAuthState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export async function saveAuth(auth: AuthState): Promise<void> {
  const normalized = normalizeAuthState(auth);
  if (!normalized) {
    return;
  }
  // Store token securely on native, keep metadata in AsyncStorage
  const { saveAuthToken } = await import("./auth-token");
  if (normalized.token) {
    await saveAuthToken(normalized.token);
  }
  await AsyncStorage.setItem(KEY_AUTH, JSON.stringify(normalized));
}

export async function clearAuth(): Promise<void> {
  const { clearAuthToken } = await import("./auth-token");
  await clearAuthToken();
  await AsyncStorage.removeItem(KEY_AUTH);
  await AsyncStorage.removeItem(KEY_PROFILE);
  await AsyncStorage.removeItem(KEY_WORKSPACE);
}

// Re-export from cycle-free module (see auth-token.ts)
export { getAuthToken } from "./auth-token";

// ── Profile ──────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PROFILE);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
}

export async function getEmployeeWorkspace(): Promise<EmployeeWorkspace | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_WORKSPACE);
    return raw ? (JSON.parse(raw) as EmployeeWorkspace) : null;
  } catch {
    return null;
  }
}

export async function saveEmployeeWorkspace(
  workspace: EmployeeWorkspace | null,
): Promise<void> {
  if (!workspace) {
    await AsyncStorage.removeItem(KEY_WORKSPACE);
    return;
  }
  await AsyncStorage.setItem(KEY_WORKSPACE, JSON.stringify(workspace));
}

export async function updateProfile(
  partial: Partial<UserProfile>,
): Promise<UserProfile> {
  const current = await getProfile();
  const updated = { ...current, ...partial } as UserProfile;
  await saveProfile(updated);

  // Sync to API (fire & forget)
  syncProfileToApi(partial).catch(() => {});

  return updated;
}

// ── Score helpers ────────────────────────────────────────────────

export async function getScores(): Promise<{
  physical: number;
  mental: number;
  spiritual: number;
  lifestyle: number;
}> {
  const profile = await getProfile();
  return {
    physical: profile?.scorePhysical ?? 50,
    mental: profile?.scoreMental ?? 50,
    spiritual: profile?.scoreSpiritual ?? 50,
    lifestyle: profile?.scoreLifestyle ?? 50,
  };
}

export async function updateScores(
  scores: Partial<{
    physical: number;
    mental: number;
    spiritual: number;
    lifestyle: number;
  }>,
): Promise<void> {
  const partial: Partial<UserProfile> = {};
  if (scores.physical !== undefined) partial.scorePhysical = scores.physical;
  if (scores.mental !== undefined) partial.scoreMental = scores.mental;
  if (scores.spiritual !== undefined) partial.scoreSpiritual = scores.spiritual;
  if (scores.lifestyle !== undefined) partial.scoreLifestyle = scores.lifestyle;
  await updateProfile(partial);
}

// ── Full state ───────────────────────────────────────────────────

export async function getFullState(): Promise<FullUserState> {
  const [auth, profile, employeeWorkspace] = await Promise.all([
    getAuth(),
    getProfile(),
    getEmployeeWorkspace(),
  ]);
  return {
    ...DEFAULT_STATE,
    auth,
    profile,
    onboardingComplete: !!auth && !!profile,
    employeeWorkspace,
  };
}

// ── API sync ─────────────────────────────────────────────────────

async function syncProfileToApi(
  partial: Partial<UserProfile>,
): Promise<void> {
  try {
    await api.post("/profile", { profile: partial });
  } catch {
    // Offline — local save is fine
  }
}

export async function syncFromApi(): Promise<FullUserState | null> {
  try {
    const data = await api.get<{
      user: {
        id: string;
        email: string;
        username: string;
        name: string | null;
        role: string;
        referralCode: string;
        consentState: unknown;
      };
      profile: UserProfile | null;
      organizations: Array<{
        membershipRole: string;
        organization: {
          id: string;
          name: string;
          referralCode: string;
        };
      }>;
      employeeWorkspace: {
        organization: {
          id: string;
          name: string;
          referralCode: string;
          membershipRole?: string;
        } | null;
        webinars: Array<{
          id: string;
          title: string;
          message: string;
          scheduledFor: string;
          deliveryStatus: string;
          audience: string;
        }>;
        supportRequests: Array<{
          requestId: string;
          userId: string;
          issueType: string;
          preferredMode: SupportRequest["preferredMode"];
          sessionType?: string;
          status: SupportRequest["status"];
          language?: string | null;
          preferredStyle?: string | null;
          reason?: string | null;
          desiredOutcome?: string | null;
          organizationId?: string;
          organizationName?: string;
          psychologistId?: string;
          psychologistName?: string;
          scheduledForIso?: string;
          acceptedAtIso?: string;
          meetingUrl?: string;
          sessionNotes?: string;
          events?: SupportRequest["events"];
          createdAtIso: string;
        }>;
      } | null;
      plans: Record<
        string,
        { planId: string; content: unknown; createdAt: string }
      >;
    }>("/profile");

    // Update local auth (keep token)
    const currentAuth = await getAuth();
    const selectedOrganization =
      data.employeeWorkspace?.organization ?? data.organizations[0]?.organization ?? null;
    const primaryOrganization = selectedOrganization
      ? {
          id: selectedOrganization.id,
          name: selectedOrganization.name,
          referralCode: selectedOrganization.referralCode,
          membershipRole:
            data.employeeWorkspace?.organization?.membershipRole ??
            data.organizations[0]?.membershipRole,
        }
      : null;

    let updatedAuth = currentAuth;
    if (currentAuth) {
      updatedAuth = {
        ...currentAuth,
        email: data.user.email,
        username: data.user.username,
        name: data.user.name,
        referralCode: data.user.referralCode,
        role: data.user.role ?? currentAuth.role ?? "employee",
        organization: primaryOrganization,
      };
      await saveAuth(updatedAuth);
    }

    // Update local profile
    if (data.profile) {
      await saveProfile(data.profile);
    }

    const workspace: EmployeeWorkspace | null = data.employeeWorkspace
      ? {
          organization: data.employeeWorkspace.organization,
          webinars: data.employeeWorkspace.webinars.map((webinar) => ({
            ...webinar,
            scheduledFor: webinar.scheduledFor,
          })),
          supportRequests: data.employeeWorkspace.supportRequests.map((request) => ({
            ...request,
            language: request.language ?? undefined,
            preferredStyle: request.preferredStyle ?? undefined,
            reason: request.reason ?? undefined,
            desiredOutcome: request.desiredOutcome ?? undefined,
          })),
          lastSyncedAt: new Date().toISOString(),
        }
      : null;
    await saveEmployeeWorkspace(workspace);

    return {
      auth: updatedAuth,
      profile: data.profile,
      onboardingComplete: !!updatedAuth && !!data.profile,
      plans: data.plans ?? {},
      consentState: data.user.consentState as FullUserState["consentState"],
      employeeWorkspace: workspace,
    };
  } catch {
    // Offline — return local state
    return getFullState();
  }
}

// ── Onboarding check ─────────────────────────────────────────────

export async function isOnboardingComplete(): Promise<boolean> {
  const [auth, profile] = await Promise.all([getAuth(), getProfile()]);
  return !!auth && !!profile;
}

// ── Legacy migration helper ──────────────────────────────────────
// Clear old fragmented stores after migration

export async function clearLegacyStores(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(["@aura/onboarding", "@aura/mental"]);
  } catch {
    // no-op
  }
}

function normalizeAuthState(value: unknown): AuthState | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.token !== "string" ||
    typeof candidate.userId !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.username !== "string" ||
    typeof candidate.referralCode !== "string"
  ) {
    return null;
  }

  const organization =
    typeof candidate.organization === "object" && candidate.organization !== null
      ? {
          id: String((candidate.organization as Record<string, unknown>).id ?? ""),
          name: String((candidate.organization as Record<string, unknown>).name ?? ""),
          referralCode: String((candidate.organization as Record<string, unknown>).referralCode ?? ""),
          membershipRole:
            typeof (candidate.organization as Record<string, unknown>).membershipRole === "string"
              ? String((candidate.organization as Record<string, unknown>).membershipRole)
              : undefined,
        }
      : null;

  return {
    token: candidate.token,
    userId: candidate.userId,
    email: candidate.email,
    username: candidate.username,
    name: typeof candidate.name === "string" || candidate.name === null ? candidate.name : null,
    referralCode: candidate.referralCode,
    role: typeof candidate.role === "string" ? candidate.role : "employee",
    organization,
  };
}
