import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { HeaderComponent } from './components/header/header.component';
import { ChatComponent } from './components/chat/chat.component';
import { UiStateService } from './services/ui-state.service';
import { SettingsService } from './services/settings.service';
import { SettingsComponent } from './components/settings/settings.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    WorkspaceComponent,
    ChatComponent,
    SettingsComponent,
  ],
})
export class AppComponent {
  uiStateService = inject(UiStateService);
  settingsService = inject(SettingsService);

  showSettings = computed(() => !this.settingsService.isConfigured() || this.uiStateService.settingsModalVisible());
}
