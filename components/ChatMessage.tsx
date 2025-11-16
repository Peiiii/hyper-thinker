import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import MarkdownDisplay from './MarkdownDisplay';
import ThinkingProcessDisplay from './ThinkingProcessDisplay';

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
  loadingMessage?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, loadingMessage }) => {
  const { role, content, thinkingProcess, isError } = message;
  const isUser = role === 'user';
  const isAiLoadingPlaceholder = role === 'ai' && isLoading && !content;
  // FIX: The property 'reviewCycles' does not exist on type 'ThinkingProcess'. This was likely removed during a refactor.
  const hasThinkingSteps = thinkingProcess && thinkingProcess.stages.length > 0;

  const getContainerClassName = () => {
    if (isUser) {
      return 'w-fit max-w-3xl px-3 py-1 rounded-lg shadow-md bg-purple-800/40';
    }
    
    // AI error messages still get a distinct card style
    if (isError) {
      return 'w-full max-w-3xl p-4 rounded-lg shadow-md bg-red-900/50 border border-red-500';
    }
    
    // For both loading placeholders and regular AI responses, use the flat style without a card background.
    return 'w-full max-w-3xl';
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={getContainerClassName()}>
        {isAiLoadingPlaceholder ? (
          <div className="flex items-center space-x-2 text-cyan-300">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span className="text-sm font-medium animate-pulse">{loadingMessage}</span>
          </div>
        ) : (
          <MarkdownDisplay text={content} className="prose prose-invert max-w-none leading-normal" />
        )}
        {role === 'ai' && hasThinkingSteps && (
            <ThinkingProcessDisplay process={thinkingProcess} />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;