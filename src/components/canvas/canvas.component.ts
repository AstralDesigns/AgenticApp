import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasService } from '../../services/canvas.service';
import { FilePane } from '../../models/file-pane.model';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { FileSystemService } from '../../services/file-system.service';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  templateUrl: './canvas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent {
  canvasService = inject(CanvasService);
  fileSystemService = inject(FileSystemService);

  panes = this.canvasService.panes;
  activePane = this.canvasService.activePane;

  mediaPlaylist = computed(() => {
    const pane = this.activePane();
    if (!pane || (pane.type !== 'image' && pane.type !== 'video')) {
      return null;
    }
    return this.fileSystemService.getMediaPlaylist(pane.id);
  });

  currentMediaIndex = computed(() => {
    const playlist = this.mediaPlaylist();
    const pane = this.activePane();
    if (!playlist || !pane) {
      return null;
    }
    return playlist.findIndex(item => item.path === pane.id);
  });

  selectPane(pane: FilePane): void {
    this.canvasService.setActivePane(pane.id);
  }

  closePane(event: MouseEvent, pane: FilePane): void {
    event.stopPropagation(); // prevent selectPane from firing
    this.canvasService.closePane(pane.id);
  }

  onContentChange(newContent: string): void {
    this.canvasService.updateActivePaneContent(newContent);
  }

  async navigateToMedia(direction: 'prev' | 'next'): Promise<void> {
    const playlist = this.mediaPlaylist();
    const currentIndex = this.currentMediaIndex();

    if (!playlist || playlist.length <= 1 || currentIndex === null) {
      return;
    }

    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % playlist.length
        : (currentIndex - 1 + playlist.length) % playlist.length;

    const nextFile = playlist[nextIndex];
    if (nextFile) {
        const filePane = await this.canvasService.fetchFileContent(nextFile.path);
        this.canvasService.openFile(filePane);
    }
  }
}