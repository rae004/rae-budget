import { useRef, useState } from 'react';
import { useSpendingDescriptionSuggestions } from '../hooks/useSpending';
import type { SpendingDescriptionSuggestion } from '../types';

// Stable reference so the "reset highlight on identity change" check below
// doesn't fire on every render when data is still undefined.
const EMPTY_SUGGESTIONS: readonly SpendingDescriptionSuggestion[] = [];

interface DescriptionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: SpendingDescriptionSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function DescriptionAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  required,
  id,
}: DescriptionAutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useSpendingDescriptionSuggestions(value);
  const suggestions = data ?? EMPTY_SUGGESTIONS;
  const showDropdown = isFocused && value.trim().length >= 1 && suggestions.length > 0;

  // Reset highlight to the first row when the suggestion list identity changes.
  const [prevSuggestions, setPrevSuggestions] = useState(suggestions);
  if (prevSuggestions !== suggestions) {
    setPrevSuggestions(suggestions);
    setHighlightIndex(suggestions.length > 0 ? 0 : -1);
  }

  const choose = (suggestion: SpendingDescriptionSuggestion) => {
    onSelect(suggestion);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) =>
        i <= 0 ? suggestions.length - 1 : i - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        e.preventDefault();
        choose(suggestions[highlightIndex]);
      }
    } else if (e.key === 'Tab') {
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        e.preventDefault();
        choose(suggestions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        id={id}
        type="text"
        className="input input-bordered input-sm w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="description-suggestion-list"
        aria-activedescendant={
          showDropdown && highlightIndex >= 0
            ? `description-suggestion-${highlightIndex}`
            : undefined
        }
      />
      {showDropdown && (
        <ul
          id="description-suggestion-list"
          role="listbox"
          className="menu menu-sm bg-base-100 rounded-box shadow absolute z-20 mt-1 w-full max-h-64 overflow-auto p-1 border border-base-300"
          data-testid="description-suggestion-list"
        >
          {suggestions.map((suggestion, index) => {
            const isHighlighted = index === highlightIndex;
            return (
              <li
                key={suggestion.description}
                id={`description-suggestion-${index}`}
                role="option"
                aria-selected={isHighlighted}
              >
                <button
                  type="button"
                  className={`flex justify-between items-center w-full ${
                    isHighlighted ? 'active' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(suggestion);
                  }}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  <span className="truncate">{suggestion.description}</span>
                  <span className="text-xs opacity-60 ml-2 shrink-0">
                    used {suggestion.frequency}×
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
