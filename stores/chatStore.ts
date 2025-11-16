import { create } from 'zustand';
import { ChatMessage, BrainType, Stage } from '../types';

interface ChatState {
  currentMessages: ChatMessage[];
  isLoading: boolean;
  loadingMessage: string;
  activeBrains: BrainType[];
  actions: {
    setCurrentMessages: (messages: ChatMessage[]) => void;
    addMessages: (messages: ChatMessage[]) => void;
    setLoading: (isLoading: boolean, message?: string) => void;
    setActiveBrains: (brains: BrainType[]) => void;
    resetChat: () => void;
  };
}

export const useChatStore = create<ChatState>((set) => ({
  currentMessages: [],
  isLoading: false,
  loadingMessage: '',
  activeBrains: [],
  actions: {
    setCurrentMessages: (messages) => set({ currentMessages: messages }),
    addMessages: (messages) => set((state) => ({ currentMessages: [...state.currentMessages, ...messages] })),
    setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message }),
    setActiveBrains: (brains) => set({ activeBrains: brains }),
    resetChat: () => set({ currentMessages: [], isLoading: false, loadingMessage: '', activeBrains: [] }),
  }
}));