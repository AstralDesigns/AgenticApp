import { Injectable, signal } from '@angular/core';

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  icon: 'code' | 'folder' | 'image' | 'video' | 'markdown' | 'json';
  thumbnailUrl?: string;
  children?: FileSystemItem[];
  isOpen?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FileSystemService {
  fileTreeState = signal<FileSystemItem[]>([
    {
      name: 'my-agentic-app',
      type: 'folder',
      icon: 'folder',
      path: '.',
      isOpen: true,
      children: [
        { name: 'package.json', type: 'file', icon: 'json', path: 'package.json' },
        {
          name: 'src',
          type: 'folder',
          icon: 'folder',
          path: 'src',
          isOpen: true,
          children: [
            { name: 'app.component.html', type: 'file', icon: 'code', path: 'src/app.component.html' },
            { name: 'app.component.ts', type: 'file', icon: 'code', path: 'src/app.component.ts' },
          ],
        },
        {
          name: 'assets',
          type: 'folder',
          icon: 'folder',
          path: 'assets',
          isOpen: true,
          children: [
            { name: 'logo.png', type: 'file', icon: 'image', path: 'assets/logo.png', thumbnailUrl: 'https://picsum.photos/seed/agentic-logo/40/40' },
            { name: 'sample.gif', type: 'file', icon: 'image', path: 'assets/sample.gif', thumbnailUrl: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3N5M3VmaTZuZmZuaXNsc3M5b2p2a2pjaTUxZHM2M3g2cnZodDQyZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyE/40x40.gif' },
            { name: 'demo.mp4', type: 'file', icon: 'video', path: 'assets/demo.mp4', thumbnailUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4#t=0.5' },
          ],
        },
        { name: 'README.md', type: 'file', icon: 'markdown', path: 'README.md' },
      ],
    },
  ]);

  toggleFolder(folderPath: string): void {
    const toggle = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => {
        if (item.path === folderPath && item.type === 'folder') {
          return { ...item, isOpen: !item.isOpen };
        }
        if (item.children) {
          return { ...item, children: toggle(item.children) };
        }
        return item;
      });
    };
    this.fileTreeState.update(tree => toggle(tree));
  }
  
  getMediaPlaylist(filePath: string): FileSystemItem[] {
    let parent: FileSystemItem | null = null;
    
    // This recursive function finds the target file and captures its parent.
    const findParent = (items: FileSystemItem[], currentParent: FileSystemItem | null): boolean => {
      for (const item of items) {
        if (item.path === filePath) {
          parent = currentParent;
          return true; // Target found
        }
        if (item.children) {
          if (findParent(item.children, item)) {
            return true; // Target found in a subdirectory
          }
        }
      }
      return false; // Target not found in this branch
    };
    
    // Start the search from the root of the file tree.
    findParent(this.fileTreeState(), null);
    
    if (parent && parent.children) {
      // If a parent was found, filter its children for media files.
      return parent.children.filter(
        (child) => child.type === 'file' && (child.icon === 'image' || child.icon === 'video')
      );
    }
    
    // If no parent is found (e.g., it's a root file, though not in our structure), return empty.
    return [];
  }
}
