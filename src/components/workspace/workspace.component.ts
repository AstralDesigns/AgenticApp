import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../chat/chat.component';
import { CanvasComponent } from '../canvas/canvas.component';
import { CanvasService } from '../../services/canvas.service';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, ChatComponent, CanvasComponent],
  templateUrl: './workspace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceComponent {
  canvasService = inject(CanvasService);
  showCanvas = this.canvasService.hasOpenPanes;
}
