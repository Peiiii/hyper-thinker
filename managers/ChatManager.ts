import { useChatStore } from '../stores/chatStore';
import { useSessionStore } from '../stores/sessionStore';
import { ChatMessage, Stage, BrainType } from '../types';
import { generateMultiBrainResponse } from '../services/aiService';
import { SessionManager } from './SessionManager';

export class ChatManager {
  private sessionManager: SessionManager;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  sendMessage = async (prompt: string) => {
    if (!prompt.trim() || useChatStore.getState().isLoading) {
      return;
    }

    let { activeSessionId } = useSessionStore.getState();
    const { currentMessages } = useChatStore.getState();
    const isNewSession = !activeSessionId;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
    };

    const aiMessagePlaceholder: ChatMessage = {
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
    useChatStore.getState().actions.addMessages([userMessage, aiMessagePlaceholder]);

    let sessionIdToUpdate: string;
    if (isNewSession) {
        const newSession = this.sessionManager.createSession(prompt);
        sessionIdToUpdate = newSession.id;
    } else {
        sessionIdToUpdate = activeSessionId!;
    }
    
    const { updateSessionMessages } = useSessionStore.getState().actions;
    updateSessionMessages(sessionIdToUpdate, (messages) => [...messages, userMessage, aiMessagePlaceholder]);
    
    useChatStore.getState().actions.setLoading(true, 'Waking up Bibo...');
    useChatStore.getState().actions.setActiveBrains([]);
    
    const onUpdate = (update: { stage: string; data: any; brains?: BrainType[] }) => {
      if (useSessionStore.getState().activeSessionId !== sessionIdToUpdate) return;
      
      useChatStore.getState().actions.setLoading(true, update.stage);
      if (update.brains) {
        useChatStore.getState().actions.setActiveBrains(update.brains);
      }
      
      if (!update.data) return;

      const messageUpdater = (messages: ChatMessage[]): ChatMessage[] => {
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
      
      useChatStore.getState().actions.setCurrentMessages(messageUpdater(useChatStore.getState().currentMessages));
      updateSessionMessages(sessionIdToUpdate, messageUpdater);
    };

    try {
      const response = await generateMultiBrainResponse(prompt, messagesForApi, onUpdate);

      const finalUpdater = (messages: ChatMessage[]): ChatMessage[] => {
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

      if (useSessionStore.getState().activeSessionId === sessionIdToUpdate) {
        useChatStore.getState().actions.setCurrentMessages(finalUpdater(useChatStore.getState().currentMessages));
      }
      updateSessionMessages(sessionIdToUpdate, finalUpdater);

    } catch (err) {
      console.error(err);
      const errorUpdater = (messages: ChatMessage[]): ChatMessage[] => {
         const newMessages = [...messages];
         const lastMessage = newMessages[newMessages.length - 1];
         if (lastMessage && lastMessage.role === 'ai') {
           lastMessage.content = err instanceof Error ? err.message : 'An unknown error occurred. Please try again.';
           lastMessage.isError = true;
         }
         return newMessages;
      };
      
      if (useSessionStore.getState().activeSessionId === sessionIdToUpdate) {
        useChatStore.getState().actions.setCurrentMessages(errorUpdater(useChatStore.getState().currentMessages));
      }
      updateSessionMessages(sessionIdToUpdate, errorUpdater);

    } finally {
      if (useSessionStore.getState().activeSessionId === sessionIdToUpdate) {
        useChatStore.getState().actions.setLoading(false);
        useChatStore.getState().actions.setActiveBrains([]);
      }
    }
  };
}