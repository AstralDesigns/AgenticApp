import { Injectable } from '@angular/core';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage } from '../models/chat.model';

// IMPORTANT: This service is currently mocked for the Applet environment.
// The `process.env.API_KEY` is not available here. A real implementation
// would require a secure way to provide the API key, likely through a backend proxy.

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private chat: Chat | null = null;
  private readonly isMockMode = true; // Set to false to try with a real key if available

  constructor() {
    if (!this.isMockMode) {
      try {
        // This line assumes process.env.API_KEY is replaced at build time or provided globally.
        // It will fail in the default Applet environment.
        const apiKey = (process.env as any).API_KEY;
        if (!apiKey) {
          throw new Error('API_KEY is not configured.');
        }
        const ai = new GoogleGenAI({ apiKey });
        this.chat = ai.chats.create({
          model: 'gemini-2.5-flash',
        });
      } catch (error) {
        console.error('Failed to initialize Gemini Service:', error);
      }
    }
  }

  async *sendMessageStream(
    history: ChatMessage[],
    message: string
  ): AsyncGenerator<string, void, unknown> {
    if (this.isMockMode || !this.chat) {
      if (message.toLowerCase().includes('open') && message.includes('app component')) {
        yield* this.mockOpenFileResponse();
      } else {
        yield* this.mockGenericResponse();
      }
      return;
    }

    try {
      const response = await this.chat.sendMessageStream({ message });
      for await (const chunk of response) {
        yield chunk.text;
      }
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      yield 'An error occurred while communicating with the AI. Please check the console.';
    }
  }

  private async *mockOpenFileResponse(): AsyncGenerator<string, void, unknown> {
    const mockResponse = `
Of course! I can open the main app component for you. I'll load \`src/app.component.ts\` into the canvas.

[ACTION:OPEN_FILE:src/app.component.ts]

As you can see, it sets up the main layout with the sidebar and the new workspace component. Let me know if you would like me to open any other files!
    `;
    const words = mockResponse.split(/(\s+)/); // Split by space, keeping spaces
    for (const word of words) {
      yield word;
      await new Promise(resolve => setTimeout(resolve, 25)); // Simulate network latency
    }
  }
  
  private async *mockGenericResponse(): AsyncGenerator<string, void, unknown> {
    const mockResponse = `
I am Agentic Studio's AI assistant. I can help you with a variety of tasks, including opening and modifying files.

For example, you can ask me to:
- *"Open the main app component for me."*
- *"What is in the README.md file?"*
- *"Show me the project's package.json."*

How can I assist you?
    `;
    const words = mockResponse.split(/(\s+)/); // Split by space, keeping spaces
    for (const word of words) {
      yield word;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
}