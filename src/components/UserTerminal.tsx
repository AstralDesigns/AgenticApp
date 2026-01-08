import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { useStore } from '../store';
import 'xterm/css/xterm.css';

// Map app themes to XTerm themes
const getXtermTheme = (theme: string, customTheme?: any) => {
  const isLight = theme === 'light';
  
  if (theme === 'custom' && customTheme) {
    return {
      background: '#00000000', // Fully transparent to let container bg show through
      foreground: customTheme.colors.textPrimary || '#f8fafc',
      cursor: customTheme.colors.accentColor || '#0ea5e9',
      selectionBackground: customTheme.colors.accentColor + '40',
      black: '#000000',
      red: '#ef4444',
      green: '#22c55e',
      yellow: '#eab308',
      blue: customTheme.colors.accentColor || '#3b82f6',
      magenta: '#a855f7',
      cyan: '#06b6d4',
      white: '#ffffff',
      brightBlack: '#4b5563',
      brightRed: '#f87171',
      brightGreen: '#4ade80',
      brightYellow: '#fde047',
      brightBlue: '#60a5fa',
      brightMagenta: '#c084fc',
      brightCyan: '#22d3ee',
      brightWhite: '#ffffff',
    };
  }

  // Default Alpha/Dark theme
  if (!isLight) {
    return {
      background: '#00000000', 
      foreground: '#f8fafc',
      cursor: '#0ea5e9',
      selectionBackground: '#334155',
      black: '#1e293b',
      red: '#f43f5e',
      green: '#10b981',
      yellow: '#f59e0b',
      blue: '#3b82f6',
      magenta: '#d946ef',
      cyan: '#06b6d4',
      white: '#f8fafc',
      brightBlack: '#475569',
      brightRed: '#fb7185',
      brightGreen: '#34d399',
      brightYellow: '#fbbf24',
      brightBlue: '#60a5fa',
      brightMagenta: '#e879f9',
      brightCyan: '#22d3ee',
      brightWhite: '#ffffff',
    };
  }

  // Light theme
  return {
    background: '#ffffff',
    foreground: '#0f172a',
    cursor: '#2563eb',
    selectionBackground: '#bfdbfe',
    black: '#000000',
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#eab308',
    blue: '#2563eb',
    magenta: '#a855f7',
    cyan: '#06b6d4',
    white: '#ffffff',
    brightBlack: '#4b5563',
    brightRed: '#f87171',
    brightGreen: '#4ade80',
    brightYellow: '#fde047',
    brightBlue: '#60a5fa',
    brightMagenta: '#c084fc',
    brightCyan: '#22d3ee',
    brightWhite: '#ffffff',
  };
};

export default function UserTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const ptyId = useRef<string | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const { theme, customThemes, activeCustomThemeId, projectContext, terminalSettings } = useStore();
  const initialized = useRef(false);

  // Safe fit function that checks DOM state
  const fitTerminal = () => {
    if (!fitAddonRef.current || !terminalRef.current || !xtermRef.current) return;
    
    // Only fit if the container has dimensions
    if (terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
      try {
        fitAddonRef.current.fit();
        
        // Sync with PTY if active
        if (ptyId.current && window.electronAPI?.pty) {
          const { cols, rows } = xtermRef.current;
          if (cols > 0 && rows > 0) {
            window.electronAPI.pty.resize(ptyId.current, cols, rows);
          }
        }
      } catch (e) {
        // Suppress fit errors during transitions
      }
    }
  };

  // Initialize Terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current || initialized.current) return;
    initialized.current = true;

    // Create unique ID for this session if not exists
    if (!ptyId.current) {
        ptyId.current = `pty-${Date.now()}`;
    }

    const term = new Terminal({
      cursorBlink: terminalSettings.cursorBlink,
      cursorStyle: terminalSettings.cursorStyle,
      fontFamily: terminalSettings.fontFamily,
      fontSize: terminalSettings.fontSize,
      lineHeight: 1.2,
      theme: getXtermTheme(theme, customThemes.find(t => t.id === activeCustomThemeId)),
      allowTransparency: true,
      scrollback: 5000,
      convertEol: true, 
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    // NOTE: ImageAddon removed as it was causing renderer crashes ("dimensions" undefined)

    term.open(terminalRef.current);
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Use ResizeObserver for robust layout handling
    const resizeObserver = new ResizeObserver(() => {
        // Use requestAnimationFrame to debounce and ensure DOM render
        requestAnimationFrame(() => {
            fitTerminal();
        });
    });
    
    resizeObserver.observe(terminalRef.current);
    resizeObserverRef.current = resizeObserver;

    // Initial fit attempt with delay to ensure DOM is ready
    setTimeout(() => {
        fitTerminal();
    }, 100);

    // ASCII Art
    if (terminalSettings.showAscii && terminalSettings.customAscii) {
       const formattedAscii = terminalSettings.customAscii.replace(/\n/g, '\r\n');
       const colorCode = '\x1b[38;2;14;165;233m'; 
       const resetCode = '\x1b[0m';
       term.write(colorCode + formattedAscii + resetCode + '\r\n\r\n');
    }

    // Initialize PTY
    if (window.electronAPI?.pty && ptyId.current) {
      // Calculate initial dimensions based on container or default
      const cols = term.cols || 80;
      const rows = term.rows || 24;

      window.electronAPI.pty.create({
        id: ptyId.current,
        cols,
        rows,
        cwd: projectContext || undefined,
      }).then(() => {
        // Wire up data listener
        const disposeData = window.electronAPI.pty.onData(({ id, data }) => {
          if (id === ptyId.current) {
            term.write(data);
          }
        });

        // Handle input
        term.onData((data) => {
          if (ptyId.current) {
            window.electronAPI?.pty.write(ptyId.current, data);
          }
        });

        // Focus terminal on click
        terminalRef.current?.addEventListener('click', () => term.focus());
        
        // Auto-focus immediately
        setTimeout(() => term.focus(), 100);

        // Cleanup function for this listener
        return () => {
          disposeData();
        };
      });

    } else {
      term.write('\r\n\x1b[31mTerminal not supported in this environment.\x1b[0m\r\n');
    }

    // Cleanup on unmount
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      term.dispose();
      if (ptyId.current && window.electronAPI?.pty) {
        window.electronAPI.pty.kill(ptyId.current);
      }
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []); // Run once on mount

  // Update options dynamically (Hot Updates)
  useEffect(() => {
    if (xtermRef.current) {
      const term = xtermRef.current;
      
      // Update options
      term.options.fontSize = terminalSettings.fontSize;
      term.options.cursorStyle = terminalSettings.cursorStyle;
      term.options.cursorBlink = terminalSettings.cursorBlink;
      term.options.fontFamily = terminalSettings.fontFamily;
      
      // Update theme
      const customTheme = customThemes.find(t => t.id === activeCustomThemeId);
      term.options.theme = getXtermTheme(theme, customTheme);
      
      // Trigger a refit when font options change as character size changes
      setTimeout(() => {
          fitTerminal();
      }, 50);
    }
  }, [terminalSettings, theme, activeCustomThemeId, customThemes]);

  return (
    <div 
      className="h-full w-full p-3 overflow-hidden bg-black/20"
      style={{
          backdropFilter: 'blur(4px)',
      }}
    >
      <div 
         ref={terminalRef} 
         className="h-full w-full rounded-lg overflow-hidden border border-white/5 shadow-inner"
         style={{
             padding: '4px 0 0 8px' 
         }}
      />
    </div>
  );
}
