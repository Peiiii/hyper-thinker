import { create } from 'zustand';
import { ChatMessage, BrainType } from '../types';

export type ThinkingMode = 'auto' | 'simple' | 'medium' | 'complex';

interface ChatState {
  currentMessages: ChatMessage[];
  isLoading: boolean;
  loadingMessage: string;
  activeBrains: BrainType[];
  flowType: 'complex' | 'medium' | null;
  thinkingMode: ThinkingMode;
  actions: {
    setCurrentMessages: (messages: ChatMessage[]) => void;
    addMessages: (messages: ChatMessage[]) => void;
    setLoading: (isLoading: boolean, message?: string) => void;
    setActiveBrains: (brains: BrainType[]) => void;
    setFlowType: (flowType: 'complex' | 'medium' | null) => void;
    setThinkingMode: (mode: ThinkingMode) => void;
    resetChat: () => void;
  };
}

export const useChatStore = create<ChatState>((set) => ({
  currentMessages: [],
  isLoading: false,
  loadingMessage: '',
  activeBrains: [],
  flowType: null,
  thinkingMode: 'auto',
  actions: {
    setCurrentMessages: (messages) => set({ currentMessages: messages }),
    addMessages: (messages) => set((state) => ({ currentMessages: [...state.currentMessages, ...messages] })),
    setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message }),
    setActiveBrains: (brains) => set({ activeBrains: brains }),
    setFlowType: (flowType) => set({ flowType }),
    setThinkingMode: (mode) => set({ thinkingMode: mode }),
    resetChat: () => set({ currentMessages: [], isLoading: false, loadingMessage: '', activeBrains: [], flowType: null, thinkingMode: 'auto' }),
  }
}));