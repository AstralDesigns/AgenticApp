import { useEffect, useRef, useState, useMemo } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
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
  const monaco = useMonaco();
  const { theme, customThemes, activeCustomThemeId, activeStandardThemeId, saveFile, refreshOpenFiles } = useStore();
  // Generate a stable ID for untitled files to ensure they get a consistent model path
  const [uniqueId] = useState(() => Math.random().toString(36).substr(2, 9));

  // Calculate current theme string
  const currentTheme = useMemo(() => {
    if (theme === 'light') return 'alpha-light';
    if (theme === 'dark') return 'alpha-dark';
    if (theme === 'custom') return 'alpha-custom';
    if (theme === 'standard' && activeStandardThemeId) return `theme-${activeStandardThemeId}`;
    return 'alpha-theme';
  }, [theme, activeStandardThemeId]);

  // Update editor content when prop changes
  useEffect(() => {
    if (content !== editorContent) {
      setEditorContent(content);
    }
  }, [content]);

  // Handle window focus to check for external file changes
  useEffect(() => {
    const handleFocus = () => {
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

  // Determine the correct language ID
  const getLanguageId = (path: string | null, lang?: string) => {
    if (lang) return lang;
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

  const currentLanguage = getLanguageId(filePath, language);

  // Construct a model path with the correct extension to ensure Monaco uses the correct language service
  const modelPath = useMemo(() => {
    // Helper to get extension from language
    const getExtension = (lang: string) => {
      switch (lang) {
        case 'typescript': return 'tsx'; // Use tsx to support both TS and JSX
        case 'javascript': return 'jsx';
        case 'python': return 'py';
        case 'markdown': return 'md';
        case 'json': return 'json';
        case 'html': return 'html';
        case 'css': return 'css';
        default: return 'txt';
      }
    };

    const ext = getExtension(currentLanguage);
    
    if (filePath) {
      // If filePath already has an extension, use it, otherwise append one
      if (filePath.split('/').pop()?.includes('.')) {
        return filePath;
      }
      return `${filePath}.${ext}`;
    }
    
    // For untitled/memory files
    return `inmemory://untitled-${uniqueId}.${ext}`;
  }, [filePath, currentLanguage, uniqueId]);

  const defineMonacoThemes = (monacoInstance: any) => {
    // Helper to get CSS variable values
    const getCommonThemeRules = (baseColors: any) => {
      return {
        'editor.background': baseColors.bg,
        'editor.foreground': baseColors.fg,
        'editorLineNumber.foreground': baseColors.line,
        'editorLineNumber.activeForeground': baseColors.accent,
        'editor.selectionBackground': baseColors.selection,
        'editor.lineHighlightBackground': baseColors.lineHighlight,
        'editorCursor.foreground': baseColors.accent,
        'quickInput.background': baseColors.widgetBg,
        'quickInput.foreground': baseColors.fg,
        'editorSuggestWidget.background': baseColors.widgetBg,
        'editorSuggestWidget.border': baseColors.border,
        'editorSuggestWidget.selectedBackground': baseColors.accent + '33',
        'input.background': baseColors.inputBg,
        'input.foreground': baseColors.fg,
        'input.border': baseColors.border,
      };
    };

    // Alpha Theme (Deep Slate)
    monacoInstance.editor.defineTheme('alpha-theme', {
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
        widgetBg: '#0f172a',
        inputBg: '#0f172a'
      })
    });

    // Dark Theme (Pure Black)
    monacoInstance.editor.defineTheme('alpha-dark', {
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
        inputBg: '#18181b'
      })
    });

    // Light Theme
    monacoInstance.editor.defineTheme('alpha-light', {
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
        inputBg: '#ffffff'
      })
    });

    // Custom Theme
    if (theme === 'custom' && activeCustomThemeId) {
      const customTheme = customThemes.find(t => t.id === activeCustomThemeId);
      if (customTheme) {
        monacoInstance.editor.defineTheme('alpha-custom', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: getCommonThemeRules({
            bg: customTheme.colors.bgPrimary,
            fg: customTheme.colors.textPrimary,
            line: customTheme.colors.textSecondary,
            accent: customTheme.colors.accentColor,
            selection: customTheme.colors.bgSecondary,
            lineHighlight: customTheme.colors.bgSecondary,
            border: customTheme.colors.borderColor,
            widgetBg: customTheme.colors.settingsBg,
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
      monacoInstance.editor.defineTheme(`theme-${id}`, {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: getCommonThemeRules({
          bg: colors.bg,
          fg: colors.fg,
          line: colors.line,
          accent: colors.accent,
          selection: colors.line,
          lineHighlight: colors.line + '55',
          border: colors.line,
          widgetBg: colors.bg,
          inputBg: colors.line + '22'
        })
      });
    });
  };

  const applyTheme = (monacoInstance: any) => {
    monacoInstance.editor.setTheme(currentTheme);
  };

  const handleBeforeMount = (monacoInstance: any) => {
    defineMonacoThemes(monacoInstance);
  };

  // Configure Monaco languages when monaco instance is available
  useEffect(() => {
    if (monaco) {
      // Cast to any to avoid type errors with monaco.languages.typescript properties
      const ts = monaco.languages.typescript as any;

      const diagnosticsOptions = {
        noSemanticValidation: true,
        noSyntaxValidation: false,
      };

      const compilerOptions = {
        target: ts.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        module: ts.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: ts.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        checkJs: false, 
        strict: false,
        typeRoots: ['node_modules/@types'],
      };

      // Configure TypeScript
      ts.typescriptDefaults.setDiagnosticsOptions(diagnosticsOptions);
      ts.typescriptDefaults.setCompilerOptions(compilerOptions);
      // Eagerly sync models
      ts.typescriptDefaults.setEagerModelSync(true);

      // Configure JavaScript
      ts.javascriptDefaults.setDiagnosticsOptions(diagnosticsOptions);
      ts.javascriptDefaults.setCompilerOptions(compilerOptions);
      ts.javascriptDefaults.setEagerModelSync(true);

      // Define themes and apply (reactive updates)
      defineMonacoThemes(monaco);
      applyTheme(monaco);
      
      // Register snippets
      registerSnippets(monaco);
    }
  }, [monaco, theme, activeCustomThemeId, activeStandardThemeId, customThemes]);

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setEditorContent(newContent);
    onChange(newContent);
  };

  const handleEditorDidMount = (editor: any, _monaco: any) => {
    editorRef.current = editor;
    editor.focus();
    
    // Track editor selection for paste detection in chat
    editor.onDidChangeCursorSelection(() => {
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
        window.dispatchEvent(new CustomEvent('editor-selection-change', {
          detail: null
        }));
      }
    });

    // Add Ctrl+S (Command+S on Mac) save command
    editor.addCommand(_monaco.KeyMod.CtrlCmd | _monaco.KeyCode.KeyS, () => {
      const activePaneId = useStore.getState().activePaneId;
      if (activePaneId) {
        saveFile(activePaneId);
      }
    });

    // Word highlighting
    editor.onDidChangeCursorSelection(() => {
      const position = editor.getPosition();
      if (position) {
        const word = editor.getModel()?.getWordAtPosition(position);
        if (word) {
          editor.deltaDecorations([], [
            {
              range: new _monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              options: {
                className: 'word-highlight',
                stickiness: _monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
              },
            },
          ]);
        }
      }
    });
  };

  const registerSnippets = (monacoInstance: any) => {
    const languages = ['typescript', 'javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'shell', 'bash', 'powershell'];
    
    // Common snippets
    const commonSnippets = [
      {
        label: 'if',
        kind: monacoInstance.languages.CompletionItemKind.Snippet,
        insertText: 'if (${1:condition}) {\n\t$0\n}',
        insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'If statement',
      },
      {
        label: 'for',
        kind: monacoInstance.languages.CompletionItemKind.Snippet,
        insertText: 'for (${1:let i = 0}; ${2:i < length}; ${3:i++}) {\n\t$0\n}',
        insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'For loop',
      },
      {
        label: 'function',
        kind: monacoInstance.languages.CompletionItemKind.Snippet,
        insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}',
        insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Function declaration',
      },
      {
        label: 'try-catch',
        kind: monacoInstance.languages.CompletionItemKind.Snippet,
        insertText: 'try {\n\t$1\n} catch (${2:error}) {\n\t$0\n}',
        insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Try-catch block',
      },
    ];
    
    // TS/JS Snippets
    const tsJsSnippets = [
      {
        label: 'arrow',
        kind: monacoInstance.languages.CompletionItemKind.Snippet,
        insertText: 'const ${1:name} = (${2:params}) => {\n\t$0\n};',
        insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Arrow function',
      },
      {
        label: 'console.log',
        kind: monacoInstance.languages.CompletionItemKind.Snippet,
        insertText: 'console.log($1);',
        insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Log to console',
      }
    ];

    languages.forEach(lang => {
      // Clear previous providers if necessary (Monaco doesn't have a clear way to unregister, but we rely on React lifecycle)
      monacoInstance.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          
          let suggestions: any[] = [...commonSnippets];
          if (lang === 'typescript' || lang === 'javascript') {
            suggestions = [...suggestions, ...tsJsSnippets];
          }

          return {
            suggestions: suggestions.map(s => ({ ...s, range })),
          };
        }
      });
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative" style={{ height: '100%' }}>
      <div className="flex-1 relative w-full h-full">
        <Editor
          height="100%"
          width="100%"
          path={modelPath}
          theme={currentTheme}
          beforeMount={handleBeforeMount}
          loading={<div className="flex items-center justify-center h-full text-muted">Loading editor...</div>}
          language={currentLanguage}
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
            renderLineHighlight: 'all',
            renderWhitespace: 'selection',
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}
