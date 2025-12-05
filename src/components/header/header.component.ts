import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '../../services/ui-state.service';
import { CanvasService } from '../../services/canvas.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  uiStateService = inject(UiStateService);
  canvasService = inject(CanvasService);

  showNewFileMenu = signal(false);

  toggleSidebar(): void {
    this.uiStateService.toggleSidebar();
  }

  toggleChat(): void {
    this.uiStateService.toggleChat();
  }
  
  toggleNewFileMenu(): void {
    this.showNewFileMenu.update(v => !v);
  }

  createNewFile(type: 'markdown' | 'code'): void {
    this.canvasService.createNewFile(type);
    this.showNewFileMenu.set(false);
  }
}
