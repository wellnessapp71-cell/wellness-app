import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure default notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions. Call on first toggle, not at startup.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("plans", {
      name: "Plan Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  return status === "granted";
}

/**
 * Schedule weekly workout reminders based on plan days.
 */
export async function scheduleWorkoutReminders(
  plannedDays: string[],
  sessionMinutes: number = 45,
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  // Cancel existing workout reminders first
  await cancelPlanReminders("workout");

  const dayMap: Record<string, number> = {
    sunday: 1,
    monday: 2,
    tuesday: 3,
    wednesday: 4,
    thursday: 5,
    friday: 6,
    saturday: 7,
  };

  for (const day of plannedDays) {
    const weekday = dayMap[day];
    if (!weekday) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to work out! 💪",
        body: `Your ${sessionMinutes}-min ${day} session is waiting. Let's crush it!`,
        data: { type: "workout_reminder", day },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: 8,
        minute: 0,
      },
      identifier: `workout_${day}`,
    });
  }
}

export interface MealReminderConfig {
  slot: string;
  time: string; // "HH:mm"
  enabled: boolean;
}

/**
 * Schedule daily meal reminders at configured times.
 */
export async function scheduleMealReminders(
  reminders: MealReminderConfig[],
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  await cancelPlanReminders("meal");

  const slotLabels: Record<string, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    snacks: "Snack",
    dinner: "Dinner",
  };

  for (const rem of reminders) {
    if (!rem.enabled) continue;
    const [h, m] = rem.time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${slotLabels[rem.slot] ?? rem.slot} time! 🍽️`,
        body: "Don't skip your meal — your nutrition plan is counting on you.",
        data: { type: "meal_reminder", slot: rem.slot },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: m,
      },
      identifier: `meal_${rem.slot}`,
    });
  }
}

/**
 * Schedule a nudge for when user misses a planned workout day.
 * Fires at 8pm on planned days as a "did you work out?" check.
 */
export async function scheduleMissedPlanNudge(
  plannedDays: string[],
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  const dayMap: Record<string, number> = {
    sunday: 1,
    monday: 2,
    tuesday: 3,
    wednesday: 4,
    thursday: 5,
    friday: 6,
    saturday: 7,
  };

  for (const day of plannedDays) {
    const weekday = dayMap[day];
    if (!weekday) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Missed your workout? 🤔",
        body: "It's not too late! Even a short session keeps your streak alive.",
        data: { type: "missed_workout_nudge", day },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: 20,
        minute: 0,
      },
      identifier: `nudge_${day}`,
    });
  }
}

/**
 * Cancel all scheduled reminders for a given prefix (workout, meal, nudge).
 */
export async function cancelPlanReminders(
  prefix: "workout" | "meal" | "nudge" | "all" = "all",
): Promise<void> {
  if (prefix === "all") {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith(`${prefix}_`)) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}
