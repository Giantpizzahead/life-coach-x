import React from "react";
import type { TodoItem as TodoItemType } from "../types/TodoItem";
import { CompletionTier } from "../types/TodoItem";
import { isTaskRequiredToday } from "../utils/todoUtils";

interface TodoItemProps {
  todo: TodoItemType;
  onCompletionChange: (id: string, tier: CompletionTier) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onCompletionChange }) => {
  const isRequired = isTaskRequiredToday(todo);

  const handleTierChange = (tier: CompletionTier) => {
    onCompletionChange(todo.id, tier);
  };

  const getTierLabel = (tier: CompletionTier) => {
    switch (tier) {
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
        <h3 className="todo-name">{todo.name}</h3>
        {isRequired && (
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
                  {tier === CompletionTier.NONE
                    ? "○"
                    : tier === CompletionTier.MINIMUM
                    ? "−"
                    : tier === CompletionTier.FULL
                    ? "✓"
                    : "+"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {todo.description && (
        <p className="todo-description">{todo.description}</p>
      )}

      {!isRequired && (
        <div className="not-required-indicator">Not required today</div>
      )}
    </div>
  );
};

export default TodoItem;
