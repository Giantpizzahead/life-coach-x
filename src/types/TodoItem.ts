export const CompletionTier = {
  UNSELECTED: "unselected",
  NONE: "none",
  MINIMUM: "minimum",
  FULL: "full",
  BONUS: "bonus",
} as const;

export type CompletionTier =
  (typeof CompletionTier)[keyof typeof CompletionTier];

export interface TodoItem {
  id: string;
  name: string;
  description: string;
  section: string;
  hpValues: {
    none: number; // HP for not completing (can be negative)
    minimum: number | null; // null if no minimum tier
    full: number;
    bonus: number | null; // null if no bonus tier
  };
  recurrence: {
    type: "daily" | "weekly" | "monthly";
    daysOfWeek?: number[]; // For weekly: array of days, 0 = Sunday, 1 = Monday, etc.
    daysOfMonth?: number[]; // For monthly: array of days, 1-31
  };
  completionTier: CompletionTier;
  history: {
    date: Date;
    tier: CompletionTier;
  }[];
}

export interface TodoSection {
  name: string;
  order: number;
}

export interface HpHistoryEntry {
  date: Date;
  hp: number; // The actual HP value at this point
  reason: string; // e.g., "Starting HP", "Daily reset", "Manual adjustment", "Task completion"
}

export interface AppState {
  version: number; // App state version for backwards compatibility
  hp: number;
  todos: TodoItem[];
  sections: TodoSection[];
  lastResetDate: Date; // Tracks when tasks were last reset
  hpHistory: HpHistoryEntry[]; // Track HP values over time
}
