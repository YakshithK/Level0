# 🏗️ RAG-Enhanced AI Coding Agent - Complete Architecture

## 📊 **System Overview**

Your agent is a V0/Lovable-style AI coding assistant with advanced RAG (Retrieval-Augmented Generation) capabilities specifically optimized for Phaser.js game development. Here's the complete architecture:

## 🏛️ **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│  [ChatPanel]  [FileExplorer]  [DiffViewer]  [Preview]  [Monaco] │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                      API LAYER (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  /plan  /execute-task  /files  /apply-change  /preview  [...]   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   CORE AGENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  [ExecutorAgent] + [Retriever] + [RAG Integration]             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   KNOWLEDGE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  [Vector DB] + [Code Chunks] + [Built-in Examples]             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                     LLM LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│         [Kimi K2 Instruct]                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 **Complete Data Flow**

### **Phase 1: User Input → Planning**
```
User Input: "Create a space shooter"
     ↓
[ChatPanel] → /api/plan
     ↓
[Retriever.retrieveRelevantChunks()]
     ↓
[RAG Enhancement] → Find similar game code
     ↓
[LLM Planning] → Generate step-by-step plan
     ↓
Plan Steps: ["Create player sprite", "Add enemy spawning", ...]
```

### **Phase 2: Step Execution**
```
For each plan step:
     ↓
[/api/execute-task] → [ExecutorAgent.executeTask()]
     ↓
[buildExecutorPrompt()] + [RAG Enhancement]
     ↓
[LLM Code Generation] → JSON response
     ↓
[Multi-file Processing] → Diffs + New files
     ↓
[pending_changes.json] → Store for review
```

### **Phase 3: Review & Apply**
```
[DiffViewer] → Display changes
     ↓
User Review → Accept/Reject
     ↓
[/api/apply-change] → Write to actual files
     ↓
[FileExplorer] + [Preview] → Refresh
```

## 🧩 **Component Breakdown**

### **1. Frontend Components (React/TypeScript)**

#### **ChatPanel.tsx**
- 🎯 **Purpose**: Main chat interface with AI assistant
- 🔧 **Features**: 
  - Message history
  - Fixed model (Kimi K2)
  - **RAG toggle** (enable/disable code examples)
  - Plan step tracking
- 📡 **Connects to**: `/api/plan`, messaging system

#### **RightPanel.tsx**
- 🎯 **Purpose**: Code editing and file management hub
- 🔧 **Features**:
  - Collapsible file explorer sidebar
  - Monaco code editor
  - Multi-diff review system
  - Phaser.js preview iframe
- 📊 **State Management**: Pending diffs queue, file selection

#### **FileExplorer.tsx**
- 🎯 **Purpose**: Workspace file navigation
- 🔧 **Features**: 
  - Recursive directory traversal
  - File type icons
  - Real-time file system monitoring
- 📡 **Connects to**: `/api/files`

#### **DiffViewer.tsx**
- 🎯 **Purpose**: Code change review interface
- 🔧 **Features**:
  - Side-by-side diff display
  - Accept/reject individual changes
  - Syntax highlighting
- 📡 **Connects to**: `/api/apply-change`

#### **Preview.tsx**
- 🎯 **Purpose**: Live Phaser.js game preview
- 🔧 **Features**:
  - Iframe sandboxing
  - Auto-refresh on file changes
  - Error handling
- 📡 **Connects to**: `/api/preview/[...path]`

### **2. API Layer (Next.js App Router)**

#### **/api/plan/route.ts**
```typescript
// Generates step-by-step execution plan
POST /api/plan
Input: { prompt: string }
Output: { steps: PlanStep[] }
```

#### **/api/execute-task/route.ts**
```typescript
// Executes individual plan steps
POST /api/execute-task
Input: { task: string, ragEnabled: boolean }
Output: { diffs: Diff[], newFiles: File[] }
```

#### **/api/files/route.ts**
```typescript
// File system operations
GET /api/files → List all files
POST /api/files → Create/update files
```

#### **/api/apply-change/route.ts**
```typescript
// Applies reviewed changes to actual files
POST /api/apply-change
Input: { filename: string, content: string }
Output: { success: boolean }
```

#### **/api/[...path]/route.ts**
```typescript
// Dynamic file serving for preview system
GET /api/file1.js → Serves file content
GET /api/subdir/file2.js → Nested file serving
```

### **3. Core Agent Layer**

#### **executorAgent.ts**
- 🎯 **Purpose**: Main AI code generation engine
- 🔧 **Core Functions**:
  ```typescript
  executeTask(task, topK, model, ragEnabled)
  buildExecutorPrompt(task, relevantChunks, ragEnabled)
  callLLMAPI(prompt, model)
  ```
- 🧠 **Intelligence**:
  - Multi-file code generation
  - Diff generation with diff-match-patch
  - Fallback error handling
  - JSON response parsing

#### **retriever.ts**
- 🎯 **Purpose**: Smart file discovery and context retrieval
- 🔧 **Core Functions**:
  ```typescript
  retrieveRelevantChunks(query, topK)
  scanDirectory(path)
  scoreFileRelevance(filename, query)
  ```
- 🧠 **Intelligence**:
  - Keyword-based file matching
  - Recursive directory scanning
  - Content-aware file filtering

#### **rag_integration.ts** 
- 🎯 **Purpose**: RAG system for Phaser.js code enhancement
- 🔧 **Core Functions**:
  ```typescript
  enhancePromptWithRAG(prompt, userRequest, ragEnabled)
  getRelevantExamples(prompt, topK)
  loadPhaserExamples()
  ```
- 🧠 **Intelligence**:
  - Vector database integration
  - Built-in example patterns
  - Phaser-specific keyword detection
  - Graceful fallback system

### **4. RAG Knowledge Layer**

#### **Vector Database Pipeline**
```
🔍 scrape_v2.py → GitHub game repos
     ↓
📊 embedding_v2.py → FAISS vector database  
     ↓
🗂️ phaser_index.faiss + phaser_chunks.jsonl
     ↓
💡 query_rag.py → Semantic search system
```

#### **Knowledge Sources**
1. **Scraped Game Code**: Real Phaser.js implementations from GitHub
2. **Built-in Examples**: Curated patterns (player movement, enemy spawning, etc.)
3. **Workspace Files**: User's existing code as context

#### **RAG Enhancement Process**
```
User Query: "Create space shooter"
     ↓
Keyword Detection: ["space", "shooter", "phaser", "game"]
     ↓
Vector Search: Find similar game implementations
     ↓
Context Injection: Add relevant code examples to LLM prompt
     ↓
Enhanced Generation: Better, more accurate Phaser.js code
```

## 🎮 **Specialized Phaser.js Features**

### **Template System**
```html
<!-- Auto-generated game structure -->
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.70.0/phaser.min.js"></script>
</head>
<body>
    <div id="game-container"></div>
    <script src="sprites/Player.js"></script>
    <script src="scenes/MainScene.js"></script>
    <script src="main.js"></script>
</body>
</html>
```

### **Smart File Organization**
```
example-project/
├── index.html          # Game entry point
├── main.js            # Phaser game configuration
├── scenes/            # Game scenes
│   ├── MainScene.js   # Main gameplay
│   └── UIScene.js     # User interface
├── sprites/           # Game objects
│   ├── Player.js      # Player character
│   ├── Enemy.js       # Enemy entities
│   └── Bullet.js      # Projectiles
└── assets/            # Game assets
    ├── images/
    └── sounds/
```

## 🔄 **State Management**

### **Frontend State** (React)
```typescript
// Main page state
[messages, setMessages]         // Chat history
[planSteps, setPlanSteps]       // Execution plan
[pendingDiffs, setPendingDiffs] // Code changes queue
[selectedFile, setSelectedFile] // Active file
[ragEnabled, setRagEnabled]     // RAG toggle
```

### **Backend State** (File System)
```json
// pending_changes.json
{
  "Player.js": {
    "original": "...",
    "updated": "...",
    "diff": [...],
    "task": "Add health system"
  }
}
```

## 🚀 **Technology Stack**

### **Frontend**
- **React 18** + **TypeScript** + **Tailwind CSS**
- **Monaco Editor** (VS Code editor)
- **Next.js 15** (App Router)

### **Backend**
- **Node.js** + **TypeScript**
- **Next.js API Routes**
- **File System APIs**

### **AI Integration**
- **Kimi K2 Instruct** via Groq API
- **Kimi K2 Instruct** via Groq API
- **Dual model switching**

### **RAG System**
- **Python 3.9** for data processing
- **sentence-transformers** (all-MiniLM-L6-v2)
- **FAISS** vector database
- **GitHub API** for scraping

### **Development Tools**
- **diff-match-patch** for code diffs
- **node-fetch** for API calls
- **Turbopack** for fast builds

## 🎯 **Key Innovations**

### **1. Multi-File Awareness**
- Generates multiple related files simultaneously
- Maintains consistency across file boundaries
- Understands project structure

### **2. RAG-Enhanced Code Generation**
- Uses real game implementations as examples
- Phaser.js specific patterns and best practices
- Contextual code suggestions

### **3. Intelligent File Retrieval**
- Smart keyword matching
- Context-aware file selection
- Minimal but relevant file loading

### **4. Preview-First Development**
- Live game preview during development
- Immediate visual feedback
- Error detection and debugging

### **5. Professional Diff Review**
- VS Code-style diff viewer
- Granular change control
- Non-destructive editing workflow

## 📈 **Performance Optimizations**

- **Lazy Loading**: Components load on demand
- **Smart Caching**: File system results cached
- **Chunked Processing**: Large files processed in chunks
- **Background Operations**: Non-blocking file operations
- **Efficient RAG**: Vector search with similarity thresholds

This architecture creates a powerful, specialized AI coding assistant that understands game development workflows and provides intelligent, context-aware code generation with professional-grade tooling.
