export const CompletionTier = {
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
    type: "daily" | "weekly";
    dayOfWeek?: number; // For weekly: 0 = Sunday, 1 = Monday, etc.
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

export interface AppState {
  hp: number;
  todos: TodoItem[];
  sections: TodoSection[];
  lastResetDate: Date; // Tracks when tasks were last reset
}
