import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasService } from '../../services/canvas.service';

interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  icon: 'code' | 'folder' | 'image' | 'video' | 'markdown' | 'json';
  children?: FileSystemItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class SidebarComponent {
  private canvasService = inject(CanvasService);
  searchTerm = signal('');

  private fileTreeState = signal<FileSystemItem[]>([
    { 
      name: 'my-agentic-app', type: 'folder', icon: 'folder', path: '.', isOpen: true,
      children: [
        { name: 'package.json', type: 'file', icon: 'json', path: 'package.json'},
        {
          name: 'src', type: 'folder', icon: 'folder', path: 'src', isOpen: true,
          children: [
            { name: 'app.component.html', type: 'file', icon: 'code', path: 'src/app.component.html' },
            { name: 'app.component.ts', type: 'file', icon: 'code', path: 'src/app.component.ts' },
          ]
        },
        {
          name: 'assets', type: 'folder', icon: 'folder', path: 'assets', isOpen: false,
          children: [
            { name: 'logo.png', type: 'file', icon: 'image', path: 'assets/logo.png'},
            { name: 'demo.mp4', type: 'file', icon: 'video', path: 'assets/demo.mp4'},
          ]
        },
        { name: 'README.md', type: 'file', icon: 'markdown', path: 'README.md'},
      ]
    }
  ]);

  fileTree = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.fileTreeState();
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

    return filter(this.fileTreeState());
  });

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  toggleFolder(folder: FileSystemItem): void {
    const toggle = (items: FileSystemItem[], targetPath: string): FileSystemItem[] => {
        return items.map(item => {
            if (item.path === targetPath) {
                return { ...item, isOpen: !item.isOpen };
            }
            if (item.children) {
                return { ...item, children: toggle(item.children, targetPath) };
            }
            return item;
        });
    };
    this.fileTreeState.update(tree => toggle(tree, folder.path));
  }

  async openFile(file: FileSystemItem): Promise<void> {
    if (file.type === 'file') {
      const filePane = await this.canvasService.fetchFileContent(file.path);
      this.canvasService.openFile(filePane);
    }
  }
}