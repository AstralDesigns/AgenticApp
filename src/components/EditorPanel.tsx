import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../store';

interface EditorPanelProps {
  filePath: string | null;
  content: string;
  onChange: (content: string) => void;
  language?: string;
}

export default function EditorPanel({ filePath, content, onChange, language }: EditorPanelProps) {
  const [editorContent, setEditorContent] = useState(content);
  const editorRef = useRef<any>(null);
  const { theme, customThemes, activeCustomThemeId, activeStandardThemeId, saveFile, refreshOpenFiles } = useStore();

  // Update editor content when prop changes
  useEffect(() => {
    if (content !== editorContent) {
      setEditorContent(content);
    }
  }, [content]);

  // Handle window focus to check for external file changes
  useEffect(() => {
    const handleFocus = () => {
      // Refresh open files when app regains focus
      refreshOpenFiles();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshOpenFiles]);

  // Listen for global command palette trigger
  useEffect(() => {
    const handleTriggerPalette = () => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.trigger('anyString', 'editor.action.quickCommand', {});
      }
    };

    window.addEventListener('trigger-command-palette', handleTriggerPalette);
    return () => window.removeEventListener('trigger-command-palette', handleTriggerPalette);
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setEditorContent(newContent);
    onChange(newContent);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Auto-focus the editor when it mounts
    editor.focus();
    
    // Track editor selection for paste detection in chat
    const disposable = editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty() && filePath) {
        window.dispatchEvent(new CustomEvent('editor-selection-change', {
          detail: {
            filePath,
            startLine: selection.startLineNumber,
            endLine: selection.endLineNumber,
          }
        }));
      } else {
        // Clear selection
        window.dispatchEvent(new CustomEvent('editor-selection-change', {
          detail: null
        }));
      }
    });

    // Add Ctrl+S (Command+S on Mac) save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const activePaneId = useStore.getState().activePaneId;
      if (activePaneId) {
        saveFile(activePaneId);
      }
    });

    // Define themes
    defineMonacoThemes(monaco);
    applyTheme(monaco);

    // Enhanced autocompletion for multiple languages
    const languages = ['typescript', 'javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'shell', 'bash', 'powershell'];
    
    // Common snippets for all languages
    const commonSnippets = [
      {
        label: 'if',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'if (${1:condition}) {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'If statement',
      },
      {
        label: 'for',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'for (${1:let i = 0}; ${2:i < length}; ${3:i++}) {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'For loop',
      },
      {
        label: 'function',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Function declaration',
      },
      {
        label: 'try-catch',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'try {\n\t$1\n} catch (${2:error}) {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Try-catch block',
      },
    ];
    
    // TypeScript/JavaScript specific snippets
    const tsJsSnippets = [
      {
        label: 'arrow',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'const ${1:name} = (${2:params}) => {\n\t$0\n};',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Arrow function',
      },
      {
        label: 'async',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'async function ${1:name}(${2:params}) {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Async function',
      },
      {
        label: 'class',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'class ${1:Name} {\n\tconstructor(${2:params}) {\n\t\t$3\n\t}\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Class declaration',
      },
      {
        label: 'interface',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'interface ${1:Name} {\n\t$0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Interface declaration',
      },
      {
        label: 'export',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'export ${1|const,function,class,interface,type|} ${2:name} = $0;',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Export statement',
      },
    ];
    
    // Python specific snippets
    const pythonSnippets = [
      {
        label: 'def',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'def ${1:name}(${2:params}):\n\t$0',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Function definition',
      },
      {
        label: 'class',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'class ${1:Name}:\n\tdef __init__(self${2:, params}):\n\t\t$3\n\t$0',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Class definition',
      },
      {
        label: 'if __name__',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'if __name__ == "__main__":\n\t$0',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Main guard',
      },
    ];
    
    languages.forEach(lang => {
      const suggestions: any[] = [...commonSnippets];
      
      // Add language-specific snippets
      if (lang === 'typescript' || lang === 'javascript') {
        suggestions.push(...tsJsSnippets);
      } else if (lang === 'python') {
        suggestions.push(...pythonSnippets);
      }
      
      // Add common keywords as suggestions
      const keywords = lang === 'typescript' || lang === 'javascript' 
        ? ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'import', 'export', 'interface', 'type', 'class', 'extends', 'implements']
        : lang === 'python'
        ? ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as']
        : [];
      
      keywords.forEach(keyword => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          documentation: `${keyword} keyword`,
        });
      });
      
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          
          // Filter suggestions based on current word
          const filteredSuggestions = suggestions
            .filter(s => !word.word || s.label.toLowerCase().startsWith(word.word.toLowerCase()))
            .map(s => ({
              ...s,
              range,
            }));
          
          return {
            suggestions: filteredSuggestions,
          };
        },
        triggerCharacters: ['.', '(', '[', '{', ' ', ':', '<', '"', "'", '@', '#'],
      });
    });

    // Enhanced hover provider for better tooltips
    monaco.languages.registerHoverProvider(languages, {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (word) {
          return {
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [
              { value: `**${word.word}**` },
            ],
          };
        }
        return null;
      },
    });

    // Bracket matching colors
    editor.updateOptions({
      matchBrackets: 'always',
      colorDecorators: true,
    });

    // Word highlighting
    editor.onDidChangeCursorSelection(() => {
      const position = editor.getPosition();
      if (position) {
        const word = editor.getModel()?.getWordAtPosition(position);
        if (word) {
          editor.deltaDecorations([], [
            {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              options: {
                className: 'word-highlight',
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              },
            },
          ]);
        }
      }
    });
  };

  const defineMonacoThemes = (monaco: any) => {
    // Helper to get CSS variable values
    const getCssVar = (name: string) => {
      if (typeof window === 'undefined') return '#000000';
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    };

    // Deep theme configuration that covers internal widgets (palette, find, suggestions)
    const getCommonThemeRules = (baseColors: any) => {
      return {
        // Base Editor
        'editor.background': baseColors.bg,
        'editor.foreground': baseColors.fg,
        'editorLineNumber.foreground': baseColors.line,
        'editorLineNumber.activeForeground': baseColors.accent,
        'editor.selectionBackground': baseColors.selection,
        'editor.lineHighlightBackground': baseColors.lineHighlight,
        'editorCursor.foreground': baseColors.accent,
        
        // Command Palette / Quick Input
        'quickInput.background': baseColors.widgetBg,
        'quickInput.foreground': baseColors.fg,
        'quickInputTitle.background': baseColors.widgetBg,
        'pickerGroup.foreground': baseColors.accent,
        'pickerGroup.border': baseColors.border,
        
        // Lists (Suggestions, Palette results)
        'list.hoverBackground': baseColors.hover,
        'list.activeSelectionBackground': baseColors.accent + '33', // 20% opacity
        'list.activeSelectionForeground': baseColors.accent,
        'list.inactiveSelectionBackground': baseColors.hover,
        'list.hoverForeground': baseColors.fg,
        
        // Editor Widgets (Find/Replace, Hover)
        'editorWidget.background': baseColors.widgetBg,
        'editorWidget.border': baseColors.border,
        'editorSuggestWidget.background': baseColors.widgetBg,
        'editorSuggestWidget.border': baseColors.border,
        'editorSuggestWidget.selectedBackground': baseColors.accent + '33',
        'editorHoverWidget.background': baseColors.widgetBg,
        'editorHoverWidget.border': baseColors.border,
        
        // Inputs (Find box, etc)
        'input.background': baseColors.inputBg,
        'input.foreground': baseColors.fg,
        'input.border': baseColors.border,
        'inputOption.activeBorder': baseColors.accent,
        
        // Scrollbar
        'scrollbarSlider.background': baseColors.line + '33',
        'scrollbarSlider.hoverBackground': baseColors.line + '66',
        'scrollbarSlider.activeBackground': baseColors.line + '88',
      };
    };

    // Alpha Theme (Deep Slate)
    monaco.editor.defineTheme('alpha-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: getCommonThemeRules({
        bg: '#0f172a',
        fg: '#f8fafc',
        line: '#475569',
        accent: '#0ea5e9',
        selection: '#334155',
        lineHighlight: '#1e293b',
        border: '#1e293b',
        widgetBg: '#0f172a', // Matches --settings-bg
        hover: '#1e293b',
        inputBg: '#0f172a'
      })
    });

    // Dark Theme (Pure Black)
    monaco.editor.defineTheme('alpha-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: getCommonThemeRules({
        bg: '#000000',
        fg: '#ffffff',
        line: '#3f3f46',
        accent: '#ffffff',
        selection: '#27272a',
        lineHighlight: '#09090b',
        border: '#27272a',
        widgetBg: '#09090b',
        hover: '#27272a',
        inputBg: '#18181b'
      })
    });

    // Light Theme
    monaco.editor.defineTheme('alpha-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000' },
        { token: 'keyword', foreground: '0000ff' },
        { token: 'string', foreground: 'a31515' },
      ],
      colors: getCommonThemeRules({
        bg: '#ffffff',
        fg: '#0f172a',
        line: '#94a3b8',
        accent: '#2563eb',
        selection: '#e2e8f0',
        lineHighlight: '#f1f5f9',
        border: '#cbd5e1',
        widgetBg: '#ffffff',
        hover: '#f1f5f9',
        inputBg: '#ffffff'
      })
    });

    // Custom Theme
    if (theme === 'custom' && activeCustomThemeId) {
      const customTheme = customThemes.find(t => t.id === activeCustomThemeId);
      if (customTheme) {
        monaco.editor.defineTheme('alpha-custom', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: getCommonThemeRules({
            bg: customTheme.colors.bgPrimary,
            fg: customTheme.colors.textPrimary,
            line: customTheme.colors.textSecondary,
            accent: customTheme.colors.accentColor,
            selection: customTheme.colors.bgSecondary, // approximate
            lineHighlight: customTheme.colors.bgSecondary,
            border: customTheme.colors.borderColor,
            widgetBg: customTheme.colors.settingsBg,
            hover: customTheme.colors.bgSecondary,
            inputBg: customTheme.colors.inputBg
          })
        });
      }
    }

    // Standard Themes
    const standardThemes = {
      'catppuccin-mocha': { bg: '#1e1e2e', fg: '#cdd6f4', accent: '#cba6f7', line: '#313244' },
      'gruvbox': { bg: '#282828', fg: '#ebdbb2', accent: '#fabd2f', line: '#3c3836' },
      'tokyo-night': { bg: '#1a1b26', fg: '#a9b1d6', accent: '#7aa2f7', line: '#24283b' },
      'dracula': { bg: '#282a36', fg: '#f8f8f2', accent: '#bd93f9', line: '#44475a' },
      'solarized-dark': { bg: '#002b36', fg: '#839496', accent: '#268bd2', line: '#073642' },
      'monokai': { bg: '#272822', fg: '#f8f8f2', accent: '#f92672', line: '#3e3d32' },
      'rose-pine': { bg: '#191724', fg: '#e0def4', accent: '#ebbcba', line: '#26233a' },
      'graphite': { bg: '#2c2c2c', fg: '#e0e0e0', accent: '#666666', line: '#383838' },
      'crimson': { bg: '#1a0a0a', fg: '#ffd6d6', accent: '#ff4d4d', line: '#3d1414' },
      'greenify': { bg: '#0a1a0a', fg: '#d6ffd6', accent: '#4dff4d', line: '#143d14' },
    };

    Object.entries(standardThemes).forEach(([id, colors]) => {
      monaco.editor.defineTheme(`theme-${id}`, {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: getCommonThemeRules({
          bg: colors.bg,
          fg: colors.fg,
          line: colors.line,
          accent: colors.accent,
          selection: colors.line, // approximate
          lineHighlight: colors.line + '55',
          border: colors.line,
          widgetBg: colors.bg, // using main bg for widgets in standard themes unless defined
          hover: colors.line + '33',
          inputBg: colors.line + '22'
        })
      });
    });
  };

  const applyTheme = (monaco: any) => {
    if (theme === 'light') {
      monaco.editor.setTheme('alpha-light');
    } else if (theme === 'dark') {
      monaco.editor.setTheme('alpha-dark');
    } else if (theme === 'custom') {
      monaco.editor.setTheme('alpha-custom');
    } else if (theme === 'standard' && activeStandardThemeId) {
      monaco.editor.setTheme(`theme-${activeStandardThemeId}`);
    } else {
      monaco.editor.setTheme('alpha-theme');
    }
  };

  useEffect(() => {
    const monaco = (window as any).monaco;
    if (monaco) {
      defineMonacoThemes(monaco);
      applyTheme(monaco);
    }
  }, [theme, activeCustomThemeId, activeStandardThemeId, customThemes]);

  const getLanguage = (path: string | null) => {
    if (!path) return 'plaintext';
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      json: 'json',
      md: 'markdown',
      html: 'html',
      css: 'css',
      scss: 'scss',
      yaml: 'yaml',
      yml: 'yaml',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative" style={{ height: '100%' }}>
      <div className="flex-1 relative w-full h-full">
        <Editor
          height="100%"
          width="100%"
          loading={<div className="flex items-center justify-center h-full text-muted">Loading editor...</div>}
          language={language || getLanguage(filePath)}
          value={editorContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorStyle: 'line',
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: { 
              enabled: true,
              cycle: true,
            },
            formatOnPaste: true,
            formatOnType: true,
            codeLens: false,
            folding: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'always',
            matchBrackets: 'always',
            bracketPairColorization: {
              enabled: true,
            },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            wordBasedSuggestions: 'matchingDocuments',
            suggestSelection: 'first',
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            snippetSuggestions: 'top',
            tabCompletion: 'on',
            quickSuggestionsDelay: 100,
            padding: {
              top: 16,
              bottom: 16,
            },
            // Improved rendering config
            renderLineHighlight: 'all',
            renderWhitespace: 'selection',
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}
