export type FileType = 'code' | 'markdown' | 'image' | 'video' | 'pdf' | 'welcome';

export interface FilePane {
  id: string; // Typically the file path
  name: string;
  type: FileType;
  content: string; // Content for text-based files, or a URL for media
  language?: string; // e.g., 'typescript' for code files
}
