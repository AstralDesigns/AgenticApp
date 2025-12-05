import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiStateService {
  sidebarVisible = signal(true);
  chatVisible = signal(true);

  toggleSidebar(): void {
    this.sidebarVisible.update(v => !v);
  }

  toggleChat(): void {
    this.chatVisible.update(v => !v);
  }
}
