import React from 'react';
import { useChatStore, ThinkingMode } from '../stores/chatStore';

const modes: { id: ThinkingMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'simple', label: 'Simple' },
  { id: 'medium', label: 'Medium' },
  { id: 'complex', label: 'Complex' },
];

const ThinkingModeSelector: React.FC = () => {
  const thinkingMode = useChatStore(state => state.thinkingMode);
  const setThinkingMode = useChatStore(state => state.actions.setThinkingMode);

  return (
    <div className="flex items-center justify-center mb-3">
      <div className="bg-gray-800/50 p-1 rounded-lg flex items-center space-x-1" role="radiogroup" aria-label="Thinking Mode">
        <span className="text-xs font-semibold text-gray-400 mr-2 ml-1">Mode:</span>
        {modes.map(mode => (
          <button
            key={mode.id}
            onClick={() => setThinkingMode(mode.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              thinkingMode === mode.id
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
            role="radio"
            aria-checked={thinkingMode === mode.id}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThinkingModeSelector;
