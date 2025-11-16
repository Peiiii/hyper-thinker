import { create } from 'zustand';

interface UiState {
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  actions: {
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setLeftSidebarOpen: (isOpen: boolean) => void;
    setRightSidebarOpen: (isOpen: boolean) => void;
  };
}

export const useUiStore = create<UiState>((set) => ({
  isLeftSidebarOpen: window.innerWidth >= 1024,
  isRightSidebarOpen: window.innerWidth >= 1024,
  actions: {
    toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
    toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
    setLeftSidebarOpen: (isOpen: boolean) => set({ isLeftSidebarOpen: isOpen }),
    setRightSidebarOpen: (isOpen: boolean) => set({ isRightSidebarOpen: isOpen }),
  }
}));

if (window.innerWidth < 1024) {
    useUiStore.setState({ isLeftSidebarOpen: false, isRightSidebarOpen: false });
}
