import { create } from 'zustand';
import { ChatMessage, BrainType } from '../types';

interface ChatState {
  currentMessages: ChatMessage[];
  isLoading: boolean;
  loadingMessage: string;
  activeBrains: BrainType[];
  flowType: 'complex' | 'medium' | null;
  actions: {
    setCurrentMessages: (messages: ChatMessage[]) => void;
    addMessages: (messages: ChatMessage[]) => void;
    setLoading: (isLoading: boolean, message?: string) => void;
    setActiveBrains: (brains: BrainType[]) => void;
    setFlowType: (flowType: 'complex' | 'medium' | null) => void;
    resetChat: () => void;
  };
}

export const useChatStore = create<ChatState>((set) => ({
  currentMessages: [],
  isLoading: false,
  loadingMessage: '',
  activeBrains: [],
  flowType: null,
  actions: {
    setCurrentMessages: (messages) => set({ currentMessages: messages }),
    addMessages: (messages) => set((state) => ({ currentMessages: [...state.currentMessages, ...messages] })),
    setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message }),
    setActiveBrains: (brains) => set({ activeBrains: brains }),
    setFlowType: (flowType) => set({ flowType }),
    resetChat: () => set({ currentMessages: [], isLoading: false, loadingMessage: '', activeBrains: [], flowType: null }),
  }
}));
