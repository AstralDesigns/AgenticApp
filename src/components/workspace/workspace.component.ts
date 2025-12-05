import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CanvasComponent } from '../canvas/canvas.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CanvasComponent],
  templateUrl: './workspace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceComponent {}
