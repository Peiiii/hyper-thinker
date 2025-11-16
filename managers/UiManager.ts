import { useUiStore } from '../stores/uiStore';

export class UiManager {
  toggleLeftSidebar = () => {
    useUiStore.getState().actions.toggleLeftSidebar();
  };

  toggleRightSidebar = () => {
    useUiStore.getState().actions.toggleRightSidebar();
  };
  
  openLeftSidebar = () => {
    useUiStore.getState().actions.setLeftSidebarOpen(true);
  }

  openRightSidebar = () => {
    useUiStore.getState().actions.setRightSidebarOpen(true);
  }

  closeSidebars = () => {
    useUiStore.getState().actions.setLeftSidebarOpen(false);
    useUiStore.getState().actions.setRightSidebarOpen(false);
  }
}
