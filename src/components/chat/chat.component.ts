import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/gemini.service';
import { ChatMessage } from '../../models/chat.model';
import { CanvasService } from '../../services/canvas.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
})
export class ChatComponent {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  
  private aiService = inject(AiService);
  private canvasService = inject(CanvasService);

  userInput = signal('');
  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);

  history = computed(() => this.messages().slice(0, -1));

  constructor() {
    effect(() => {
      if (this.messages().length) {
        this.scrollToBottom();
      }
    });
  }

  async sendMessage(): Promise<void> {
    const messageContent = this.userInput().trim();
    if (!messageContent || this.isLoading()) {
      return;
    }

    this.messages.update(m => [...m, { role: 'user', content: messageContent }]);
    this.userInput.set('');
    this.isLoading.set(true);

    this.messages.update(m => [...m, { role: 'model', content: '' }]);
    
    try {
      const stream = this.aiService.sendMessageStream(this.history(), messageContent);
      for await (const chunk of stream) {
        this.messages.update(m => {
          const lastMessage = m[m.length - 1];
          lastMessage.content += chunk;
          return [...m.slice(0, -1), lastMessage];
        });
        this.scrollToBottom();
      }

      // After stream is complete, parse for actions
      const finalMessage = this.messages()[this.messages().length - 1];
      if (finalMessage) {
        this.parseAndExecuteAction(finalMessage.content);
      }

    } catch (error) {
      console.error('Error in chat component:', error);
      this.messages.update(m => {
        const lastMessage = m[m.length - 1];
        lastMessage.content = 'Sorry, something went wrong. Please try again.';
        return [...m.slice(0, -1), lastMessage];
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  private async parseAndExecuteAction(content: string) {
    const actionRegex = /\[ACTION:OPEN_FILE:(.*?)\]/;
    const match = content.match(actionRegex);
    
    if (match && match[1]) {
      const filePath = match[1].trim();
      const filePane = await this.canvasService.fetchFileContent(filePath);
      this.canvasService.openFile(filePane);
      
      // Remove the action string from the displayed message for a cleaner UI
      this.messages.update(m => {
        const lastMessage = m[m.length - 1];
        if (lastMessage) {
          lastMessage.content = lastMessage.content.replace(actionRegex, '').trim();
        }
        return [...m];
      });
    }
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }, 0);
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }
}
