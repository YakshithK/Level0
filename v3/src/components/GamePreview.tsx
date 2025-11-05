import { useEffect, useRef, useState } from "react";
import { GameCodeValidator, type CodeError } from "@/lib/codeValidation";

export interface GameFiles {
  [key: string]: string;
}

interface GamePreviewProps {
  gameFiles: GameFiles;
  onValidationErrors?: (errors: CodeError[]) => void;
  onRuntimeError?: (error: Error) => void;
}

const GamePreview = ({ gameFiles, onValidationErrors, onRuntimeError }: GamePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<CodeError[]>([]);

  // Validate code before execution
  const validateAndRun = async () => {
    if (!iframeRef.current) return;
    
    // Skip validation if no files are loaded
    const fileCount = Object.keys(gameFiles).length;
    if (fileCount === 0) {
      setIsLoading(false);
      setErrors([]);
      return;
    }
    
    setIsLoading(true);
    setErrors([]);
    
    try {
      // 1. Perform static analysis
      const validationErrors = await GameCodeValidator.validateCode(gameFiles);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onValidationErrors?.(validationErrors);
        return;
      }
      
      // 2. If validation passes, run the game
      await runGame();
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const runtimeError: CodeError = {
        type: 'runtime',
        message: errorObj.message,
        suggestion: 'An unexpected error occurred during execution.'
      };
      setErrors([runtimeError]);
      onRuntimeError?.(errorObj);
    } finally {
      setIsLoading(false);
    }
  };

  const runGame = async () => {
    if (!iframeRef.current || !gameFiles["index.html"]) return;
    
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!doc) return;
    
    try {

      // Helper: resize base64 data URL to exact target size (pixelated for crisp sprites)
      const resizeDataUrl = (dataUrl: string, width: number, height: number): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas 2D context not available'));
              return;
            }
            // Preserve pixel art sharpness
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => reject(new Error('Failed to load image for resizing'));
          img.src = dataUrl;
        });
      };

      // Combine all files into a single HTML document with error handling
      let combinedHTML = gameFiles["index.html"];
      
      // Add error handling to the HTML
      combinedHTML = combinedHTML.replace(
        '<head>',
        `<head>
          <script>
            window.onerror = function(message, source, lineno, colno, error) {
              window.parent.postMessage({
                type: 'RUNTIME_ERROR',
                error: {
                  message: message,
                  source: source,
                  line: lineno,
                  column: colno,
                  stack: error?.stack
                }
              }, '*');
              return true; // Prevent default handler
            };
            
            // Catch unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
              window.parent.postMessage({
                type: 'PROMISE_REJECTION',
                error: {
                  message: event.reason?.message || 'Unhandled Promise Rejection',
                  stack: event.reason?.stack
                }
              }, '*');
            });
          </script>`
      );
      
      // Inject all CSS files
      const cssFiles = Object.entries(gameFiles).filter(([name]) => name.endsWith('.css'));
      if (cssFiles.length > 0) {
        const allStyles = cssFiles.map(([_, content]) => content).join('\n');
        combinedHTML = combinedHTML.replace(
          '</head>',
          `<style>${allStyles}</style></head>`
        );
      }
      
      // Parse assets metadata for target sprite sizes
      let spriteSizes: Record<string, [number, number]> = {};
      if (gameFiles["assets.json"]) {
        try {
          const meta = JSON.parse(gameFiles["assets.json"]);
          if (meta?.sprites) {
            for (const [key, info] of Object.entries<any>(meta.sprites)) {
              if (Array.isArray((info as any)?.size) && (info as any).size.length === 2) {
                const sz = (info as any).size as [number, number];
                spriteSizes[key] = [sz[0], sz[1]];
              }
            }
          }
        } catch {
          // ignore malformed assets.json
        }
      }
      
      // Handle image assets - ensure correct sizes from assets.json
      const imageFiles = Object.entries(gameFiles).filter(([name]) => 
        name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')
      );

      const processedImageEntries: Array<[string, string]> = await Promise.all(
        imageFiles.map(async ([name, content]) => {
          const m = name.match(/^assets\/sprites\/([^\.]+)\.(png|jpg|jpeg)$/i);
          if (m) {
            const key = m[1];
            const target = spriteSizes[key];
            if (target) {
              try {
                const [w, h] = target;
                const resized = await resizeDataUrl(content, w, h);
                return [name, resized] as [string, string];
              } catch {
                // fallback to original content if resize fails
                return [name, content] as [string, string];
              }
            }
          }
          return [name, content] as [string, string];
        })
      );
      
      // Inject all JS files in the correct order
      const jsFiles = Object.entries(gameFiles).filter(([name]) => name.endsWith('.js'));
      if (jsFiles.length > 0) {
        // Sort JS files: game.js should be last as it's the main file
        jsFiles.sort(([nameA], [nameB]) => {
          if (nameA === 'game.js') return 1;
          if (nameB === 'game.js') return -1;
          return nameA.localeCompare(nameB);
        });
        
        // Inject image asset mapping (resized when applicable) before other scripts
        let assetMapping = '';
        if (processedImageEntries.length > 0) {
          const mapping = Object.fromEntries(processedImageEntries);
          assetMapping = `<script>
            window.gameAssets = ${JSON.stringify(mapping)};
            window.assetTargetSizes = ${JSON.stringify(spriteSizes)};
          </script>`;
        }
        
        const allScripts = jsFiles.map(([_, content]) => `<script>${content}</script>`).join('\n');
        combinedHTML = combinedHTML.replace(
          '</body>',
          `${assetMapping}${allScripts}</body>`
        );
      }
      
      doc.open();
      doc.write(combinedHTML);
      doc.close();
      
      // Add message listener for runtime errors
      const handleMessage = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) return;
        
        if (event.data?.type === 'RUNTIME_ERROR' || event.data?.type === 'PROMISE_REJECTION') {
          const errorData = event.data.error;
          const runtimeError: CodeError = {
            type: 'runtime',
            message: errorData.message,
            file: errorData.source,
            line: errorData.line,
            column: errorData.column,
            suggestion: 'Check the browser console for more details.'
          };
          
          setErrors(prev => [...prev, runtimeError]);
          onRuntimeError?.(new Error(errorData.message));
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Clean up message listener
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const runtimeError: CodeError = {
        type: 'runtime',
        message: errorObj.message,
        suggestion: 'An error occurred while setting up the game.'
      };
      setErrors([runtimeError]);
      onRuntimeError?.(errorObj);
    } finally {
      setIsLoading(false);
    }
  };

  // Run validation and game when files change
  useEffect(() => {
    validateAndRun();
  }, [gameFiles]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up any resources if needed
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {errors.length > 0 && (
        <div className="absolute inset-0 z-20 bg-red-900/90 p-4 overflow-auto">
          <h3 className="text-white font-bold mb-2">Found {errors.length} error{errors.length > 1 ? 's' : ''}:</h3>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="bg-red-800/70 p-3 rounded text-sm text-white">
                <div className="font-mono font-bold">{error.message}</div>
                {error.file && (
                  <div className="text-xs opacity-80 mt-1">
                    {error.file}{error.line !== undefined ? `:${error.line}` : ''}
                    {error.column !== undefined ? `:${error.column}` : ''}
                  </div>
                )}
                {error.suggestion && (
                  <div className="text-yellow-200 text-xs mt-1"> {error.suggestion}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="Game Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default GamePreview;
