# Next.js Monaco Editor App

This project is a modern Next.js 14 application using App Router, Tailwind CSS, Monaco Editor, and a collapsible file explorer UI. It features:

- Monaco code editor (@monaco-editor/react)
- Collapsible file tree sidebar (static JSON mock for now)
- File loading from `example-project/` folder
- Prompt input field at the bottom
- Basic routing for `/` (Editor) and `/result` (diff preview)

## Getting Started

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Run the development server:
   ```powershell
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Folder Structure
- `src/app/` - Next.js App Router pages and components
- `src/components/` - UI components (Monaco editor, file explorer, prompt input)
- `example-project/` - Example files to load in the editor

## Customization
You can extend the file explorer to use real filesystem APIs or backend endpoints for dynamic file loading.
