import { Injectable, signal, effect, computed } from '@angular/core';
import { FileSystemItem } from '../models/file-system-item.model';

@Injectable({
  providedIn: 'root',
})
export class FileSystemService {
  // Signals to hold the current state
  currentPath = signal<string>('~');
  directoryContent = signal<FileSystemItem[]>([]);
  
  constructor() {
    // When currentPath changes, automatically read the new directory
    effect(async () => {
      const path = this.currentPath();
      const result = await window.electronAPI.readDirectory(path);
      if ('error' in result) {
        console.error(result.error);
        this.directoryContent.set([]);
      } else {
        this.directoryContent.set(result);
      }
    });
  }

  // A computed signal for breadcrumbs
  breadcrumbs = computed(() => {
    const path = this.currentPath();
    if (path === '~') return [{ name: '~', path: '~' }];

    const parts = path.split('/').filter(p => p);
    const crumbs = parts.map((part, index) => {
      const crumbPath = '/' + parts.slice(0, index + 1).join('/');
      return { name: part, path: crumbPath };
    });
    return [{ name: '/', path: '/' }, ...crumbs];
  });

  navigateTo(path: string): void {
    this.currentPath.set(path);
  }

  navigateUp(): void {
    const current = this.currentPath();
    if (current === '~' || current === '/') return;
    const parentPath = current.substring(0, current.lastIndexOf('/')) || '/';
    this.currentPath.set(parentPath);
  }

  goHome(): void {
    this.currentPath.set('~');
  }

  // This method is now used by the canvas to get real file content
  async readFileContent(filePath: string): Promise<string> {
    const result = await window.electronAPI.readFile(filePath);
    if ('error' in result) {
      console.error(result.error);
      return `// Error reading file: ${result.error}`;
    }
    // FIX: Prevent rendering binary content in the text editor.
    if (result.encoding === 'base64') {
      return `// Binary file content not displayed: ${filePath}`;
    }
    return result.content;
  }

  // FIX: Add a new method to get raw file data for components that need to handle different encodings.
  async readFile(filePath: string): Promise<{ error: string } | { content: string; encoding: 'utf-8' | 'base64' }> {
    return window.electronAPI.readFile(filePath);
  }

  // Media playlist logic remains similar but operates on the dynamic directory content
  getMediaPlaylist(filePath: string): FileSystemItem[] {
    const content = this.directoryContent();
    const targetFile = content.find(child => child.path === filePath);
    if (!targetFile) return [];

    const getIconType = (name: string): string => {
      const ext = name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext!)) return 'image';
      if (['mp4', 'webm', 'mov', 'mkv'].includes(ext!)) return 'video';
      return 'file';
    };

    const targetIconType = getIconType(targetFile.name);

    return content.filter(
      (child) => child.type === 'file' && getIconType(child.name) === targetIconType
    );
  }
}
