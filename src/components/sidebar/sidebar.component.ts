import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasService } from '../../services/canvas.service';
import { UiStateService } from '../../services/ui-state.service';
import { FileSystemService } from '../../services/file-system.service';
import { FileSystemItem } from '../../models/file-system-item.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class SidebarComponent {
  private canvasService = inject(CanvasService);
  private uiStateService = inject(UiStateService);
  fileSystemService = inject(FileSystemService); // Make public for template access
  
  searchTerm = signal('');

  filteredContent = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const content = this.fileSystemService.directoryContent();
    if (!term) {
      return content;
    }
    return content.filter(item => item.name.toLowerCase().includes(term));
  });

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  handleItemClick(item: FileSystemItem): void {
    if (item.type === 'folder') {
      this.fileSystemService.navigateTo(item.path);
    } else {
      this.openFile(item);
    }
  }

  openFile(file: FileSystemItem): void {
    this.canvasService.openFileByPath(file.path);
    
    if (window.innerWidth < 1024) {
      this.uiStateService.toggleSidebar();
    }
  }
  
  openSettings(): void {
    this.uiStateService.toggleSettingsModal();
  }

  getIconForFile(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['mp4', 'webm', 'mov', 'mkv'].includes(extension)) {
      return 'video';
    }
    if (['ts', 'js', 'html', 'css', 'scss'].includes(extension)) {
      return 'code';
    }
    if (extension === 'json') {
      return 'json';
    }
    if (extension === 'md') {
      return 'markdown';
    }
    return 'default';
  }
}
