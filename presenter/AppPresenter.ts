import { ChatManager } from '../managers/ChatManager';
import { SessionManager } from '../managers/SessionManager';
import { UiManager } from '../managers/UiManager';

export class AppPresenter {
  chatManager: ChatManager;
  sessionManager: SessionManager;
  uiManager: UiManager;

  constructor() {
    this.uiManager = new UiManager();
    this.sessionManager = new SessionManager();
    this.chatManager = new ChatManager(this.sessionManager);
    this.sessionManager.init();
  }
}
