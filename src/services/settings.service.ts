import { Injectable, signal, computed } from '@angular/core';

export type AiProvider = 'gemini' | 'groq';

export interface AppSettings {
  provider: AiProvider | null;
  apiKey: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly SETTINGS_KEY = 'agentic-studio-settings';
  
  settings = signal<AppSettings>({ provider: null, apiKey: null });

  isConfigured = computed(() => {
    const s = this.settings();
    return !!s.provider && !!s.apiKey;
  });

  constructor() {
    this.loadSettings();
  }

  loadSettings(): void {
    try {
      const storedSettings = localStorage.getItem(this.SETTINGS_KEY);
      if (storedSettings) {
        this.settings.set(JSON.parse(storedSettings));
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
  }

  saveSettings(settings: AppSettings): void {
    try {
      this.settings.set(settings);
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }
}
