import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, AiProvider, AppSettings } from '../../services/settings.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private settingsService = inject(SettingsService);
  private uiStateService = inject(UiStateService);

  isFirstTime = !this.settingsService.isConfigured();
  
  selectedProvider = signal<AiProvider | null>(this.settingsService.settings().provider ?? 'gemini');
  apiKey = signal(this.settingsService.settings().apiKey ?? '');
  
  isTesting = signal(false);
  testStatus = signal<'unknown' | 'success' | 'error'>('unknown');
  testMessage = signal('');

  saveSettings(): void {
    const settings: AppSettings = {
      provider: this.selectedProvider(),
      apiKey: this.apiKey(),
    };
    this.settingsService.saveSettings(settings);
    
    // If modal was opened manually, close it. First-time setup stays open until saved.
    if (!this.isFirstTime) {
      this.uiStateService.toggleSettingsModal();
    }
  }

  closeModal(): void {
    // Only allow closing if it's not the mandatory first-time setup
    if (!this.isFirstTime) {
      this.uiStateService.toggleSettingsModal();
    }
  }

  // Mock test connection to provide UI feedback without a real backend
  async testConnection(): Promise<void> {
    this.isTesting.set(true);
    this.testStatus.set('unknown');
    this.testMessage.set('');
    
    // Simulate API call latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Basic validation for demonstration purposes
    if (this.apiKey() && this.apiKey().length > 10) {
      this.testStatus.set('success');
      this.testMessage.set('Connection successful!');
    } else {
      this.testStatus.set('error');
      this.testMessage.set('Invalid API Key. Please check and try again.');
    }
    
    this.isTesting.set(false);
  }
}
