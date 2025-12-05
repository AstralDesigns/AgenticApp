export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  icon: 'code' | 'folder' | 'image' | 'video' | 'markdown' | 'json';
  thumbnailUrl?: string;
  children?: FileSystemItem[];
  isOpen?: boolean;
}
