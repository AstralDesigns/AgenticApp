import { FileSystemItem } from './models/file-system-item.model';

export interface IElectronAPI {
  readDirectory: (path: string) => Promise<{ error: string } | FileSystemItem[]>;
  readFile: (path: string) => Promise<{ error: string } | { content: string }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
