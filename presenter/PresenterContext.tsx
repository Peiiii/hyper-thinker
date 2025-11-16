import React, { createContext, useRef } from 'react';
import { AppPresenter } from './AppPresenter';

export const PresenterContext = createContext<AppPresenter | null>(null);

export const PresenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const presenterRef = useRef<AppPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = new AppPresenter();
  }

  return (
    <PresenterContext.Provider value={presenterRef.current}>
      {children}
    </PresenterContext.Provider>
  );
};
