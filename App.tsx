
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrainType, ChatMessage as ChatMessageType, Stage, Session } from './types';
import { generateMultiBrainResponse } from './services/geminiService';
import { BRAINS } from './constants';
import BrainVisualizer from './components/BrainVisualizer';
import PromptInput from './components/PromptInput';
import ChatMessage from './components/ChatMessage';
import { GithubIcon, PlusIcon, MenuIcon, VitalsIcon, TrashIcon } from './components/Icons';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessageType[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeBrains, setActiveBrains] = useState<BrainType[]>([]);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const activeSessionIdRef = useRef(activeSessionId);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem('BiboSessions');
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions));
      }
    } catch (error) {
      console.error("Failed to parse sessions from localStorage", error);
      localStorage.removeItem('BiboSessions');
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('BiboSessions', JSON.stringify(sessions));
    } else {
       localStorage.removeItem('BiboSessions');
    }
  }, [sessions]);
  

  const scrollToBottom = useCallback(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading, scrollToBottom]);

  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    setCurrentMessages([]);
    setIsLoading(false);
    setLoadingMessage('');
    setActiveBrains([]);
    if (window.innerWidth < 1024) {
      setIsLeftSidebarOpen(false);
    }
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setCurrentMessages(session.messages);
      setIsLoading(false);
      setLoadingMessage('');
      setActiveBrains([]);
       if (window.innerWidth < 1024) {
        setIsLeftSidebarOpen(false);
      }
    }
  }, [sessions]);

  const handleDeleteSession = useCallback((e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
          handleNewSession();
      }
  }, [activeSessionId, handleNewSession]);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isLoading) {
      return;
    }

    let sessionIdToUpdate = activeSessionId;
    const isNewSession = !sessionIdToUpdate;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
    };

    const aiMessagePlaceholder: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: '',
      thinkingProcess: {
        stages: [],
        reviewCycles: [],
        finalThesis: '',
      },
    };

    const messagesForApi = [...currentMessages, userMessage];
    setCurrentMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);

    if (isNewSession) {
        const newSessionId = `session_${Date.now()}`;
        sessionIdToUpdate = newSessionId;
        const newSession: Session = {
            id: newSessionId,
            title: prompt.substring(0, 40) + (prompt.length > 40 ? '...' : ''),
            messages: [userMessage, aiMessagePlaceholder]
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSessionId);
    } else {
        setSessions(prev => 
            prev.map(s => 
                s.id === sessionIdToUpdate 
                    ? { ...s, messages: [...s.messages, userMessage, aiMessagePlaceholder] }
                    : s
            )
        );
    }
    
    setIsLoading(true);
    setLoadingMessage('Waking up Bibo...');
    setActiveBrains([]);
    
    const onUpdate = (update: { stage: string; data: any; brains?: BrainType[] }) => {
      // Only update the UI if the user is still viewing the session being processed
      if (activeSessionIdRef.current === sessionIdToUpdate) {
        setLoadingMessage(update.stage);
        if (update.brains) {
          setActiveBrains(update.brains);
        }
      }

      if (!update.data) {
        return;
      }

      const messageUpdater = (messages: ChatMessageType[]): ChatMessageType[] => {
        const newMessages = JSON.parse(JSON.stringify(messages));
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'ai' && lastMessage.thinkingProcess) {
          const tp = lastMessage.thinkingProcess;
          if (update.data.title && Array.isArray(update.data.executions)) {
            const stageData = update.data as Stage;
            const existingStageIndex = tp.stages.findIndex(s => s.title === stageData.title);
            if (existingStageIndex > -1) {
              tp.stages[existingStageIndex] = { ...tp.stages[existingStageIndex], ...stageData };
            } else {
              tp.stages.push(stageData);
            }
          } else if (update.data.critique) {
             if (update.data.refinedText) {
                const lastCycle = tp.reviewCycles[tp.reviewCycles.length - 1];
                if (lastCycle && !lastCycle.refinedText) {
                    lastCycle.refinedText = update.data.refinedText;
                }
             } else {
                 tp.reviewCycles.push({critique: update.data.critique, refinedText: ''});
             }
          } else if (update.data.finalThesis) {
            tp.finalThesis = update.data.finalThesis;
          }
        }
        return newMessages;
      }
      
      // Always update the canonical session data in the background
      setSessions(prev => prev.map(s => s.id === sessionIdToUpdate ? { ...s, messages: messageUpdater(s.messages) } : s));

      // Conditionally update the displayed messages
      if (activeSessionIdRef.current === sessionIdToUpdate) {
        setCurrentMessages(prev => messageUpdater(prev));
      }
    };

    try {
      const response = await generateMultiBrainResponse(prompt, messagesForApi, onUpdate);

      const finalUpdater = (messages: ChatMessageType[]): ChatMessageType[] => {
         const newMessages = [...messages];
         const lastMessage = newMessages[newMessages.length - 1];
         if (lastMessage && lastMessage.role === 'ai') {
           lastMessage.content = response;
            if (lastMessage.thinkingProcess) {
             lastMessage.thinkingProcess.finalThesis = response;
           }
         }
         return newMessages;
      };

      setSessions(prev => prev.map(s => s.id === sessionIdToUpdate ? { ...s, messages: finalUpdater(s.messages) } : s));
      if (activeSessionIdRef.current === sessionIdToUpdate) {
        setCurrentMessages(finalUpdater);
      }

    } catch (err) {
      console.error(err);
      const errorUpdater = (messages: ChatMessageType[]): ChatMessageType[] => {
         const newMessages = [...messages];
         const lastMessage = newMessages[newMessages.length - 1];
         if (lastMessage && lastMessage.role === 'ai') {
           lastMessage.content = err instanceof Error ? err.message : 'An unknown error occurred. Please try again.';
           lastMessage.isError = true;
         }
         return newMessages;
      };
      
      setSessions(prev => prev.map(s => s.id === sessionIdToUpdate ? { ...s, messages: errorUpdater(s.messages) } : s));
      if (activeSessionIdRef.current === sessionIdToUpdate) {
        setCurrentMessages(errorUpdater);
      }

    } finally {
      if (activeSessionIdRef.current === sessionIdToUpdate) {
        setIsLoading(false);
        setLoadingMessage('');
        setActiveBrains([]);
      }
    }
  }, [isLoading, activeSessionId, currentMessages]);

  return (
    <div className="bg-gray-900/50 text-gray-200 h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50 flex flex-col p-4 z-30 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="hidden lg:flex flex-col items-start mb-6 shrink-0">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Bibo
          </h1>
          <p className="text-xs text-gray-400 -mt-1 ml-0.5">The Hyper Thinker</p>
        </div>
        <div className="shrink-0">
          <button onClick={handleNewSession} className="w-full flex items-center justify-center p-2 bg-gray-700/50 hover:bg-gray-700 rounded-md transition-colors text-sm font-medium">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Session
          </button>
        </div>

        <div className="flex-grow overflow-y-auto mt-4 -mr-2 pr-2">
          <h2 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-2">History</h2>
          <nav className="space-y-1">
            {sessions.map(session => (
              <a
                key={session.id}
                href="#"
                onClick={(e) => { e.preventDefault(); handleSelectSession(session.id); }}
                className={`group flex items-center justify-between p-2 text-sm rounded-md ${
                  activeSessionId === session.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <span className="truncate">{session.title}</span>
                <button 
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded-full shrink-0"
                  aria-label={`Delete session: ${session.title}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-auto text-center text-xs text-gray-500 shrink-0">
          <p className="mb-2">An AI that thinks from multiple perspectives to give you a deeper answer.</p>
           <a href="https://github.com/google/generative-ai-docs/tree/main/site/en/gemini-api/docs/prompting_with_media" target="_blank" rel="noopener noreferrer" className="inline-block text-gray-500 hover:text-white transition-colors">
            <GithubIcon className="w-6 h-6" />
          </a>
        </div>
      </aside>

      {/* Main container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="w-full lg:hidden flex items-center justify-between p-2 h-14 border-b border-gray-700/50 bg-gray-900/80 shrink-0">
          <button onClick={() => setIsLeftSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
            <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Bibo
          </h1>
          <button onClick={() => setIsRightSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
            <VitalsIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col overflow-hidden">
           {currentMessages.length === 0 && !isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                <h2 className="text-2xl font-medium">Bibo: The Hyper Thinker</h2>
                <p>Ask Bibo a question to begin.</p>
              </div>
            ) : (
               <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {currentMessages.map((msg, index) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg}
                    isLoading={isLoading && msg.role === 'ai' && index === currentMessages.length - 1}
                    loadingMessage={loadingMessage}
                  />
                ))}
              </div>
            )}
        </main>
        
        {/* Prompt Input Section */}
        <div className="w-full border-t border-gray-700/50 bg-gray-900/40">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
              <PromptInput
                onSubmit={handleSendMessage}
                isLoading={isLoading}
              />
          </div>
        </div>
      </div>

      {/* Right Dashboard */}
      <aside className={`fixed top-0 right-0 h-full w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700/50 p-4 flex flex-col z-30 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <h2 className="text-lg font-semibold mb-4 text-gray-300">Thinking Status</h2>
        <div className="flex-grow flex items-center justify-center">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
               <div className="relative flex items-center justify-center">
                 <div className="absolute w-16 h-16 border-4 border-cyan-500/20 rounded-full"></div>
                 <div className="absolute w-16 h-16 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
               </div>
               <p className="text-cyan-300 font-medium text-sm mt-4 animate-pulse">{loadingMessage}</p>
             </div>
          ) : (
            <BrainVisualizer brains={BRAINS} activeBrains={activeBrains} isLoading={isLoading} />
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {(isLeftSidebarOpen || isRightSidebarOpen) && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => {
            setIsLeftSidebarOpen(false);
            setIsRightSidebarOpen(false);
          }}
        ></div>
      )}
    </div>
  );
};

export default App;