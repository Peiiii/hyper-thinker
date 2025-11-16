import { create } from 'zustand';
import { Session, ChatMessage } from '../types';

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  actions: {
    setSessions: (sessions: Session[]) => void;
    addSession: (session: Session) => void;
    deleteSession: (sessionId: string) => void;
    setActiveSessionId: (sessionId: string | null) => void;
    updateSessionMessages: (sessionId: string, updater: (messages: ChatMessage[]) => ChatMessage[]) => void;
  };
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  activeSessionId: null,
  actions: {
    setSessions: (sessions) => set({ sessions }),
    addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),
    deleteSession: (sessionId) => set((state) => ({ sessions: state.sessions.filter(s => s.id !== sessionId) })),
    setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),
    updateSessionMessages: (sessionId, updater) => set((state) => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, messages: updater(s.messages) } : s
      )
    })),
  }
}));
