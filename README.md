# AlphaStudio

A futuristic AI-powered code editor and workspace with Gemini integration, built with Electron, React, and TypeScript.

## Features

- **Monaco Editor** with autocompletion and CursorAI-style widgets
- **Multi-Provider AI Integration** via native Electron IPC:
  - **Google Gemini** (Native API)
  - **xAI Grok** (OpenAI-compatible)
  - **Groq** (OpenAI-compatible, Llama 3)
  - **Moonshot AI** (Kimi, OpenAI-compatible)
  - **Ollama** (Local LLM support for privacy and offline use)
- **Chat Panel** with streaming responses, context attachment, and tool execution
- **Task Management** with AI-powered task analysis and dynamic planning
- **Diff Widget** for reviewing generated code changes
- **Agent Terminal** with permission prompts for elevated commands
- **Dual Panel Modes**: File navigation and Project Explorer with search
- **Image & File Context** attachment with preview
- **Multiple Themes**: Light, Dark, Aether gradient, and custom theming support
- **Cross-platform**: Linux, macOS, and Windows

## Setup

### Prerequisites

- Node.js 20+ and npm
- An API key from one of the supported providers (Gemini, Grok, Groq, Moonshot) OR a local Ollama installation.

### Installation

1. Clone or navigate to the project:
```bash
cd ~/alpha-studio
```

2. Install dependencies:
```bash
npm install
```

3. Configure API keys:
   - Open the app and go to Settings (gear icon)
   - Select your preferred AI provider
   - Enter your API key (or configure Ollama for local models)

### Development

Run in development mode:
```bash
npm run dev
```

This will start:
- Vite dev server on http://localhost:5173
- Electron app

### Building

Build for production:
```bash
npm run build
```

Package for distribution:
```bash
npm run package        # All platforms
npm run package:linux # Linux only
npm run package:mac   # macOS only
npm run package:win   # Windows only
```

## Usage

1. **Configure AI**: Open Settings to set up your preferred AI model and provider.
2. **Open Project**: Use the Project view to open a folder and search for files.
3. **Chat with AI**: Use the chat panel to ask questions, generate code, or execute complex tasks.
4. **Manage Tasks**: Add tasks in the task panel - the AI can create plans and track progress.
5. **Review Changes**: When AI suggests changes (using `write_file`), review them in the diff widget before applying.
6. **Execute Commands**: Use the terminal panel to run commands safely.

## Project Structure

```
alpha-studio/
├── electron/              # Electron main process
│   ├── services/          # AI providers, file operations, agentic loop
│   ├── main.ts            # Main process with IPC handlers
│   └── preload.ts         # Preload script for secure IPC
├── src/                   # React frontend
│   ├── components/        # React components (Chat, Editor, Sidebar, etc.)
│   ├── services/          # Frontend services
│   ├── store.ts           # Zustand state management
│   └── types/             # TypeScript types
└── public/                # Static assets
```

## Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Monaco Editor
- **Desktop**: Electron with native Node.js APIs
- **AI Integration**: Custom provider adapters for Gemini, OpenAI-compatible APIs, and Ollama
- **File Operations**: Node.js fs module (native)
- **State**: Zustand
- **UI**: Lucide React icons, Framer Motion

## License

MIT
