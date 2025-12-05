import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { FilePane } from '../models/file-pane.model';
import { FileSystemService } from './file-system.service';
import { FileSystemItem } from '../models/file-system-item.model';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  private readonly WORKSPACE_STATE_KEY = 'agentic-studio-workspace-v1';
  private fileSystemService = inject(FileSystemService);
  panes = signal<FilePane[]>([]);
  activePaneId = signal<string | null>(null);
  private untitledCounter = signal(0);

  activePane = computed(() => {
    const panes = this.panes();
    const activeId = this.activePaneId();
    if (!activeId) return null;
    return panes.find(p => p.id === activeId) ?? null;
  });

  hasOpenPanes = computed(() => this.panes().length > 0);

  constructor() {
    this.loadState();
    
    effect(() => {
      const panes = this.panes();
      const activePaneId = this.activePaneId();
      if (panes.length > 0) {
        const state = {
          panes: panes.map(({ data, ...pane }) => pane), // Don't save large data objects
          activePaneId,
        };
        try {
          localStorage.setItem(this.WORKSPACE_STATE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error('Failed to save workspace state:', e);
        }
      } else {
        localStorage.removeItem(this.WORKSPACE_STATE_KEY);
      }
    });
  }

  private async loadState(): Promise<void> {
    try {
      const savedState = localStorage.getItem(this.WORKSPACE_STATE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.panes && state.activePaneId) {
          // Re-fetch content for saved files to ensure they are up-to-date
          const refreshedPanes = await Promise.all(state.panes.map(async (p: FilePane) => {
            if (p.id.startsWith('untitled-') || p.id === 'welcome' || p.id.startsWith('gallery:')) {
              return p; // It's an unsaved, welcome, or gallery pane
            }
            const content = await this.fileSystemService.readFileContent(p.id);
            return { ...p, content, isUnsaved: false };
          }));

          this.panes.set(refreshedPanes);
          this.activePaneId.set(state.activePaneId);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load workspace state:', e);
      localStorage.removeItem(this.WORKSPACE_STATE_KEY);
    }
    
    this.openWelcomePane();
  }

  private openWelcomePane(): void {
    this.openFileByPath('welcome'); // Special path
  }

  async openFileByPath(filePath: string): Promise<void> {
    if (filePath === 'welcome') {
      const welcomePane: FilePane = {
         id: 'welcome',
         name: 'Welcome.md',
         type: 'welcome',
         content: `# Welcome to Agentic Studio\nThis is now a native desktop application!`,
         isUnsaved: false,
      };
      this.openPane(welcomePane);
      return;
    }

    const content = await this.fileSystemService.readFileContent(filePath);
    const name = filePath.split('/').pop() || filePath;
    const language = this.getLanguageFromPath(filePath);
    
    const filePane: FilePane = {
      id: filePath,
      name,
      type: 'code',
      content,
      language,
      isUnsaved: false,
    };
    this.openPane(filePane);
  }

  openPane(pane: FilePane): void {
    const existing = this.panes().find(p => p.id === pane.id);
    if (!existing) {
      this.panes.update(panes => [...panes, pane]);
    }
    this.setActivePane(pane.id);
  }

  createNewFile(type: 'markdown' | 'code'): void {
    this.untitledCounter.update(c => c + 1);
    const newCount = this.untitledCounter();
    const extension = type === 'markdown' ? 'md' : 'ts';
    const name = `Untitled-${newCount}.${extension}`;
    const newPane: FilePane = {
      id: `untitled-${Date.now()}`,
      name: name,
      type: type,
      content: '',
      isUnsaved: true,
      language: type === 'code' ? 'typescript' : undefined,
    };
    this.openPane(newPane);
  }

  updateActivePaneContent(newContent: string): void {
    const activeId = this.activePaneId();
    if (!activeId) return;

    this.panes.update(panes => {
      return panes.map(p =>
        p.id === activeId
          ? { ...p, content: newContent, isUnsaved: true }
          : p
      );
    });
  }

  setActivePane(id: string): void {
    this.activePaneId.set(id);
  }

  closePane(id: string): void {
    this.panes.update(panes => {
      const index = panes.findIndex(p => p.id === id);
      if (index === -1) return panes;

      const newPanes = panes.filter(p => p.id !== id);

      if (this.activePaneId() === id) {
        if (newPanes.length > 0) {
          const newIndex = Math.max(0, index - 1);
          this.activePaneId.set(newPanes[newIndex].id);
        } else {
          this.activePaneId.set(null);
        }
      }
      return newPanes;
    });
  }

  private getLanguageFromPath(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts': return 'typescript';
      case 'js': return 'javascript';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  }
}
