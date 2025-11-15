import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import SimpleMarkdown from './SimpleMarkdown';
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
  const hasThinkingSteps = thinkingProcess && (thinkingProcess.stages.length > 0 || thinkingProcess.reviewCycles.length > 0);

  const getContainerClassName = () => {
    if (isUser) {
      return 'w-fit max-w-3xl px-3 py-1 rounded-lg shadow-md bg-purple-800/40';
    }
    
    // AI messages
    if (isError) {
      return 'w-full max-w-3xl p-4 rounded-lg shadow-md bg-red-900/50 border border-red-500';
    }
    
    if (isAiLoadingPlaceholder) {
      return 'w-full max-w-3xl p-4 rounded-lg shadow-md bg-gray-800/60';
    }

    // Regular AI response - no card
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
          <div className="prose prose-invert prose-lg max-w-none leading-relaxed">
            <SimpleMarkdown text={content} />
          </div>
        )}
        {role === 'ai' && hasThinkingSteps && (
            <ThinkingProcessDisplay process={thinkingProcess} />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
