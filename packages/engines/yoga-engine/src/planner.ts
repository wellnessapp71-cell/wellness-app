import type { FitnessLevel, GoalType, YogaPlan, YogaPose, YogaProfile, YogaSession } from "@aura/types";
import { YOGA_GOAL_FOCUS, YOGA_GOALS_BY_LEVEL, YOGA_POSE_LIBRARY } from "./poses";

export function buildYogaPlan(
  profile: YogaProfile,
  options?: { sessionMinutes?: number; createdAtIso?: string; seed?: string },
): YogaPlan {
  const level = profile.fitnessLevel in YOGA_POSE_LIBRARY ? profile.fitnessLevel : "beginner";
  const createdAtIso = options?.createdAtIso ?? new Date().toISOString();
  const sessionMinutes = options?.sessionMinutes ?? 30;
  const sessions = {
    monday: createDailySession(level, sessionMinutes, profile.goals, `${profile.userId}:monday:${options?.seed ?? "default"}`),
    tuesday: createDailySession(level, sessionMinutes, profile.goals, `${profile.userId}:tuesday:${options?.seed ?? "default"}`),
    wednesday: createDailySession(level, sessionMinutes, profile.goals, `${profile.userId}:wednesday:${options?.seed ?? "default"}`),
    thursday: createDailySession(level, sessionMinutes, profile.goals, `${profile.userId}:thursday:${options?.seed ?? "default"}`),
    friday: createDailySession(level, sessionMinutes, profile.goals, `${profile.userId}:friday:${options?.seed ?? "default"}`),
    saturday: createDailySession(level, sessionMinutes, profile.goals, `${profile.userId}:saturday:${options?.seed ?? "default"}`),
  };

  return {
    userId: profile.userId,
    createdAtIso,
    level,
    sessions,
  };
}

export function createDailySession(
  level: FitnessLevel,
  sessionMinutes: number,
  goals: GoalType[],
  seed: string,
): YogaSession {
  const library = YOGA_POSE_LIBRARY[level] ?? YOGA_POSE_LIBRARY.beginner;
  const warmUpTime = Math.max(5, Math.floor(sessionMinutes / 6));
  const coolDownTime = Math.max(5, Math.floor(sessionMinutes / 6));
  const mainPracticeTime = Math.max(5, sessionMinutes - warmUpTime - coolDownTime);

  const warmUp = fillTimedBlock(stableSort(library.warmUp, `${seed}:warmup`), warmUpTime * 60);
  const coolDown = fillTimedBlock(stableSort(library.coolDown, `${seed}:cooldown`), coolDownTime * 60);
  const mainPool = stableSort([...library.standing, ...library.floor], `${seed}:main`);
  const mainPractice = fillTimedBlock(mainPool, mainPracticeTime * 60);

  const focus = goals
    .map((goal) => YOGA_GOAL_FOCUS[goal])
    .filter((value): value is string => typeof value === "string");

  return {
    durationMinutes: sessionMinutes,
    warmUp,
    mainPractice,
    coolDown,
    focus: focus.length > 0 ? focus : ["General Wellness"],
  };
}

export function getYogaGoalRecommendations(level: FitnessLevel): Partial<Record<GoalType, string[]>> {
  const result: Partial<Record<GoalType, string[]>> = {};
  for (const [goal, mappings] of Object.entries(YOGA_GOALS_BY_LEVEL)) {
    const poses = mappings[level];
    if (poses) {
      result[goal as GoalType] = poses;
    }
  }
  return result;
}

function fillTimedBlock(poses: YogaPose[], limitSeconds: number): YogaPose[] {
  const block: YogaPose[] = [];
  let usedSeconds = 0;

  for (const pose of poses) {
    const poseSeconds = pose.durationSeconds ?? (pose.repetitions ? 60 : 30);
    if (usedSeconds + poseSeconds <= limitSeconds) {
      block.push(pose);
      usedSeconds += poseSeconds;
    }
  }

  return block;
}

function stableSort<T extends { name: string }>(items: T[], seed: string): T[] {
  return [...items].sort((left, right) => hash(`${seed}:${left.name}`) - hash(`${seed}:${right.name}`));
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}
