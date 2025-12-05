import { Injectable, signal, computed } from '@angular/core';
import { FilePane } from '../models/file-pane.model';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  panes = signal<FilePane[]>([]);
  activePaneId = signal<string | null>(null);

  activePane = computed(() => {
    const panes = this.panes();
    const activeId = this.activePaneId();
    if (!activeId) return null;
    return panes.find(p => p.id === activeId) ?? null;
  });

  hasOpenPanes = computed(() => this.panes().length > 0);

  constructor() {
    this.openFile({
        id: 'welcome',
        name: 'Welcome.md',
        type: 'markdown',
        content: `
# Welcome to Agentic Studio

This is an interactive canvas where you can view and edit files.

- Use the **Explorer** on the left to open files.
- Chat with the **AI Agent** to generate code, write documents, or perform tasks.
- The agent can open files here for you to review.

Try asking the agent: *"Open the main app component for me."*
        `
    });
  }

  openFile(pane: FilePane): void {
    const existing = this.panes().find(p => p.id === pane.id);
    if (!existing) {
      this.panes.update(panes => [...panes, pane]);
    }
    this.setActivePane(pane.id);
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

  // Mock fetching file content
  async fetchFileContent(path: string): Promise<FilePane> {
    // In a real desktop app, this would use native file system APIs.
    const MOCK_FILES: Record<string, Omit<FilePane, 'id'|'name'>> = {
      'src/app.component.ts': { type: 'code', language: 'typescript', content: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { WorkspaceComponent } from './components/workspace/workspace.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SidebarComponent, WorkspaceComponent],
})
export class AppComponent {}` },
      'src/app.component.html': { type: 'code', language: 'html', content: `<div class="flex h-screen w-full font-sans">
  <app-sidebar></app-sidebar>
  <app-workspace></app-workspace>
</div>`},
      'package.json': { type: 'code', language: 'json', content: `{
  "name": "agentic-studio",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@angular/common": "^18.0.0",
    "@angular/core": "^18.0.0",
    "@google/genai": "^0.2.1"
  }
}`},
      'README.md': { type: 'markdown', content: `# Project README

This is the main README file for the project. It contains important information about setting up and running the application.`},
      'assets/logo.png': { type: 'image', content: 'https://picsum.photos/seed/agentic-logo/400/400' },
      'assets/demo.mp4': { type: 'video', content: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4'}
    };
    
    if (path in MOCK_FILES) {
        const file = MOCK_FILES[path];
        return {
            id: path,
            name: path.split('/').pop() || path,
            ...file
        };
    }

    return {
        id: path,
        name: path.split('/').pop() || path,
        type: 'code',
        language: 'plaintext',
        content: `// Mock file not found: ${path}`
    };
  }
}
