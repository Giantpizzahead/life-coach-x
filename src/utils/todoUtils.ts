import type { TodoItem, AppState } from "../types/TodoItem";
import { CompletionTier } from "../types/TodoItem";

export const calculateHpForTier = (
  todo: TodoItem,
  tier: CompletionTier
): number => {
  switch (tier) {
    case CompletionTier.NONE:
      return todo.hpValues.none;
    case CompletionTier.MINIMUM:
      return todo.hpValues.minimum || 0;
    case CompletionTier.FULL:
      return todo.hpValues.full;
    case CompletionTier.BONUS:
      return todo.hpValues.bonus || 0;
  }
};

export const isTaskRequiredToday = (todo: TodoItem): boolean => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  switch (todo.recurrence.type) {
    case "daily":
      return true;
    case "weekly":
      return todo.recurrence.dayOfWeek === dayOfWeek;
    default:
      return false;
  }
};

export const updateTodoCompletion = (
  todos: TodoItem[],
  id: string,
  tier: CompletionTier
): TodoItem[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day for comparison

  return todos.map((todo) =>
    todo.id === id
      ? {
          ...todo,
          completionTier: tier,
          history: [
            ...todo.history.filter(
              (entry) => entry.date.getTime() !== today.getTime()
            ), // Remove today's entry if exists
            { date: new Date(today), tier }, // Add new entry for today
          ],
        }
      : todo
  );
};

export const calculateDailyHpChange = (todos: TodoItem[]): number => {
  return todos.reduce((total, todo) => {
    if (!isTaskRequiredToday(todo)) return total;
    return total + calculateHpForTier(todo, todo.completionTier);
  }, 0);
};

export const shouldResetTasks = (lastResetDate: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastResetDate.setHours(0, 0, 0, 0);
  return lastResetDate.getTime() !== today.getTime();
};

export const resetDailyTodos = (todos: TodoItem[]): TodoItem[] => {
  return todos.map((todo) => ({
    ...todo,
    completionTier: CompletionTier.NONE,
  }));
};

export const loadAppState = (): AppState | null => {
  try {
    const saved = localStorage.getItem("life-coach-app-state");
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    // Convert date strings back to Date objects
    parsed.lastResetDate = new Date(parsed.lastResetDate);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed.todos = parsed.todos.map((todo: any) => ({
      ...todo,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history: todo.history.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
      })),
    }));

    return parsed;
  } catch (error) {
    console.error("Failed to load app state:", error);
    return null;
  }
};

export const saveAppState = (state: AppState): void => {
  try {
    // Convert Date objects to strings for JSON serialization
    const serializable = {
      ...state,
      lastResetDate: state.lastResetDate.toISOString(),
      todos: state.todos.map((todo) => ({
        ...todo,
        history: todo.history.map((entry) => ({
          ...entry,
          date: entry.date.toISOString(),
        })),
      })),
    };

    localStorage.setItem("life-coach-app-state", JSON.stringify(serializable));
  } catch (error) {
    console.error("Failed to save app state:", error);
  }
};
