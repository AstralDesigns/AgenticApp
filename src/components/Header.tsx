import { Menu, MessageSquare, Settings, Command } from 'lucide-react';
import { useStore } from '../store';
import CanvasIcon from './CanvasIcon';

export default function Header() {
  const { toggleSidebar, toggleChat, setShowSettings } = useStore();

  const handleCommandPalette = () => {
    // Dispatch event to trigger command palette in editor
    window.dispatchEvent(new CustomEvent('trigger-command-palette'));
  };

  return (
    <header 
      className="h-7 backdrop-blur-sm border-b flex items-center justify-between px-2 shrink-0 z-30 transition-colors"
      style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center gap-1.5">
        <div className="scale-90 origin-left">
          <CanvasIcon />
        </div>
        <button
          onClick={toggleSidebar}
          data-tooltip="Toggle Explorer"
          data-tooltip-position="bottom"
          data-tooltip-align="left"
          className="p-1 rounded hover:bg-white/10 transition-colors text-muted hover:text-foreground"
        >
          <Menu className="h-3.5 w-3.5" />
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-2">
        <button
          onClick={handleCommandPalette}
          className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md text-xs text-muted transition-colors w-64 justify-between group"
        >
          <div className="flex items-center gap-1.5">
            <Command className="h-3 w-3" />
            <span>Command Palette...</span>
          </div>
          <span className="opacity-0 group-hover:opacity-50 text-[10px]">F1</span>
        </button>
      </div>
      
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleChat}
          data-tooltip="Toggle Chat"
          data-tooltip-position="bottom"
          className="p-1 rounded hover:bg-white/10 transition-colors text-muted hover:text-foreground"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setShowSettings(true)}
          data-tooltip="Settings"
          data-tooltip-position="bottom"
          data-tooltip-align="right"
          className="p-1 rounded hover:bg-white/10 transition-colors text-muted hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
