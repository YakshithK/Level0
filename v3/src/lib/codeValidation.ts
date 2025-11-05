import * as ts from 'typescript';
import * as esprima from 'esprima';
import { GameFiles } from "@/components/GamePreview";

export interface CodeError {
  type: 'syntax' | 'reference' | 'type' | 'runtime' | 'missing_asset' | 'missing_import';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export class GameCodeValidator {
  private static requiredPhaserMethods = ['preload', 'create', 'update'];

  /**
   * Performs static analysis on the game code
   */
  static async validateCode(files: GameFiles): Promise<CodeError[]> {
    const errors: CodeError[] = [];
    
    // Check for required files
    if (!files['index.html']) {
      errors.push({
        type: 'missing_asset',
        message: 'Missing index.html file',
        suggestion: 'Ensure your game includes an index.html file as the entry point.'
      });
    }

    // Check each JavaScript/TypeScript file
    for (const [filename, content] of Object.entries(files)) {
      if (filename.endsWith('.js') || filename.endsWith('.ts')) {
        errors.push(...this.validateJavaScript(content, filename));
      }
    }

    return errors;
  }

  /**
   * Validates a single JavaScript/TypeScript file
   */
  private static validateJavaScript(code: string, filename: string): CodeError[] {
    const errors: CodeError[] = [];

    // 1. Basic syntax check
    try {
      esprima.parseScript(code, { tolerant: true, jsx: true });
    } catch (e: any) {
      errors.push({
        type: 'syntax',
        message: e.message,
        file: filename,
        line: e.lineNumber,
        column: e.column,
        suggestion: 'Check for missing brackets, parentheses, or syntax errors.'
      });
      return errors; // Stop further checks if syntax is invalid
    }

    // 2. TypeScript type checking (non-blocking, runs in parallel)
    this.checkTypeScriptTypes(code, filename).then(typeErrors => {
      errors.push(...typeErrors);
    }).catch(() => {
      // Type checking failed, but don't block execution
    });

    // 3. Check for required Phaser methods
    const sceneMatch = code.match(/class\s+(\w+)\s+extends\s+Phaser\.Scene/);
    if (sceneMatch) {
      const className = sceneMatch[1];
      const sceneCode = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
      
      for (const method of GameCodeValidator.requiredPhaserMethods) {
        const methodRegex = new RegExp(`${method}\\s*\\(`);
        if (!methodRegex.test(sceneCode)) {
          errors.push({
            type: 'reference',
            message: `Missing required Phaser method: ${method}()`, 
            file: filename,
            suggestion: `Add a ${method}() method to your scene class.`
          });
        }
      }
    }

    // 4. Check for common Phaser API misuses
    const commonPhaserIssues = [
      {
        pattern: /this\.load\.image\([^,)]+,\s*['"]([^'"]+)['"]/g,
        check: (match: RegExpMatchArray, assets: string[]) => {
          const assetPath = match[1];
          if (!assets.some(a => a.endsWith(assetPath.split('/').pop() || ''))) {
            return `Missing asset file: ${assetPath}`;
          }
          return null;
        }
      },
      // Add more patterns as needed
    ];

    // Asset checking would be done by the caller with access to all files

    // Asset validation would need access to all files, skipping for now

    return errors;
  }

  /**
   * Performs type checking using TypeScript compiler
   */
  private static async checkTypeScriptTypes(code: string, filename: string): Promise<CodeError[]> {
    const errors: CodeError[] = [];
    
    try {
      const host = ts.createCompilerHost({});
      const fileMap = new Map<string, string>([
        [filename, code],
        ['/node_modules/typescript/lib/lib.es6.d.ts', ''],
        ['/node_modules/phaser/types/phaser.d.ts', '']
      ]);

      host.readFile = (path: string) => fileMap.get(path) || ts.sys.readFile(path) || undefined;
      host.fileExists = (path: string) => fileMap.has(path) || ts.sys.fileExists(path);

      const program = ts.createProgram([filename], {
        noEmit: true,
        strict: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
        skipLibCheck: true,
        esModuleInterop: true,
      }, host);

      const emitResult = program.emit();
      const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

      allDiagnostics.forEach(diagnostic => {
        if (!diagnostic.file) return;
        
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start || 0);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        
        errors.push({
          type: 'type',
          message,
          file: diagnostic.file.fileName,
          line: line + 1,
          column: character + 1,
          suggestion: this.getTypeScriptSuggestion(message)
        });
      });
    } catch (e) {
      console.error('Type checking failed:', e);
    }

    return errors;
  }

  private static getTypeScriptSuggestion(message: string): string {
    if (message.includes('Cannot find name')) {
      return 'You might be missing an import or have a typo in the variable name.';
    }
    if (message.includes('is not assignable to type')) {
      return 'Check the types of the values you are assigning. There might be a type mismatch.';
    }
    return 'Review the TypeScript documentation for more information about this error.';
  }

}
