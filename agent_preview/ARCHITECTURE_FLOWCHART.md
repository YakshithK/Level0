# V0/Lovable AI Coding Assistant - Architecture Flowchart

## 🏗️ High-Level System Architecture

```mermaid
graph TB
    %% User Interface Layer
    UI[User Interface Layer]
    
    %% Main Components
    subgraph "Frontend Components"
        CP[ChatPanel - Left Side]
        RP[RightPanel - Code/Files/Preview]
        FE[FileExplorer - Sidebar]
        ME[MonacoEditor - Code Editor]
        DV[DiffViewer - Change Review]
        PV[Preview - Phaser.js Game]
    end
    
    %% API Layer
    subgraph "API Routes (/api/)"
        PA[Plan API - /plan]
        EA[Execute API - /execute-task]
        AC[Apply Change - /apply-change]
        FA[Files API - /files]
        PR[Preview API - /preview]
        DP[Dynamic Path - /[...path]]
        PC[Pending Changes - /pending-changes]
    end
    
    %% Core Engine
    subgraph "AI Engine"
        RET[Retriever System]
        EXE[Executor Agent]
        LLM[LLM APIs (OpenAI + Gemini)]
    end
    
    %% File System
    subgraph "File System"
        EP[Example Project Files]
        PF[Pending Changes JSON]
        SP[Scratchpad JSON]
    end
    
    %% Data Flow
    UI --> CP
    UI --> RP
    RP --> FE
    RP --> ME
    RP --> DV
    RP --> PV
    
    CP --> PA
    CP --> EA
    DV --> AC
    FE --> FA
    PV --> PR
    PR --> DP
    
    PA --> RET
    EA --> RET
    EA --> EXE
    PA --> LLM
    EXE --> LLM
    
    RET --> EP
    AC --> EP
    EXE --> PF
    PA --> SP
    
    FA --> EP
    DP --> EP
```

## 🔄 User Interaction Flow

```mermaid
sequenceDiagram
    participant User
    participant ChatPanel
    participant PlanAPI
    participant ExecutorAgent
    participant Retriever
    participant LLM
    participant FileSystem
    participant RightPanel
    
    %% Step 1: User Input
    User->>ChatPanel: Types message (e.g., "change player health to 200")
    ChatPanel->>PlanAPI: POST /api/plan {prompt}
    
    %% Step 2: Planning Phase
    PlanAPI->>Retriever: retrieveRelevantChunks(prompt)
    Retriever->>FileSystem: Scan example-project files
    Retriever-->>PlanAPI: Related files (Player.js, MainScene.js, etc.)
    PlanAPI->>LLM: Enhanced prompt with file context
    LLM-->>PlanAPI: Step-by-step plan (JSON)
    PlanAPI-->>ChatPanel: Plan steps
    
    %% Step 3: Execution Phase
    loop For each plan step
        ChatPanel->>ExecutorAgent: executeTask(step)
        ExecutorAgent->>Retriever: retrieveRelevantChunks(step)
        Retriever-->>ExecutorAgent: Related files
        ExecutorAgent->>LLM: Multi-file modification prompt
        LLM-->>ExecutorAgent: {files_to_modify, files_to_create}
        ExecutorAgent->>FileSystem: Store in pending_changes.json
        ExecutorAgent-->>ChatPanel: Diff results
        ChatPanel->>RightPanel: Update pending diffs queue
    end
    
    %% Step 4: Review & Apply
    User->>RightPanel: Review changes in DiffViewer
    User->>RightPanel: Accept/Discard changes
    RightPanel->>FileSystem: Apply changes to actual files
    RightPanel->>User: Refresh file explorer & editor
```

## 🧠 Smart File Retrieval System

```mermaid
graph TD
    subgraph "Retriever System Flow"
        UP[User Prompt: "change player health"]
        
        subgraph "File Discovery"
            FS[Scan example-project/]
            FF[Found Files: main.js, Player.js, Enemy.js, etc.]
        end
        
        subgraph "Keyword Matching"
            KE[Extract Keywords: "change", "player", "health"]
            KM[Keyword Matching Logic]
            
            subgraph "Matching Rules"
                R1[player/health/hp → Player.js, MainScene.js]
                R2[enemy/monster → Enemy.js]
                R3[bullet/projectile → Bullet.js]
                R4[scene/game → Scene files]
            end
        end
        
        subgraph "Smart Filtering"
            RF[Relevant Files: Player.js, MainScene.js, UIScene.js]
            FC[File Content + Metadata]
        end
        
        UP --> FS
        FS --> FF
        FF --> KE
        KE --> KM
        KM --> R1
        KM --> R2
        KM --> R3
        KM --> R4
        R1 --> RF
        R2 --> RF
        R3 --> RF
        R4 --> RF
        RF --> FC
    end
```

## 🔧 Multi-File Processing Architecture

```mermaid
graph LR
    subgraph "Executor Agent Enhanced"
        IN[Task Input]
        
        subgraph "AI Analysis"
            AN[Analyze Task]
            DM[Determine Modifications]
            DC[Determine New Files]
        end
        
        subgraph "File Processing"
            EM[Existing Files to Modify]
            NF[New Files to Create]
            DG[Generate Diffs]
            PQ[Pending Queue]
        end
        
        subgraph "Output"
            MF[Modified Files Array]
            CF[Created Files Array]
            JS[JSON Response]
        end
        
        IN --> AN
        AN --> DM
        AN --> DC
        DM --> EM
        DC --> NF
        EM --> DG
        NF --> DG
        DG --> PQ
        PQ --> MF
        PQ --> CF
        MF --> JS
        CF --> JS
    end
```

## 🎮 Preview System Architecture

```mermaid
graph TB
    subgraph "Phaser.js Preview System"
        PB[Preview Button Clicked]
        
        subgraph "Preview API (/api/preview)"
            PA[Check for index.html]
            JS[Collect JS files]
            HS[Generate HTML structure]
            AS[Asset path resolution]
        end
        
        subgraph "Dynamic File Serving (/api/[...path])"
            DS[Dynamic file serving]
            IT[Image/Text detection]
            IC[Image content (binary)]
            TC[Text content (processed)]
        end
        
        subgraph "Browser Rendering"
            IF[Iframe container]
            PL[Phaser.js CDN load]
            GS[Game scripts load]
            AI[Asset images load]
            GR[Game rendering]
        end
        
        PB --> PA
        PA --> JS
        JS --> HS
        HS --> AS
        AS --> DS
        DS --> IT
        IT --> IC
        IT --> TC
        IC --> AI
        TC --> GS
        GS --> IF
        AI --> IF
        IF --> PL
        PL --> GR
    end
```

## 📁 File System Organization

```mermaid
graph TD
    subgraph "Project Structure"
        ROOT[agent_preview/]
        
        subgraph "Source Code"
            SRC[src/]
            APP[app/]
            COMP[components/]
            API[api/]
        end
        
        subgraph "Game Project"
            EP[example-project/]
            SCENES[scenes/]
            SPRITES[sprites/]
            ASSETS[assets/]
        end
        
        subgraph "Configuration"
            CFG[Config Files]
            PJ[package.json]
            TS[tsconfig.json]
            TC[tailwind.config.js]
        end
        
        subgraph "Runtime Data"
            PC[pending_changes.json]
            SP[scratchpad.json]
            RE[retriever cache]
        end
        
        ROOT --> SRC
        ROOT --> EP
        ROOT --> CFG
        ROOT --> PC
        ROOT --> SP
        ROOT --> RE
        
        SRC --> APP
        SRC --> COMP
        APP --> API
        
        EP --> SCENES
        EP --> SPRITES
        EP --> ASSETS
    end
```

## 🔄 State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Planning : User submits prompt
    Planning --> PlanGenerated : AI creates step plan
    PlanGenerated --> Executing : Auto-execute steps
    
    state Executing {
        [*] --> ProcessingStep
        ProcessingStep --> FileRetrieval
        FileRetrieval --> AIGeneration
        AIGeneration --> DiffCreation
        DiffCreation --> QueueUpdate
        QueueUpdate --> NextStep
        NextStep --> ProcessingStep : More steps
        NextStep --> [*] : All steps done
    }
    
    Executing --> ReviewMode : Execution complete
    
    state ReviewMode {
        [*] --> PendingChanges
        PendingChanges --> UserReview
        UserReview --> ApplyChanges : Accept
        UserReview --> DiscardChanges : Discard
        ApplyChanges --> FileSystemUpdate
        DiscardChanges --> PendingChanges
        FileSystemUpdate --> [*]
    }
    
    ReviewMode --> Idle : All changes processed
    Planning --> Idle : Error occurred
    Executing --> Idle : User stops execution
```

## 🎯 Key Features Summary

### 1. **Smart File Retrieval**
- Keyword-based matching system
- Context-aware file discovery
- Intelligent filtering for relevance

### 2. **Multi-File Processing**
- Can modify existing files AND create new files
- Proper directory structure creation
- Comprehensive diff generation

### 3. **Live Preview System**
- Real-time Phaser.js game preview
- Dynamic asset serving
- Error handling and recovery

### 4. **Queue-Based Change Management**
- Multiple pending changes support
- Individual review and approval
- Batch operations available

### 5. **Enhanced Logging & Debugging**
- Console logging for file retrieval
- Step-by-step execution tracking
- Error reporting and recovery

## 🚀 Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Code Editor**: Monaco Editor (VS Code engine)
- **Game Engine**: Phaser.js 3.x
- **AI APIs**: OpenAI GPT-4 + Google Gemini
- **File Processing**: Node.js fs module, diff-match-patch
- **State Management**: React hooks and context
