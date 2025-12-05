import { Injectable, inject } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../models/chat.model';
import { SettingsService } from './settings.service';

/**
 * This service now handles multiple AI providers.
 */
@Injectable({
  providedIn: 'root',
})
export class AiService {
  private settingsService = inject(SettingsService);

  async *sendMessageStream(
    history: ChatMessage[],
    message: string
  ): AsyncGenerator<string, void, unknown> {
    const settings = this.settingsService.settings();
    
    if (!settings.provider || !settings.apiKey) {
      yield 'AI provider is not configured. Please go to Settings.';
      return;
    }

    if (settings.provider === 'gemini') {
      yield* this.sendToGemini(history, message, settings.apiKey);
    } else if (settings.provider === 'groq') {
      yield* this.sendToGroq(history, message, settings.apiKey);
    } else {
      yield `Unsupported provider: ${settings.provider}`;
    }
  }

  private async *sendToGemini(history: ChatMessage[], message: string, apiKey: string): AsyncGenerator<string, void, unknown> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      // Note: For a real app, chat history should be managed properly
      const chat = ai.chats.create({ model: 'gemini-2.5-flash' });
      const response = await chat.sendMessageStream({ message });
      for await (const chunk of response) {
        yield chunk.text;
      }
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      yield 'An error occurred while communicating with Gemini. Is the API key correct?';
    }
  }

  private async *sendToGroq(history: ChatMessage[], message: string, apiKey: string): AsyncGenerator<string, void, unknown> {
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    // Map history to OpenAI format
    const messages = [
        ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
        { role: 'user', content: message }
    ];

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192', // A common fast model on Groq
          messages: messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Groq API Error: ${errorBody.error?.message ?? 'Unknown error'}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
          throw new Error('Could not get reader from response body.');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last, possibly incomplete line

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6);
                if (jsonStr === '[DONE]') {
                    return;
                }
                try {
                    const chunk = JSON.parse(jsonStr);
                    if (chunk.choices && chunk.choices[0].delta.content) {
                        yield chunk.choices[0].delta.content;
                    }
                } catch (e) {
                    console.error('Error parsing stream chunk:', e);
                }
            }
        }
      }
    } catch (error) {
      console.error('Error sending message to Groq:', error);
      yield `An error occurred while communicating with Groq. ${error}`;
    }
  }
}
