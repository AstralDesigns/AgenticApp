import { FileSystemItem } from './models/file-system-item.model';

export interface IElectronAPI {
  readDirectory: (path: string) => Promise<{ error: string } | FileSystemItem[]>;
  // FIX: Update the return type to include encoding information for the file content.
  readFile: (path: string) => Promise<{ error: string } | { content: string; encoding: 'utf-8' | 'base64' }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
