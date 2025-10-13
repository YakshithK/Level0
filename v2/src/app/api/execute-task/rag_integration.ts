import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export class PhaserRAGRetriever {
  private ragEnabled: boolean = false;
  private pythonRagPath: string;
  private pythonExecutable: string | null = null;

  constructor() {
    this.pythonRagPath = path.join(process.cwd(), 'optimization', 'query_rag.py');
    this.checkRAGAvailability();
  }

  private checkRAGAvailability() {
    try {
      // Check if FAISS index and Python RAG system exist
      const indexPath = path.join(process.cwd(), 'optimization', 'phaser_index.faiss');
      const chunksPath = path.join(process.cwd(), 'optimization', 'phaser_chunks.jsonl');
      
      if (fs.existsSync(indexPath) && fs.existsSync(chunksPath) && fs.existsSync(this.pythonRagPath)) {
        this.ragEnabled = true;
        console.log('FAISS-based RAG system available');
      } else {
        this.ragEnabled = false;
        console.log('FAISS RAG system not found - semantic search disabled');
        console.log(`Index exists: ${fs.existsSync(indexPath)}`);
        console.log(`Chunks exists: ${fs.existsSync(chunksPath)}`);
        console.log(`Python script exists: ${fs.existsSync(this.pythonRagPath)}`);
      }
    } catch (error) {
      console.warn('Failed to check RAG availability:', error);
      this.ragEnabled = false;
    }
  }

  private async findPythonExecutable(): Promise<string> {
    const possiblePaths = [
      'python',
      'python3', 
      'py',
      'C:\\Python39\\python.exe',
      'C:\\Python310\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Python312\\python.exe'
    ];

    for (const pythonPath of possiblePaths) {
      try {
        const result = await new Promise<boolean>((resolve) => {
          const testProcess = spawn(pythonPath, ['--version'], { 
            stdio: 'pipe',
            windowsHide: true 
          });
          
          testProcess.on('close', (code) => {
            resolve(code === 0);
          });
          
          testProcess.on('error', () => {
            resolve(false);
          });
          
          // Timeout after 2 seconds
          setTimeout(() => {
            testProcess.kill();
            resolve(false);
          }, 2000);
        });

        if (result) {
          console.log(`✅ Found Python at: ${pythonPath}`);
          return pythonPath;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    
    throw new Error('Python executable not found. Please install Python or add it to PATH.');
  }

  async getRelevantExamples(userPrompt: string, topK: number = 3): Promise<string> {
    if (!this.ragEnabled) {
      return '';
    }

    try {
        console.log(`Searching FAISS index for: "${userPrompt}"`);
        
        // Find Python executable (cache result)
        if (!this.pythonExecutable) {
          this.pythonExecutable = await this.findPythonExecutable();
        }
        
        return new Promise((resolve) => {
          const python = spawn(this.pythonExecutable!, [this.pythonRagPath, '--query', userPrompt, '--top_k', topK.toString(), '--json'], {
            cwd: path.join(process.cwd(), 'optimization'),
            windowsHide: true,
            stdio: 'pipe',
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }  // Force UTF-8 encoding
          });

        let output = '';
        let errorOutput = '';
        let isResolved = false;

        const cleanup = () => {
          if (!python.killed) {
            python.kill('SIGTERM');
          }
        };

        const resolveOnce = (result: string) => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve(result);
          }
        };

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        python.on('error', (error) => {
          console.warn('Python process error:', error);
          resolveOnce('');
        });

        python.on('close', (code) => {
          if (code === 0 && output.trim()) {
            try {
              // Only parse the last line that should contain JSON
              const lines = output.trim().split('\n');
              const jsonLine = lines[lines.length - 1];
              
              if (jsonLine.startsWith('{')) {
                const results = JSON.parse(jsonLine);
                if (results.chunks && Array.isArray(results.chunks) && results.chunks.length > 0) {
                  let context = '\nRelevant Phaser.js Examples (FAISS):\n\n';
                  let validChunks = 0;
                  
                  results.chunks.forEach((chunk: string, i: number) => {
                    if (chunk && chunk.trim().length > 10) {  // Ensure chunk has meaningful content
                      validChunks++;
                      context += `Example ${validChunks}:\n\`\`\`javascript\n${chunk.substring(0, 800)}${chunk.length > 800 ? '...' : ''}\n\`\`\`\n\n`;
                    }
                  });
                  
                  if (validChunks > 0) {
                    console.log(`Found ${validChunks} relevant examples via FAISS`);
                    console.log(results.chunks)
                    resolveOnce(context);
                  } else {
                    console.log('No meaningful examples found in FAISS results');
                    resolveOnce('');
                  }
                } else {
                  console.log('No relevant examples found in FAISS index');
                  resolveOnce('');
                }
              } else {
                console.warn('No valid JSON found in Python output');
                console.warn('Last line:', jsonLine.substring(0, 100));
                resolveOnce('');
              }
            } catch (parseError) {
              console.warn('Failed to parse RAG results:', parseError);
              console.warn('Raw output lines:', output.split('\n').map(line => line.substring(0, 50)));
              resolveOnce('');
            }
          } else {
            console.warn(`Python RAG failed with code ${code}:`, errorOutput || 'No output');
            if (output) console.warn('Raw stdout:', output.substring(0, 200));
            resolveOnce('');
          }
        });

        // Timeout after 30 seconds (initial model loading is slow)
        const timeoutId = setTimeout(() => {
          console.warn('Python RAG timed out after 30 seconds');
          resolveOnce('');
        }, 30000);

        // Clear timeout if process completes normally
        python.on('close', () => {
          clearTimeout(timeoutId);
        });
      });
    } catch (error) {
      console.warn('FAISS RAG search failed:', error);
      return '';
    }
  }

  async enhancePromptWithRAG(originalPrompt: string, userRequest: string, ragEnabled: boolean = true): Promise<string> {
    try {
      // Always add the Phaser.js exclusivity reminder
      const phaserOnlyReminder = `\n\nCRITICAL: You are creating a PHASER.JS browser game EXCLUSIVELY. Use ONLY Phaser.js framework - never suggest or use other game libraries, engines, or frameworks (no Pygame, Tkinter, Unity, Three.js, PixiJS, etc.). All games must be HTML5/JavaScript using Phaser.js 3.70+.`;

      // Check if RAG is enabled
      if (!ragEnabled) {
        return originalPrompt + phaserOnlyReminder;
      }

      console.log('Searching for relevant Phaser.js code examples...');
      const examples = await this.getRelevantExamples(userRequest);

      // Check if we have meaningful examples
      if (examples && examples.trim().length > 50) {
        const enhancedPrompt = `${originalPrompt}

--- RELEVANT PHASER.JS EXAMPLES ---
${examples}
--- END PHASER.JS EXAMPLES ---

Use these Phaser.js code examples as reference for best practices and patterns. Adapt the patterns shown above to fulfill the user's specific request using ONLY Phaser.js.${phaserOnlyReminder}`;
        console.log('Enhanced prompt with FAISS RAG Phaser.js examples');
        return enhancedPrompt;
      } else {
        console.log('No relevant Phaser.js examples found, using original prompt');
        return originalPrompt + phaserOnlyReminder;
      }
    } catch (error) {
      console.warn('RAG enhancement failed:', error);
      return originalPrompt + `\n\nCRITICAL: You are creating a PHASER.JS browser game EXCLUSIVELY. Use ONLY Phaser.js framework - never suggest or use other game libraries, engines, or frameworks (no Pygame, Tkinter, Unity, Three.js, PixiJS, etc.). All games must be HTML5/JavaScript using Phaser.js 3.70+.`;
    }
  }
}

// Singleton instance
export const ragRetriever = new PhaserRAGRetriever();
