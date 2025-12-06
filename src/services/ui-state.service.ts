import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiStateService {
  sidebarVisible = signal(true);
  chatVisible = signal(true);
  settingsModalVisible = signal(false);

  toggleSidebar(): void {
    const becomingVisible = !this.sidebarVisible();
    this.sidebarVisible.set(becomingVisible);
    if (becomingVisible && window.innerWidth < 1024) {
      this.chatVisible.set(false);
    }
  }

  toggleChat(): void {
    const becomingVisible = !this.chatVisible();
    this.chatVisible.set(becomingVisible);
     if (becomingVisible && window.innerWidth < 1024) {
      this.sidebarVisible.set(false);
    }
  }
  
  closeOpenPanel(): void {
    if (this.sidebarVisible()) this.sidebarVisible.set(false);
    if (this.chatVisible()) this.chatVisible.set(false);
  }

  toggleSettingsModal(): void {
    this.settingsModalVisible.update(v => !v);
  }
}
