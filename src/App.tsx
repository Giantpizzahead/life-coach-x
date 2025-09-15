import { useState, useEffect } from "react";
import type { AppState, TodoItem } from "./types/TodoItem";
import { CompletionTier } from "./types/TodoItem";
import TodoItemComponent from "./components/TodoItem";
import {
  loadAppState,
  saveAppState,
  updateTodoCompletion,
  calculateDailyHpChange,
  shouldResetTasks,
  resetDailyTodos,
} from "./utils/todoUtils";
import {
  loadAppStateFromFirestore,
  saveAppStateToFirestore,
  subscribeToAppState,
} from "./firebase/firestoreService";
import { onAuthStateChange } from "./firebase/authService";
import AuthButton from "./components/AuthButton";
import tasksConfig from "./config/tasks.json";
import "./App.css";

function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [hpAdjustment, setHpAdjustment] = useState("");
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication and app state
  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeFirestore: (() => void) | undefined;

    const initializeApp = async (user: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      try {
        if (user) {
          // Set global userId for Firestore service
          (window as any).userId = user.uid; // eslint-disable-line @typescript-eslint/no-explicit-any

          // Try to load from Firestore first
          const saved = await loadAppStateFromFirestore();

          if (saved) {
            // Check if tasks need to be reset
            if (shouldResetTasks(saved.lastResetDate)) {
              const resetTodos = resetDailyTodos(saved.todos);
              const newState = {
                ...saved,
                todos: resetTodos,
                lastResetDate: new Date(),
              };
              setAppState(newState);
              await saveAppStateToFirestore(newState);
            } else {
              setAppState(saved);
            }
          } else {
            // Initialize with config data
            const today = new Date();
            const initialTodos: TodoItem[] = tasksConfig.tasks.map((task) => ({
              ...task,
              completionTier: CompletionTier.NONE,
              history: [],
              recurrence: {
                type: task.recurrence.type as "daily" | "weekly",
                dayOfWeek: task.recurrence.dayOfWeek,
              },
            }));

            const initialState: AppState = {
              hp: 1000, // Starting HP ($10.00)
              todos: initialTodos,
              sections: tasksConfig.sections,
              lastResetDate: today,
            };

            setAppState(initialState);
            await saveAppStateToFirestore(initialState);
          }

          // Set up real-time listener
          unsubscribeFirestore = subscribeToAppState((state) => {
            if (state) {
              setAppState(state);
            }
          });
        } else {
          // No user signed in, fallback to localStorage
          const saved = loadAppState();
          if (saved) {
            setAppState(saved);
          }
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        // Fallback to localStorage if Firestore fails
        const saved = loadAppState();
        if (saved) {
          setAppState(saved);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Listen to auth state changes
    // eslint-disable-next-line prefer-const
    unsubscribeAuth = onAuthStateChange(async (user) => {
      setUser(user);
      await initializeApp(user);
    });

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  // Save state to Firestore whenever it changes
  useEffect(() => {
    if (appState) {
      saveAppStateToFirestore(appState).catch((error) => {
        console.error("Error saving to Firestore:", error);
        // Fallback to localStorage
        saveAppState(appState);
      });
    }
  }, [appState]);

  const handleTodoCompletion = (id: string, tier: CompletionTier) => {
    if (!appState) return;

    const updatedTodos = updateTodoCompletion(appState.todos, id, tier);

    setAppState({
      ...appState,
      todos: updatedTodos,
      // HP only updates at end of day, not immediately
    });
  };

  const handleHpAdjustment = () => {
    if (!appState) return;

    const adjustment = parseInt(hpAdjustment);
    if (!isNaN(adjustment)) {
      setAppState({
        ...appState,
        hp: appState.hp + adjustment,
      });
      setHpAdjustment("");
    }
  };

  const handleEndOfDayReset = () => {
    if (!appState) return;

    // Calculate HP change for today
    const hpChange = calculateDailyHpChange(appState.todos);

    // Reset all tasks to NONE
    const resetTodos = resetDailyTodos(appState.todos);

    // Update HP and reset date
    const newState = {
      ...appState,
      hp: appState.hp + hpChange,
      todos: resetTodos,
      lastResetDate: new Date(),
    };

    setAppState(newState);
    saveAppState(newState);
  };

  const handleClearStorage = () => {
    localStorage.removeItem("life-coach-app-state");
    window.location.reload();
  };

  const getTodosBySection = (sectionName: string) => {
    if (!appState) return [];
    return appState.todos.filter((todo) => todo.section === sectionName);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!appState) {
    return <div className="loading">Loading...</div>;
  }

  const todayHpChange = calculateDailyHpChange(appState.todos);

  return (
    <div className="app">
      <AuthButton user={user} onUserChange={setUser} />

      <header className="app-header">
        <h1>Life Helper</h1>
        <div className="hp-display">
          <div className="current-hp">
            <span className="hp-label">HP:</span>
            <span
              className={`hp-value ${
                appState.hp < 0 ? "negative" : "positive"
              }`}>
              {appState.hp < 0 ? "-" : ""}$
              {Math.abs(appState.hp / 100).toFixed(2)}
            </span>
          </div>
          {todayHpChange !== 0 && (
            <div className="today-change">
              <span className="hp-label">Today:</span>
              <span
                className={`hp-change ${
                  todayHpChange > 0 ? "positive" : "negative"
                }`}>
                {todayHpChange > 0 ? "+" : "-"}$
                {Math.abs(todayHpChange / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="sections">
        {appState.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            const sectionTodos = getTodosBySection(section.name);
            if (sectionTodos.length === 0) return null;

            return (
              <div key={section.name} className="section">
                <h2 className="section-title">{section.name}</h2>
                <div className="todos">
                  {sectionTodos.map((todo) => (
                    <TodoItemComponent
                      key={todo.id}
                      todo={todo}
                      onCompletionChange={handleTodoCompletion}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      <div className="hp-adjustment">
        <input
          type="number"
          value={hpAdjustment}
          onChange={(e) => setHpAdjustment(e.target.value)}
          placeholder="HP adjustment"
        />
        <button onClick={handleHpAdjustment}>Adjust HP</button>
      </div>

      {/* Debug Buttons */}
      <div className="debug-section">
        <h3>Debug Tools</h3>
        <div className="debug-buttons">
          <button
            className="debug-button reset-button"
            onClick={handleEndOfDayReset}>
            End of Day Reset
          </button>
          <button
            className="debug-button clear-button"
            onClick={handleClearStorage}>
            Clear Storage & Reload
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
