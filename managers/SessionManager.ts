import React from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useChatStore } from '../stores/chatStore';
import { useUiStore } from '../stores/uiStore';
import { Session } from '../types';

export class SessionManager {
  init = () => {
    this.loadSessionsFromStorage();
    // FIX: The `subscribe` method expects a single listener function.
    // The original code passed two arguments, which is incorrect without the `subscribeWithSelector` middleware.
    // This has been refactored to use one listener that compares the `sessions` slice of the state.
    useSessionStore.subscribe(
      (state, prevState) => {
        if (JSON.stringify(state.sessions) !== JSON.stringify(prevState.sessions)) {
            if (state.sessions.length > 0) {
              localStorage.setItem('BiboSessions', JSON.stringify(state.sessions));
            } else {
              localStorage.removeItem('BiboSessions');
            }
        }
      }
    );
  }

  loadSessionsFromStorage = () => {
    try {
      const storedSessions = localStorage.getItem('BiboSessions');
      if (storedSessions) {
        useSessionStore.getState().actions.setSessions(JSON.parse(storedSessions));
      }
    } catch (error) {
      console.error("Failed to parse sessions from localStorage", error);
      localStorage.removeItem('BiboSessions');
    }
  }

  newSession = () => {
    useSessionStore.getState().actions.setActiveSessionId(null);
    useChatStore.getState().actions.resetChat();
    if (window.innerWidth < 1024) {
      useUiStore.getState().actions.setLeftSidebarOpen(false);
    }
  };

  selectSession = (sessionId: string) => {
    const session = useSessionStore.getState().sessions.find(s => s.id === sessionId);
    if (session) {
      useSessionStore.getState().actions.setActiveSessionId(sessionId);
      useChatStore.getState().actions.setCurrentMessages(session.messages);
      useChatStore.getState().actions.setLoading(false);
      useChatStore.getState().actions.setActiveBrains([]);
      if (window.innerWidth < 1024) {
        useUiStore.getState().actions.setLeftSidebarOpen(false);
      }
    }
  };
  
  deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const { activeSessionId } = useSessionStore.getState();
    useSessionStore.getState().actions.deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      this.newSession();
    }
  };
  
  createSession = (prompt: string): Session => {
    const newSessionId = `session_${Date.now()}`;
    const newSession: Session = {
      id: newSessionId,
      title: prompt.substring(0, 40) + (prompt.length > 40 ? '...' : ''),
      messages: []
    };
    useSessionStore.getState().actions.addSession(newSession);
    useSessionStore.getState().actions.setActiveSessionId(newSessionId);
    return newSession;
  };
}