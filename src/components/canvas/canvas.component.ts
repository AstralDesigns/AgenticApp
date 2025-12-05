import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasService } from '../../services/canvas.service';
import { FilePane } from '../../models/file-pane.model';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  templateUrl: './canvas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent {
  canvasService = inject(CanvasService);

  panes = this.canvasService.panes;
  activePane = this.canvasService.activePane;

  selectPane(pane: FilePane): void {
    this.canvasService.setActivePane(pane.id);
  }

  closePane(event: MouseEvent, pane: FilePane): void {
    event.stopPropagation(); // prevent selectPane from firing
    this.canvasService.closePane(pane.id);
  }
}