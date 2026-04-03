/*
  Warnings:

  - You are about to drop the column `goals` on the `profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `height_cm` on table `profiles` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `referral_code` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('employee', 'hr', 'admin', 'psychologist');

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "goals",
ADD COLUMN     "alcohol_frequency" INTEGER,
ADD COLUMN     "allergies" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "body_shape" TEXT,
ADD COLUMN     "burpees" INTEGER,
ADD COLUMN     "diet_type" TEXT,
ADD COLUMN     "exercise_days_per_week" INTEGER,
ADD COLUMN     "fitness_score" INTEGER,
ADD COLUMN     "has_gym_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "has_home_equipment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lifestyle_onboarding_done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medical_conditions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "mental_onboarding_done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "physical_onboarding_done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plank_seconds" INTEGER,
ADD COLUMN     "pull_ups" INTEGER,
ADD COLUMN     "push_ups" INTEGER,
ADD COLUMN     "score_lifestyle" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "score_mental" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "score_physical" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "score_spiritual" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "screen_hours" DOUBLE PRECISION,
ADD COLUMN     "sleep_hours" DOUBLE PRECISION,
ADD COLUMN     "spiritual_answers" JSONB,
ADD COLUMN     "spiritual_onboarding_done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "squats" INTEGER,
ADD COLUMN     "streak_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tobacco" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "total_calories_burned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_workouts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "water_glasses_per_day" INTEGER,
ALTER COLUMN "height_cm" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "consent_state" JSONB,
ADD COLUMN     "referral_code" TEXT NOT NULL,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'employee',
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "mental_baselines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phq9" INTEGER NOT NULL,
    "gad7" INTEGER NOT NULL,
    "stress_base" INTEGER NOT NULL,
    "mood_base" INTEGER NOT NULL,
    "raw_answers" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mental_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_checkins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mood" INTEGER NOT NULL,
    "stress_manual" INTEGER NOT NULL,
    "anxiety" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "focus" INTEGER NOT NULL,
    "sleep" DOUBLE PRECISION NOT NULL,
    "stress_triggers" JSONB,
    "coping_action" TEXT,
    "support_req" BOOLEAN NOT NULL DEFAULT false,
    "checkin_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rppg_scans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "heart_rate" INTEGER NOT NULL,
    "stress_index" INTEGER NOT NULL,
    "signal_quality" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rppg_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "emotion_tags" JSONB NOT NULL,
    "trigger_tags" JSONB NOT NULL,
    "linked_scan_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coping_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "intervention_type" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "completion" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coping_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "issue_type" TEXT NOT NULL,
    "preferred_mode" TEXT NOT NULL,
    "language" TEXT,
    "style" TEXT,
    "reason" TEXT,
    "outcome" TEXT,
    "session_type" TEXT NOT NULL DEFAULT 'text_chat',
    "psychologist_id" TEXT,
    "scheduled_for" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "meeting_url" TEXT,
    "session_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trend" JSONB NOT NULL,
    "new_plan_version" JSONB,
    "notes" TEXT,
    "review_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "progress_percent" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spiritual_baselines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meaning_score" INTEGER NOT NULL,
    "peace_score" INTEGER NOT NULL,
    "mindfulness_score" INTEGER NOT NULL,
    "connection_score" INTEGER NOT NULL,
    "practice_score" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "weakest_domain" TEXT NOT NULL,
    "preferred_practice_time" TEXT,
    "preferred_support_style" TEXT,
    "raw_answers" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spiritual_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spiritual_checkins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "calm_score" INTEGER NOT NULL,
    "did_practice" BOOLEAN NOT NULL,
    "felt_connected" TEXT NOT NULL,
    "nature_reflection_helped" TEXT NOT NULL,
    "blockers" JSONB NOT NULL DEFAULT '[]',
    "feelings" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spiritual_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spiritual_practice_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content_id" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spiritual_practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spiritual_journal_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prompt_type" TEXT NOT NULL,
    "mood_tag" TEXT,
    "gratitude_text" TEXT,
    "reflection_text" TEXT,
    "what_brought_calm" TEXT,
    "what_triggered_discomfort" TEXT,
    "what_helped" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spiritual_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spiritual_weekly_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" TEXT NOT NULL,
    "week_end" TEXT NOT NULL,
    "calm_score_change" INTEGER NOT NULL,
    "engagement_summary" TEXT,
    "suggested_next_actions" JSONB,
    "review_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spiritual_weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spiritual_plan_versions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_json" JSONB NOT NULL,
    "reason_code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spiritual_plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifestyle_baselines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sleep_score" INTEGER NOT NULL,
    "nutrition_score" INTEGER NOT NULL,
    "hydration_score" INTEGER NOT NULL,
    "movement_score" INTEGER NOT NULL,
    "digital_score" INTEGER NOT NULL,
    "nature_score" INTEGER NOT NULL,
    "routine_score" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "weakest_domain" TEXT NOT NULL,
    "raw_answers" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifestyle_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifestyle_checkins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "sleep_hours" DOUBLE PRECISION NOT NULL,
    "sleep_quality" INTEGER NOT NULL,
    "meals_eaten" INTEGER,
    "fruit_servings" INTEGER,
    "veg_servings" INTEGER,
    "fruit_veg_servings" INTEGER,
    "protein_fiber_meals" INTEGER,
    "ultra_processed_servings" INTEGER,
    "sugary_servings" INTEGER,
    "late_eating_count" INTEGER,
    "stress_eating" TEXT,
    "water_ml" INTEGER NOT NULL,
    "water_before_noon" INTEGER,
    "hydration_span_hours" INTEGER,
    "met_water_goal" TEXT,
    "active_minutes" INTEGER,
    "movement_breaks" INTEGER,
    "strength_or_yoga" BOOLEAN,
    "sitting_minutes_max" INTEGER,
    "strength_yoga_done" TEXT,
    "screen_minutes_non_work" INTEGER,
    "screen_hours_non_work" DOUBLE PRECISION,
    "bedtime_screen_minutes" INTEGER,
    "notifications_after_8pm" INTEGER,
    "used_focus_mode" TEXT,
    "outdoor_minutes" INTEGER,
    "morning_daylight_minutes" INTEGER,
    "got_outdoors" BOOLEAN,
    "morning_routine_done" TEXT,
    "evening_routine_done" TEXT,
    "same_wake_time_days" INTEGER,
    "routine_completion" TEXT,
    "blockers" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifestyle_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifestyle_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "daily_anchor_habit" TEXT NOT NULL,
    "recovery_habit" TEXT NOT NULL,
    "weekly_goal" TEXT NOT NULL,
    "trend_insight" TEXT,
    "best_next_action" TEXT NOT NULL,
    "follow_up_time" TEXT NOT NULL,
    "expert_recommendation" TEXT,
    "focus_domain" TEXT NOT NULL,
    "support_domain" TEXT,
    "band" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifestyle_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifestyle_score_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sleep_score" INTEGER NOT NULL,
    "nutrition_score" INTEGER NOT NULL,
    "hydration_score" INTEGER NOT NULL,
    "movement_score" INTEGER NOT NULL,
    "digital_score" INTEGER NOT NULL,
    "nature_score" INTEGER NOT NULL,
    "routine_score" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifestyle_score_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifestyle_weekly_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" TEXT NOT NULL,
    "week_end" TEXT NOT NULL,
    "good_sleep_days" INTEGER NOT NULL,
    "hydration_target_days" INTEGER NOT NULL,
    "meal_log_days" INTEGER NOT NULL,
    "balanced_meal_days" INTEGER,
    "movement_days" INTEGER NOT NULL,
    "moderate_activity_days" INTEGER,
    "strength_yoga_days" INTEGER,
    "screen_interference_days" INTEGER NOT NULL,
    "screen_under_limit_days" INTEGER,
    "outdoor_days" INTEGER NOT NULL,
    "routine_days" INTEGER,
    "helped_most_habit" TEXT,
    "blocked_most_habit" TEXT,
    "score_change" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifestyle_weekly_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifestyle_monthly_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "sleep_improved" BOOLEAN NOT NULL,
    "meal_quality_improved" BOOLEAN NOT NULL,
    "hydration_improved" BOOLEAN NOT NULL,
    "movement_improved" BOOLEAN NOT NULL,
    "screen_balance_improved" BOOLEAN NOT NULL,
    "nature_improved" BOOLEAN NOT NULL,
    "routine_improved" BOOLEAN NOT NULL,
    "most_improved_domain" TEXT,
    "worst_domain" TEXT,
    "plan_preference" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifestyle_monthly_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "referral_code" TEXT NOT NULL,
    "industry" TEXT,
    "company_size" INTEGER,
    "website" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "membership_role" TEXT NOT NULL DEFAULT 'employee',
    "employee_code" TEXT,
    "department" TEXT,
    "title" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "phone" TEXT,
    "onboarding_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "psychologist_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "specialties" JSONB NOT NULL DEFAULT '[]',
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "education" TEXT NOT NULL,
    "bio" TEXT,
    "languages" JSONB NOT NULL DEFAULT '[]',
    "session_modes" JSONB NOT NULL DEFAULT '[]',
    "availability" JSONB,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "psychologist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinar_notifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "delivery_status" TEXT NOT NULL DEFAULT 'scheduled',
    "audience" TEXT NOT NULL DEFAULT 'all',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webinar_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_events" (
    "id" TEXT NOT NULL,
    "support_request_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mental_baselines_user_id_idx" ON "mental_baselines"("user_id");

-- CreateIndex
CREATE INDEX "daily_checkins_user_id_checkin_date_idx" ON "daily_checkins"("user_id", "checkin_date");

-- CreateIndex
CREATE INDEX "rppg_scans_user_id_idx" ON "rppg_scans"("user_id");

-- CreateIndex
CREATE INDEX "journal_entries_user_id_idx" ON "journal_entries"("user_id");

-- CreateIndex
CREATE INDEX "coping_sessions_user_id_idx" ON "coping_sessions"("user_id");

-- CreateIndex
CREATE INDEX "support_requests_user_id_idx" ON "support_requests"("user_id");

-- CreateIndex
CREATE INDEX "support_requests_organization_id_status_idx" ON "support_requests"("organization_id", "status");

-- CreateIndex
CREATE INDEX "support_requests_psychologist_id_status_idx" ON "support_requests"("psychologist_id", "status");

-- CreateIndex
CREATE INDEX "weekly_reviews_user_id_idx" ON "weekly_reviews"("user_id");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_progress_user_id_module_key" ON "content_progress"("user_id", "module");

-- CreateIndex
CREATE UNIQUE INDEX "spiritual_checkins_user_id_date_key" ON "spiritual_checkins"("user_id", "date");

-- CreateIndex
CREATE INDEX "lifestyle_baselines_user_id_idx" ON "lifestyle_baselines"("user_id");

-- CreateIndex
CREATE INDEX "lifestyle_checkins_user_id_date_idx" ON "lifestyle_checkins"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "lifestyle_checkins_user_id_date_key" ON "lifestyle_checkins"("user_id", "date");

-- CreateIndex
CREATE INDEX "lifestyle_plans_user_id_idx" ON "lifestyle_plans"("user_id");

-- CreateIndex
CREATE INDEX "lifestyle_score_runs_user_id_created_at_idx" ON "lifestyle_score_runs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "lifestyle_weekly_reviews_user_id_idx" ON "lifestyle_weekly_reviews"("user_id");

-- CreateIndex
CREATE INDEX "lifestyle_monthly_reviews_user_id_idx" ON "lifestyle_monthly_reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_referral_code_key" ON "organizations"("referral_code");

-- CreateIndex
CREATE INDEX "organization_memberships_organization_id_membership_role_idx" ON "organization_memberships"("organization_id", "membership_role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_user_id_organization_id_key" ON "organization_memberships"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_profiles_user_id_key" ON "hr_profiles"("user_id");

-- CreateIndex
CREATE INDEX "hr_profiles_organization_id_idx" ON "hr_profiles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "psychologist_profiles_user_id_key" ON "psychologist_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "psychologist_profiles_license_number_key" ON "psychologist_profiles"("license_number");

-- CreateIndex
CREATE INDEX "webinar_notifications_organization_id_scheduled_for_idx" ON "webinar_notifications"("organization_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "session_events_support_request_id_created_at_idx" ON "session_events"("support_request_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "mental_baselines" ADD CONSTRAINT "mental_baselines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rppg_scans" ADD CONSTRAINT "rppg_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coping_sessions" ADD CONSTRAINT "coping_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_progress" ADD CONSTRAINT "content_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spiritual_baselines" ADD CONSTRAINT "spiritual_baselines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spiritual_checkins" ADD CONSTRAINT "spiritual_checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spiritual_practice_sessions" ADD CONSTRAINT "spiritual_practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spiritual_journal_entries" ADD CONSTRAINT "spiritual_journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spiritual_weekly_reports" ADD CONSTRAINT "spiritual_weekly_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spiritual_plan_versions" ADD CONSTRAINT "spiritual_plan_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_baselines" ADD CONSTRAINT "lifestyle_baselines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_checkins" ADD CONSTRAINT "lifestyle_checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_plans" ADD CONSTRAINT "lifestyle_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_score_runs" ADD CONSTRAINT "lifestyle_score_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_weekly_reviews" ADD CONSTRAINT "lifestyle_weekly_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_monthly_reviews" ADD CONSTRAINT "lifestyle_monthly_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_profiles" ADD CONSTRAINT "hr_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_profiles" ADD CONSTRAINT "hr_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "psychologist_profiles" ADD CONSTRAINT "psychologist_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_notifications" ADD CONSTRAINT "webinar_notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_notifications" ADD CONSTRAINT "webinar_notifications_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_events" ADD CONSTRAINT "session_events_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_events" ADD CONSTRAINT "session_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
