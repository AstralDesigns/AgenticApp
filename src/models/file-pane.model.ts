import { FileSystemItem } from './file-system-item.model';

export type FileType = 'code' | 'markdown' | 'image' | 'video' | 'pdf' | 'welcome' | 'image-gallery' | 'video-gallery';

export interface FilePane {
  id: string; // Typically the file path or a unique ID for galleries
  name: string;
  type: FileType;
  content: string; // Content for text-based files, or a URL for media
  language?: string; // e.g., 'typescript' for code files
  isUnsaved?: boolean;
  data?: FileSystemItem[]; // Used to pass playlist data to galleries
}
