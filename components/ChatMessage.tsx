import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import MarkdownDisplay from './MarkdownDisplay';
import ThinkingProcessDisplay from './ThinkingProcessDisplay';
import { LoaderIcon } from './Icons';

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
  loadingMessage?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, loadingMessage }) => {
  const { role, content, thinkingProcess, isError } = message;
  const isUser = role === 'user';
  const hasThinkingSteps = thinkingProcess && thinkingProcess.stages.length > 0;

  const getContainerClassName = () => {
    if (isUser) {
      // User messages remain as distinct bubbles
      return 'w-fit max-w-3xl px-4 py-3 rounded-lg shadow-md bg-purple-800/40';
    }
    
    if (isError) {
      // Error messages keep their card style for emphasis
      return 'w-full max-w-3xl p-4 rounded-lg shadow-md bg-red-900/50 border border-red-500';
    }
    
    // AI messages are now "flat" without a card container, as requested.
    // The content inside (Markdown, Thinking Process) handles its own spacing.
    return 'w-full max-w-3xl';
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={getContainerClassName()}>
        {isLoading && !content && !hasThinkingSteps && (
          <div className="flex items-center space-x-2 text-gray-400">
            <LoaderIcon className="w-5 h-5 animate-spin" />
            <span>{loadingMessage || 'Bibo is thinking...'}</span>
          </div>
        )}
      
        {content && (
          <MarkdownDisplay text={content} className="prose prose-invert max-w-none leading-normal" />
        )}

        {role === 'ai' && hasThinkingSteps && (
            <ThinkingProcessDisplay process={thinkingProcess} isStreaming={isLoading} />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
