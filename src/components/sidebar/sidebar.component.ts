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
  private fileSystemService = inject(FileSystemService);
  searchTerm = signal('');

  fileTree = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const tree = this.fileSystemService.fileTreeState();
    if (!term) {
      return tree;
    }

    const filter = (items: FileSystemItem[]): FileSystemItem[] => {
      const results: FileSystemItem[] = [];
      for (const item of items) {
        if (item.type === 'file') {
          if (item.name.toLowerCase().includes(term)) {
            results.push(item);
          }
        } else if (item.type === 'folder' && item.children) {
          const filteredChildren = filter(item.children);
          if (filteredChildren.length > 0) {
            results.push({ ...item, children: filteredChildren, isOpen: true });
          }
        }
      }
      return results;
    };

    return filter(tree);
  });

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  toggleFolder(folder: FileSystemItem): void {
    this.fileSystemService.toggleFolder(folder.path);
  }

  async openFile(file: FileSystemItem): Promise<void> {
    this.canvasService.openFile(await this.canvasService.fetchFileContent(file.path));
    
    // On smaller screens, hide the sidebar after opening a file for a better UX
    if (window.innerWidth < 1024) {
      this.uiStateService.toggleSidebar();
    }
  }
  
  openSettings(): void {
    this.uiStateService.toggleSettingsModal();
  }
}
