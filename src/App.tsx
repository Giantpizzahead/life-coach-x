import { useState, useEffect } from "react";
import type { AppState, TodoItem } from "./types/TodoItem";
import { CompletionTier } from "./types/TodoItem";
import TodoItemComponent from "./components/TodoItem";
import StatusIndicator from "./components/StatusIndicator";
import {
  updateTodoCompletion,
  calculateDailyHpChange,
  shouldResetTasks,
  resetDailyTodos,
} from "./utils/todoUtils";
import { useDataSync } from "./hooks/useDataSync";
import { useAuth } from "./contexts/AuthContext";
import tasksConfig from "./config/tasks.json";
import "./App.css";

function App() {
  const { user } = useAuth();
  const { appState, saveMethod, isLoading, error, updateAppState } =
    useDataSync(user);
  const [hpAdjustment, setHpAdjustment] = useState("");

  // Initialize app state if none exists
  useEffect(() => {
    if (!appState && !isLoading) {
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

      updateAppState(initialState);
    }
  }, [appState, isLoading, updateAppState]);

  // Check if tasks need to be reset
  useEffect(() => {
    if (appState && shouldResetTasks(appState.lastResetDate)) {
      const resetTodos = resetDailyTodos(appState.todos);
      const newState = {
        ...appState,
        todos: resetTodos,
        lastResetDate: new Date(),
      };
      updateAppState(newState);
    }
  }, [appState, updateAppState]);

  const handleTodoCompletion = (id: string, tier: CompletionTier) => {
    if (!appState) return;

    const updatedTodos = updateTodoCompletion(appState.todos, id, tier);

    updateAppState({
      ...appState,
      todos: updatedTodos,
      // HP only updates at end of day, not immediately
    });
  };

  const handleHpAdjustment = () => {
    if (!appState) return;

    const adjustment = parseInt(hpAdjustment);
    if (!isNaN(adjustment)) {
      updateAppState({
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

    updateAppState(newState);
  };

  const handleClearStorage = () => {
    localStorage.removeItem("life-coach-app-state");
    window.location.reload();
  };

  const getTodosBySection = (sectionName: string) => {
    if (!appState) return [];
    return appState.todos.filter((todo) => todo.section === sectionName);
  };

  if (isLoading || !appState) {
    return <div className="loading">Loading...</div>;
  }

  const todayHpChange = calculateDailyHpChange(appState.todos);

  return (
    <div className="app">
      <StatusIndicator
        saveMethod={saveMethod}
        isLoading={isLoading}
        error={error}
      />
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
