
import React, { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt);
      setPrompt('');
    }
  };

  return (
    <div className="relative">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isLoading ? "Bibo is thinking... (you can type your next prompt)" : "Ask a deep question..."}
        className="w-full p-3 pr-24 bg-gray-900/50 border border-gray-600/80 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all resize-none placeholder-gray-500"
        rows={1}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !prompt.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Ask
      </button>
    </div>
  );
};

export default PromptInput;