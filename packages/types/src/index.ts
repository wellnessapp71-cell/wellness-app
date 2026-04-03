export interface WellnessScore {
  subject: string;
  value: number;
  fullMark: number;
}

export interface WellnessCard {
  title: string;
  score: number;
  color: string;
  bg: string;
  message: string;
}

export interface Task {
  id: number;
  title: string;
  duration: string;
  type: "Spiritual" | "Mental" | "Physical" | "Lifestyle";
  color: string;
  bg: string;
  done: boolean;
}

export interface Event {
  id: number;
  title: string;
  expert: string;
  img: string;
  time: string;
  tags: string[];
}

export interface Article {
  id: number;
  title: string;
  readTime: string;
  category: string;
  img: string;
}

export interface UserProfile {
  name: string;
  company: string;
  avatar: string;
  streak: number;
  coins: number;
}

export interface AdminStat {
  label: string;
  value: string | number;
  color?: string;
}

export const FITNESS_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export const WORKOUT_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const YOGA_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const BODY_PARTS = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
  "cardio",
  "full_body",
] as const;

export const EQUIPMENT_TYPES = [
  "bodyweight",
  "dumbbells",
  "barbell",
  "resistance_bands",
  "kettlebell",
  "machine",
  "cardio",
] as const;

export const GOAL_TYPES = [
  "fat_loss",
  "muscle_gain",
  "endurance",
  "strength",
  "flexibility",
  "body_part_chest",
  "body_part_back",
  "body_part_shoulders",
  "body_part_arms",
  "body_part_legs",
  "body_part_core",
  "stress_reduction",
  "posture",
  "balance",
  "core_strength",
  "spinal_health",
  "detoxification",
] as const;

export const NUTRITION_GOALS = ["maintain", "lose", "gain"] as const;

export const ACTIVITY_LEVELS = [
  "sedentary",
  "light",
  "moderate",
  "active",
] as const;

export const DIET_TYPES = ["veg", "vegan", "non-veg", "jain", "keto"] as const;

export type FitnessLevel = (typeof FITNESS_LEVELS)[number];
export type WorkoutDay = (typeof WORKOUT_DAYS)[number];
export type YogaDay = (typeof YOGA_DAYS)[number];
export type BodyPart = (typeof BODY_PARTS)[number];
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];
export type GoalType = (typeof GOAL_TYPES)[number];
export type NutritionGoal = (typeof NUTRITION_GOALS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type DietType = (typeof DIET_TYPES)[number];
export type MetricType = "reps" | "seconds";
export type PracticeQuality = "excellent" | "good" | "average" | "poor";
export type Gender = "male" | "female" | "other";
export type FitnessSublevel = 1 | 2;
export type YogaAssessmentCategory =
  | "flexibility"
  | "balance"
  | "strength"
  | "endurance"
  | "meditation";

export interface WorkoutProfile {
  userId: string;
  name?: string;
  age: number;
  gender: Gender;
  currentWeightKg: number;
  targetWeightKg?: number;
  hasHomeEquipment: boolean;
  hasGymAccess: boolean;
  goals: GoalType[];
  fitnessLevel: FitnessLevel;
  fitnessSublevel: FitnessSublevel;
}

export interface NutritionProfile {
  userId: string;
  age: number;
  gender: Gender;
  currentWeightKg: number;
  heightCm?: number;
  activityLevel?: ActivityLevel;
  nutritionGoal: NutritionGoal;
  weeklyCalorieBurned: number;
  weeklyCalorieIntake?: number;
}

export interface YogaProfile {
  userId: string;
  name?: string;
  fitnessLevel: FitnessLevel;
  goals: GoalType[];
  totalWorkouts?: number;
  workoutStreak?: number;
}

export interface ExerciseDefinition {
  name: string;
  description: string;
  equipment: EquipmentType[];
  bodyParts: BodyPart[];
  goals: GoalType[];
  difficulty: FitnessLevel;
  caloriesPerMinute: number;
  instructions: string[];
  tips: string[];
  variations?: string[];
}

export interface WorkoutExercise {
  name: string;
  description: string;
  sets: number;
  reps: number;
  metric: MetricType;
  caloriesPerMinute: number;
  instructions: string[];
  tips: string[];
  bodyParts: BodyPart[];
  equipment: EquipmentType[];
}

export interface WorkoutSession {
  day: WorkoutDay;
  dateIso: string;
  focus: BodyPart | null;
  exercises: WorkoutExercise[];
  durationMinutes: number;
  estimatedCaloriesBurned: number;
}

export interface WorkoutPlan {
  weekStartIso: string;
  userId: string;
  sessions: Partial<Record<WorkoutDay, WorkoutSession>>;
  goals: GoalType[];
  totalCaloriesTarget: number;
  trainingDays: number;
}

export interface WorkoutProgressSnapshot {
  weeklyCompletionPercentage: number;
  nutritionOnTrack: boolean;
}

export interface WorkoutProgressSummary {
  currentLevel: FitnessLevel;
  currentSublevel: FitnessSublevel;
  nextLevel: FitnessLevel | null;
  nextSublevel: FitnessSublevel | null;
  currentScore: number;
  message: string;
}

export interface WorkoutAdaptation {
  exerciseName: string;
  originalSets: number;
  originalReps: number;
  adaptedSets: number;
  adaptedReps: number;
  fatigueLevel: number;
  reason: string;
}

export interface FitnessAssessmentInput {
  gender: Gender;
  responses: {
    pushUps: number;
    pullUps: number;
    squats: number;
    plankSeconds: number;
    burpees: number;
  };
}

export interface FitnessAssessmentExerciseScore {
  exercise: "push_ups" | "pull_ups" | "squats" | "plank" | "burpees";
  rawValue: number;
  score: number;
}

export interface FitnessAssessmentResult {
  fitnessLevel: FitnessLevel;
  overallScore: number;
  exerciseScores: FitnessAssessmentExerciseScore[];
  recommendations: string[];
}

export interface NutritionLogInput {
  mealDescription?: string;
  calories?: number;
  consumedAtIso?: string;
}

export interface NutritionLogEntry {
  dateIso: string;
  mealDescription: string;
  calories: number;
}

export interface MealEstimateMatch {
  token: string;
  calories: number;
  quantity?: number;
}

export interface MealEstimate {
  totalCalories: number;
  matches: MealEstimateMatch[];
  unrecognized: string[];
  usedFallback: boolean;
}

export interface NutritionWeeklySummary {
  totalCaloriesConsumed: number;
  totalCaloriesBurned: number;
  netCalorieBalance: number;
  entries: NutritionLogEntry[];
}

export interface CalorieBalanceAnalysis {
  consumed: number;
  burned: number;
  balance: number;
  recommendedIntake: number;
  weeklyTarget: number;
  onTrack: boolean;
  recommendation: string;
}

export interface MealPlanRequest {
  userId?: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel | string;
  diet: DietType | string;
  cuisine: string;
  allergies: string[];
  medicalConditions: string[];
  goal: string;
  dislikes: string[];
}

export interface MealPlanPrompt {
  userPrompt: string;
}

export interface MealPlanDraft {
  markdown: string;
}

export interface MealPlanGenerator {
  generateMealPlan(
    request: MealPlanRequest,
    prompt: MealPlanPrompt,
  ): MealPlanDraft | Promise<MealPlanDraft>;
}

export interface YogaAssessmentInput {
  responses: Record<YogaAssessmentCategory, FitnessLevel>;
}

export interface YogaAssessmentResult {
  yogaLevel: FitnessLevel;
  categoryLevels: Record<YogaAssessmentCategory, FitnessLevel>;
  description: string;
  recommendedPosesByGoal: Partial<Record<GoalType, string[]>>;
}

export interface YogaPose {
  name: string;
  benefits: string;
  durationSeconds?: number;
  repetitions?: number;
}

export interface YogaSession {
  durationMinutes: number;
  warmUp: YogaPose[];
  mainPractice: YogaPose[];
  coolDown: YogaPose[];
  focus: string[];
}

export interface YogaPlan {
  userId: string;
  createdAtIso: string;
  level: FitnessLevel;
  sessions: Record<YogaDay, YogaSession>;
}

// ──────────────────────────────────────────────
// Section 1: Personalization & Planning AI
// ──────────────────────────────────────────────

export type EquipmentAccess = "home" | "gym" | "minimal";
export type MoodLevel = "great" | "good" | "okay" | "low" | "bad";
export type EnergyLevel = "high" | "moderate" | "low" | "exhausted";
export type BodyShape = "lean" | "average" | "athletic" | "heavy";
export type SessionFeedback = "too_easy" | "just_right" | "too_hard" | "could_not_finish";

export interface FitnessTag {
  level: FitnessLevel;
  primaryGoal: string;
  equipmentAccess: EquipmentAccess;
  label: string; // e.g. "Intermediate | Fat Burn | Home Only"
}

export interface MacroRequirements {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export interface GoalProjection {
  goalType: string;
  currentValue: number;
  targetValue: number;
  estimatedWeeks: number;
  weeklyRateOfChange: number;
  projectedDateIso: string;
  confidence: "high" | "medium" | "low";
  milestones: GoalMilestone[];
}

export interface GoalMilestone {
  label: string;
  targetValue: number;
  estimatedWeek: number;
  reached: boolean;
}

// ──────────────────────────────────────────────
// Section 2: Real-Time Workout Guidance AI
// ──────────────────────────────────────────────

export interface ExerciseSetLog {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  durationSeconds?: number;
  restSeconds?: number;
  formRating?: 1 | 2 | 3 | 4 | 5;
}

export interface ExerciseLog {
  exerciseName: string;
  sets: ExerciseSetLog[];
  targetSets: number;
  targetReps: number;
  metric: MetricType;
  completionPercent: number;
  caloriesBurned: number;
  adaptationApplied: WorkoutAdaptation | null;
  feedback?: SessionFeedback;
  formTips?: string[];
}

export interface WorkoutSessionLog {
  sessionId: string;
  userId: string;
  planId?: string;
  day: WorkoutDay;
  dateIso: string;
  focus: BodyPart | null;
  exercises: ExerciseLog[];
  totalDurationMinutes: number;
  totalCaloriesBurned: number;
  completionPercent: number;
  overallFeedback?: SessionFeedback;
  moodBefore?: MoodLevel;
  energyBefore?: EnergyLevel;
  moodAfter?: MoodLevel;
  energyAfter?: EnergyLevel;
}

export interface SessionSummary {
  sessionLog: WorkoutSessionLog;
  exercisesCompleted: number;
  exercisesTotal: number;
  totalRepsCompleted: number;
  totalRepsTarget: number;
  adaptationsApplied: number;
  caloriesBurned: number;
  durationMinutes: number;
  completionPercent: number;
  levelChange: WorkoutProgressSummary | null;
  motivationalMessage: string;
  recoveryTip: string;
}

// ──────────────────────────────────────────────
// Section 3: Progression, Adaptation & Nutrition
// ──────────────────────────────────────────────

export interface DailyCheckIn {
  dateIso: string;
  userId: string;
  mood: MoodLevel;
  energy: EnergyLevel;
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  fatigueLevel: 1 | 2 | 3 | 4 | 5;
  soreness: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface WeightEntry {
  dateIso: string;
  weightKg: number;
  bodyFatPercent?: number;
}

export interface RecoverySuggestion {
  type: "rest" | "active_recovery" | "light_workout" | "normal";
  title: string;
  description: string;
  reason: string;
  suggestedActivity?: string;
}

export interface StreakReward {
  streakDays: number;
  title: string;
  description: string;
  coins: number;
  unlocked: boolean;
}

export interface ProgressDashboard {
  fitnessTag: FitnessTag;
  currentLevel: FitnessLevel;
  currentSublevel: FitnessSublevel;
  overallScore: number;
  weeklyCompletionPercent: number;
  streakDays: number;
  totalWorkouts: number;
  totalCaloriesBurned: number;
  weightHistory: WeightEntry[];
  goalProjection: GoalProjection | null;
  macroRequirements: MacroRequirements;
  recoverySuggestion: RecoverySuggestion;
  streakRewards: StreakReward[];
  motivationalMessage: string;
  recentSessions: WorkoutSessionLog[];
  formImprovementTrends: FormTrend[];
}

export interface FormTrend {
  exerciseName: string;
  weeklyAverageCompletion: number[];
  trend: "improving" | "stable" | "declining";
}

// ──────────────────────────────────────────────
// Section 4: Nutrition Engine — Structured Meal Plans
// ──────────────────────────────────────────────

export const MEDICAL_CONDITIONS = [
  "diabetes",
  "hypertension",
  "cardiovascular",
  "thyroid",
  "pcod_pcos",
  "fatty_liver",
  "obesity",
  "kidney_disorder",
  "liver_disorder",
  "poor_gut_health",
  "cancer_support",
  "post_surgery",
] as const;

export type MedicalCondition = (typeof MEDICAL_CONDITIONS)[number];

export const MEDICAL_CONDITION_LABELS: Record<MedicalCondition, string> = {
  diabetes: "Diabetes",
  hypertension: "Hypertension",
  cardiovascular: "Cardiovascular Disease",
  thyroid: "Thyroid",
  pcod_pcos: "PCOD / PCOS",
  fatty_liver: "Fatty Liver",
  obesity: "Obesity",
  kidney_disorder: "Kidney Disorder",
  liver_disorder: "Liver Disorder",
  poor_gut_health: "Indigestion / Poor Gut Health",
  cancer_support: "Cancer Support Diet",
  post_surgery: "Post-Surgery Nutrition",
};

export const ALLERGY_OPTIONS = [
  "gluten",
  "lactose",
  "nuts",
  "soy",
  "eggs",
  "shellfish",
  "fish",
] as const;

export type AllergyType = (typeof ALLERGY_OPTIONS)[number];

export const CUISINE_REGIONS = [
  "north_indian",
  "south_indian",
  "pan_indian",
  "mediterranean",
  "asian",
  "western",
] as const;

export type CuisineRegion = (typeof CUISINE_REGIONS)[number];

export const CUISINE_REGION_LABELS: Record<CuisineRegion, string> = {
  north_indian: "North Indian",
  south_indian: "South Indian",
  pan_indian: "Pan Indian",
  mediterranean: "Mediterranean",
  asian: "Asian",
  western: "Western",
};

export const HEALTH_GOALS = [
  "weight_loss",
  "weight_gain",
  "maintenance",
  "muscle_gain",
] as const;

export type HealthGoal = (typeof HEALTH_GOALS)[number];

export const HEALTH_GOAL_LABELS: Record<HealthGoal, string> = {
  weight_loss: "Weight Loss",
  weight_gain: "Weight Gain",
  maintenance: "Maintenance",
  muscle_gain: "Muscle Gain",
};

export type MealSlot = "breakfast" | "lunch" | "snacks" | "dinner";

export const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "snacks", "dinner"];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

export const MEAL_SLOT_TIMES: Record<MealSlot, string> = {
  breakfast: "07:30",
  lunch: "12:30",
  snacks: "16:00",
  dinner: "20:00",
};

/** Per-ingredient nutrient breakdown (per serving) */
export interface IngredientBreakdown {
  name: string;
  servingDesc: string;
  servingGrams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  vitA: number;
  vitB12: number;
  calcium: number;
  iron: number;
  sodium: number;
  potassium: number;
  omega3: number;
}

/** Aggregated nutrient totals for a meal */
export interface MealNutrientTotals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  vitA: number;
  vitB12: number;
  calcium: number;
  iron: number;
  sodium: number;
  potassium: number;
  omega3: number;
}

/** A single meal with dish name, ingredients, and nutrient breakdown */
export interface StructuredMeal {
  slot: MealSlot;
  time: string;
  dishName: string;
  ingredients: IngredientBreakdown[];
  totals: MealNutrientTotals;
}

/** Full daily meal plan with 4 meals and daily totals */
export interface DailyMealPlan {
  dateIso: string;
  meals: StructuredMeal[];
  dailyTotals: MealNutrientTotals;
  calorieTarget: number;
  healthNotes: string[];
}

/** Extended meal plan request with all senior's requirements */
export interface StructuredMealPlanRequest {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dietaryPreference: DietType;
  cuisinePreferences: CuisineRegion[];
  allergies: AllergyType[];
  healthGoal: HealthGoal;
  medicalConditions: MedicalCondition[];
}

/** Meal reminder configuration */
export interface MealReminder {
  slot: MealSlot;
  time: string;
  enabled: boolean;
}

// ──────────────────────────────────────────────
// Section 5: Mental Wellness Module
// ──────────────────────────────────────────────

// ─── Constants ───────────────────────────────

export const MENTAL_EMOTION_TAGS = [
  "happy", "calm", "anxious", "sad", "angry", "hopeful",
  "grateful", "overwhelmed", "lonely", "scared", "numb", "energized",
] as const;

export const MENTAL_TRIGGER_TAGS = [
  "work", "relationships", "finances", "health", "sleep",
  "loneliness", "grief", "family", "social_media", "news", "other",
] as const;

export const MENTAL_INTERVENTION_TYPES = [
  "breathing", "grounding", "body_scan", "calm_audio", "journal_prompt",
] as const;

export const MENTAL_SUPPORT_MODES = [
  "chat", "audio", "video", "in_person",
] as const;

export const MENTAL_SUPPORT_STATUSES = [
  "pending", "accepted", "scheduled", "in_progress", "completed", "cancelled",
] as const;

export const MENTAL_ALERT_LEVELS = [
  "info", "warning", "critical",
] as const;

export const MENTAL_LEARNING_CATEGORIES = [
  "stress", "sleep", "boundaries", "emotional_regulation",
  "self_worth", "grief", "resilience",
] as const;

export const MENTAL_LEARNING_DIFFICULTIES = [
  "beginner", "intermediate", "advanced",
] as const;

export const MENTAL_LEARNING_TIMES = [
  "morning", "afternoon", "evening", "anytime",
] as const;

export const MENTAL_COMMUNITY_TOPICS = [
  "general", "stress_anxiety", "sleep", "relationships", "work", "recovery",
] as const;

export type ChatRoomVisibility = "public" | "private";

export type EmotionTag = (typeof MENTAL_EMOTION_TAGS)[number];
export type TriggerTag = (typeof MENTAL_TRIGGER_TAGS)[number];
export type InterventionType = (typeof MENTAL_INTERVENTION_TYPES)[number];
export type SupportMode = (typeof MENTAL_SUPPORT_MODES)[number];
export type SupportStatus = (typeof MENTAL_SUPPORT_STATUSES)[number];
export type AlertLevel = (typeof MENTAL_ALERT_LEVELS)[number];
export type LearningCategory = (typeof MENTAL_LEARNING_CATEGORIES)[number];
export type LearningDifficulty = (typeof MENTAL_LEARNING_DIFFICULTIES)[number];
export type LearningTime = (typeof MENTAL_LEARNING_TIMES)[number];
export type CommunityTopicId = (typeof MENTAL_COMMUNITY_TOPICS)[number];

// ─── PHQ-9 & GAD-7 ──────────────────────────

/** PHQ-9: Patient Health Questionnaire — 9 items, each 0-3 */
export const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure",
  "Trouble concentrating on things, such as reading or watching TV",
  "Moving or speaking so slowly that others could have noticed — or the opposite",
  "Thoughts that you would be better off dead, or of hurting yourself",
] as const;

/** GAD-7: Generalized Anxiety Disorder — 7 items, each 0-3 */
export const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
] as const;

export const PHQ_RESPONSE_LABELS = [
  "Not at all", "Several days", "More than half the days", "Nearly every day",
] as const;

export const GAD_RESPONSE_LABELS = PHQ_RESPONSE_LABELS;

/** PHQ-9 severity bands */
export type Phq9Severity = "minimal" | "mild" | "moderate" | "moderately_severe" | "severe";

/** GAD-7 severity bands */
export type Gad7Severity = "minimal" | "mild" | "moderate" | "severe";

// ─── Core Interfaces ─────────────────────────

/** Baseline assessment results from the mental onboarding */
export interface MentalBaseline {
  phq9Score: number;          // 0–27
  phq9Severity: Phq9Severity;
  phq9Answers: number[];      // 9 items, each 0-3
  gad7Score: number;          // 0–21
  gad7Severity: Gad7Severity;
  gad7Answers: number[];      // 7 items, each 0-3
  stressBase: number;         // 1–10
  moodBase: number;           // 1–10
  calmingPreferences: InterventionType[];
  priorTherapy: boolean;
  commonTriggers: TriggerTag[];
}

/** Daily mental check-in snapshot */
export interface MentalDailyCheckIn {
  checkinId: string;
  userId: string;
  dateIso: string;
  moodScore: number;          // 1–10, slider only
  stressScoreManual: number;  // 1–10, manual self-rating
  anxietyScore: number;       // 1–10, slider
  energyScore: number;        // 1–10, slider
  focusScore: number;         // 1–10, slider
  sleepHours: number;         // float
  stressTriggerTags: TriggerTag[];
  copingActionUsed?: InterventionType;
  supportRequested: boolean;
  rppgStressScore?: number;   // 0–100, only after scan
}

/** rPPG camera scan result */
export interface RppgScanResult {
  scanId: string;
  userId: string;
  heartRateBpm: number;
  stressIndex: number;        // 0–100
  signalQuality: number;      // 0.0–1.0
  scanDurationSeconds: number;
  scannedAtIso: string;
}

/** Journal entry for emotional logging */
export interface MentalJournalEntry {
  entryId: string;
  userId: string;
  text: string;
  emotionTags: EmotionTag[];
  triggerTags: TriggerTag[];
  linkedScanId?: string;
  createdAtIso: string;
}

/** A completed coping/intervention session */
export interface CopingSession {
  sessionId: string;
  userId: string;
  interventionType: InterventionType;
  durationSeconds: number;
  completed: boolean;
  completedAtIso: string;
}

/** Request for human counselor/coach support */
export interface SupportRequest {
  requestId: string;
  userId: string;
  issueType: string;
  preferredMode: SupportMode;
  status: SupportStatus;
  sessionType?: string;
  language?: string;
  preferredStyle?: string;
  reason?: string;
  desiredOutcome?: string;
  organizationId?: string;
  organizationName?: string;
  psychologistId?: string;
  psychologistName?: string;
  scheduledForIso?: string;
  acceptedAtIso?: string;
  meetingUrl?: string;
  sessionNotes?: string;
  events?: Array<{
    id: string;
    eventType: string;
    createdAtIso: string;
    actorName?: string | null;
  }>;
  createdAtIso: string;
}

/** Weekly review data — 7-day retrospective */
export interface WeeklyReviewData {
  reviewId: string;
  userId: string;
  trend: WeeklyTrendData;
  newPlanVersion?: MentalWellnessPlan;
  notes?: string;
  reviewDateIso: string;
}

/** 7-day trend snapshot */
export interface WeeklyTrendData {
  moodTrend: number[];        // 7 values (one per day)
  stressTrend: number[];
  sleepTrend: number[];
  anxietyTrend: number[];
  energyTrend: number[];
  focusTrend: number[];
  scanFrequency: number;
  copingSessionsCount: number;
  journalEntriesCount: number;
  escalationEvents: number;
}

/** Learning library content module */
export interface LearningModule {
  moduleId: string;
  title: string;
  description: string;
  category: LearningCategory;
  duration: string;
  difficulty: LearningDifficulty;
  recommendedTimeOfDay: LearningTime;
  content: string;
  order: number;
}

/** User's progress on a learning module */
export interface ContentProgressEntry {
  userId: string;
  moduleId: string;
  progressPercent: number;
  updatedAtIso: string;
}

/** Risk or escalation alert event */
export interface MentalAlertEvent {
  alertId: string;
  userId: string;
  level: AlertLevel;
  reason: string;
  resolvedBy?: string;
  createdAtIso: string;
}

/** Personalized mental wellness plan generated by the rules engine */
export interface MentalWellnessPlan {
  userId: string;
  createdAtIso: string;
  checkinFrequency: "daily" | "twice_daily";
  recommendedInterventions: InterventionType[];
  focusAreas: string[];
  weeklyGoals: string[];
  suggestedModules: string[];
  escalationRisk: AlertLevel;
}

/** The 4-signal composite mental wellness score */
export interface MentalWellnessScore {
  userId: string;
  compositeScore: number;       // 0–100
  baselineComponent: number;    // 0–100 (weighted 35%)
  dailyComponent: number;       // 0–100 (weighted 25%)
  rppgComponent: number;        // 0–100 (weighted 20%)
  engagementComponent: number;  // 0–100 (weighted 20%)
  calculatedAtIso: string;
}

/** Community chatroom (local-first, AsyncStorage-backed) */
export interface ChatRoom {
  roomId: string;
  name: string;
  description: string;
  keywords: string[];
  icon: string;
  visibility: ChatRoomVisibility;
  createdBy: string;
  createdByName: string;
  createdAtIso: string;
  memberCount: number;
  /** Only for private rooms — list of invited user IDs */
  invitedUserIds: string[];
  lastActivityIso: string;
}

/** Community post within a chatroom */
export interface CommunityPost {
  postId: string;
  roomId: string;
  authorId: string;
  isAnonymous: boolean;
  displayName: string;
  content: string;
  createdAtIso: string;
  reportCount: number;
  isHidden: boolean;
}

/** @deprecated — Use ChatRoom instead */
export interface CommunityTopic {
  topicId: CommunityTopicId;
  name: string;
  description: string;
  icon: string;
}

/** Trend direction for check-in analysis */
export type TrendDirection = "improving" | "stable" | "declining";

/** Single-field trend analysis result */
export interface FieldTrend {
  field: string;
  values: number[];
  average: number;
  direction: TrendDirection;
  changePercent: number;
}

/** Complete trend analysis for a time window */
export interface TrendAnalysis {
  userId: string;
  windowDays: number;
  fields: FieldTrend[];
  topTriggers: { tag: TriggerTag; count: number }[];
  topCopingActions: { action: InterventionType; count: number }[];
  analysisDateIso: string;
}

/** Input for the plan generator engine */
export interface PlanGeneratorInput {
  baseline: MentalBaseline;
  recentCheckIns: MentalDailyCheckIn[];
  recentScans: RppgScanResult[];
  copingSessions: CopingSession[];
  journalEntries: MentalJournalEntry[];
  contentProgress: ContentProgressEntry[];
}

/** Recommended intervention with reasoning */
export interface InterventionRecommendation {
  type: InterventionType;
  title: string;
  description: string;
  durationMinutes: number;
  priority: number;            // 1 = highest
  reason: string;
}

/** Signal weights for the composite scoring model */
export const MENTAL_SCORE_WEIGHTS = {
  baseline: 0.35,
  daily: 0.25,
  rppg: 0.20,
  engagement: 0.20,
} as const;

// ──────────────────────────────────────────────
// Section 6: Spiritual / Inner Calm Module
// ──────────────────────────────────────────────

export type {
  SpiritualDomain,
  SpiritualBand,
  SpiritualFeelingTag,
  SpiritualBlockerTag,
  SpiritualPracticeType,
  SpiritualContentCategory,
  SpiritualQuestion,
  SpiritualBaseline,
  SpiritualDailyCheckIn,
  SpiritualPracticeSession,
  SpiritualJournalEntry,
  SpiritualWeeklyReview,
  SpiritualWellnessPlan,
  SpiritualCoachMessage,
  SpiritualScoreRun,
  SpiritualTrendDirection,
  SpiritualTrendData,
  SpiritualAlert,
} from "./spiritual";

export {
  SPIRITUAL_FEELING_TAGS,
  SPIRITUAL_BLOCKER_TAGS,
  SPIRITUAL_PRACTICE_TYPES,
  SPIRITUAL_CONTENT_CATEGORIES,
  SPIRITUAL_DOMAIN_WEIGHTS,
  SPIRITUAL_SCORE_WEIGHTS,
} from "./spiritual";

// ──────────────────────────────────────────────
// Section 7: Lifestyle / Daily Wellness Module
// ──────────────────────────────────────────────

export type {
  LifestyleDomain,
  LifestyleBand,
  LifestyleBlockerTag,
  RoutineType,
  DrinkType,
  MovementBreakType,
  LifestyleQuestion,
  LifestyleBaseline,
  LifestyleDailyCheckIn,
  LifestyleWeeklyReview,
  LifestyleMonthlyReview,
  LifestyleGoals,
  LifestyleWellnessPlan,
  LifestyleCoachMessage,
  LifestyleScoreRun,
  SleepLog,
  MealLog,
  HydrationLog,
  MovementLog,
  DigitalBalanceLog,
  NatureLog,
  RoutineCompletion,
} from "./lifestyle";

export {
  LIFESTYLE_DOMAINS,
  LIFESTYLE_DOMAIN_LABELS,
  LIFESTYLE_DOMAIN_ICONS,
  LIFESTYLE_SCORE_WEIGHTS,
  LIFESTYLE_BLOCKER_TAGS,
  DRINK_TYPES,
  MOVEMENT_BREAK_TYPES,
} from "./lifestyle";
