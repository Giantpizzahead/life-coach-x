import React, { useState, useEffect } from "react";
import type { TodoItem as TodoItemType } from "../types/TodoItem";
import { CompletionTier } from "../types/TodoItem";
import { isTaskRequiredToday } from "../utils/todoUtils";

interface TodoItemProps {
  todo: TodoItemType;
  onCompletionChange: (id: string, tier: CompletionTier) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onCompletionChange }) => {
  const [showDescription, setShowDescription] = useState(false);
  const [subtasks, setSubtasks] = useState<boolean[]>([]);
  const isRequired = isTaskRequiredToday(todo);

  // Initialize subtasks when description opens, reset when it closes
  useEffect(() => {
    if (showDescription && todo.description) {
      const subtaskTexts = parseSubtasks(todo.description);
      setSubtasks(new Array(subtaskTexts.length).fill(false));
    } else {
      setSubtasks([]);
    }
  }, [showDescription, todo.description]);

  const getDayName = (dayNumber: number): string => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayNumber];
  };

  const getDaysDisplay = (): string => {
    if (todo.recurrence.type === "daily") {
      return "Daily";
    } else if (
      todo.recurrence.type === "weekly" &&
      todo.recurrence.daysOfWeek
    ) {
      const dayNames = todo.recurrence.daysOfWeek.map(getDayName);
      return dayNames.join(", ");
    } else if (
      todo.recurrence.type === "monthly" &&
      todo.recurrence.daysOfMonth
    ) {
      const sortedDays = [...todo.recurrence.daysOfMonth].sort((a, b) => a - b);
      const dayStrings = sortedDays.map((day) => {
        if (day === 1 || day === 21 || day === 31) return `${day}st`;
        if (day === 2 || day === 22) return `${day}nd`;
        if (day === 3 || day === 23) return `${day}rd`;
        return `${day}th`;
      });
      return dayStrings.join(", ");
    }
    return "";
  };

  const parseSubtasks = (text: string): string[] => {
    const lines = text.split("\n");
    const subtaskLines: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      // Look for lines that start with - [ ] or - [x] (markdown checkbox format)
      if (trimmed.match(/^-\s*\[[\sx]\]\s+/)) {
        // Extract the text after the checkbox
        const match = trimmed.match(/^-\s*\[[\sx]\]\s+(.+)$/);
        if (match) {
          subtaskLines.push(match[1]);
        }
      }
    });

    return subtaskLines;
  };

  const renderMarkdown = (text: string): React.ReactElement[] => {
    const lines = text.split("\n");
    const elements: React.ReactElement[] = [];
    let key = 0;

    lines.forEach((line) => {
      if (line.trim() === "") {
        elements.push(<br key={key++} />);
        return;
      }

      // Check if this is a subtask line
      const trimmed = line.trim();
      if (trimmed.match(/^-\s*\[[\sx]\]\s+/)) {
        // Skip subtask lines in markdown rendering - they'll be handled separately
        return;
      }

      // Parse inline formatting
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_)/g);
      const lineElements = parts.map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={`${key}-${partIndex}`}>{part.slice(2, -2)}</strong>
          );
        } else if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={`${key}-${partIndex}`}>{part.slice(1, -1)}</em>;
        } else if (part.startsWith("_") && part.endsWith("_")) {
          return <em key={`${key}-${partIndex}`}>{part.slice(1, -1)}</em>;
        } else {
          return <span key={`${key}-${partIndex}`}>{part}</span>;
        }
      });

      elements.push(<p key={key++}>{lineElements}</p>);
    });

    return elements;
  };

  const handleTierChange = (tier: CompletionTier) => {
    // If clicking the currently selected tier, unselect it
    if (todo.completionTier === tier) {
      onCompletionChange(todo.id, CompletionTier.UNSELECTED);
    } else {
      onCompletionChange(todo.id, tier);
    }
  };

  const handleSubtaskChange = (index: number) => {
    setSubtasks((prev) => {
      const newSubtasks = [...prev];
      newSubtasks[index] = !newSubtasks[index];
      return newSubtasks;
    });
  };

  const getTierLabel = (tier: CompletionTier) => {
    switch (tier) {
      case CompletionTier.UNSELECTED:
        return "Unselected";
      case CompletionTier.NONE:
        return "None";
      case CompletionTier.MINIMUM:
        return "Minimum";
      case CompletionTier.FULL:
        return "Full";
      case CompletionTier.BONUS:
        return "Bonus";
    }
  };

  const getHpValue = (tier: CompletionTier) => {
    switch (tier) {
      case CompletionTier.UNSELECTED:
        return 0; // Unselected shows 0 HP
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

  const tiers: CompletionTier[] = [CompletionTier.NONE];

  // Add minimum tier only if it exists
  if (todo.hpValues.minimum !== null) {
    tiers.push(CompletionTier.MINIMUM);
  }

  // Always add full tier
  tiers.push(CompletionTier.FULL);

  // Add bonus tier only if it exists
  if (todo.hpValues.bonus !== null) {
    tiers.push(CompletionTier.BONUS);
  }

  return (
    <div className={`todo-item ${!isRequired ? "not-required" : ""}`}>
      <div className="todo-header">
        <div className="todo-title-section">
          <h3
            className="todo-name clickable"
            onClick={() => setShowDescription(!showDescription)}>
            {todo.name}
          </h3>
          <span className="todo-schedule">{getDaysDisplay()}</span>
        </div>
        {isRequired ? (
          <div className="completion-capsules">
            {tiers.map((tier) => (
              <button
                key={tier}
                className={`tier-capsule ${tier} ${
                  todo.completionTier === tier ? "selected" : ""
                }`}
                onClick={() => handleTierChange(tier)}
                title={`${getTierLabel(tier)} - ${
                  getHpValue(tier) > 0 ? "+" : ""
                }${getHpValue(tier)} HP`}>
                <span className="tier-symbol">
                  {tier === CompletionTier.NONE ? (
                    ""
                  ) : tier === CompletionTier.MINIMUM ? (
                    <i className="fas fa-minus"></i>
                  ) : tier === CompletionTier.FULL ? (
                    <i className="fas fa-check"></i>
                  ) : (
                    <i
                      className="fas fa-star"
                      style={{ fontSize: "0.75em" }}></i>
                  )}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="not-required-indicator">Not required today</div>
        )}
      </div>

      {todo.description && showDescription && (
        <div className="todo-description">
          {renderMarkdown(todo.description)}
          {parseSubtasks(todo.description).length > 0 && (
            <div className="subtasks">
              <h4>Subtasks:</h4>
              {parseSubtasks(todo.description).map((subtaskText, index) => (
                <label key={index} className="subtask-item">
                  <input
                    type="checkbox"
                    checked={subtasks[index] || false}
                    onChange={() => handleSubtaskChange(index)}
                  />
                  <span className="subtask-text">{subtaskText}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TodoItem;
