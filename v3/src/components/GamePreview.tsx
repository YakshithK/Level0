import { useEffect, useRef } from "react";

interface GameFiles {
  [key: string]: string;
}

interface GamePreviewProps {
  gameFiles: GameFiles;
}

const GamePreview = ({ gameFiles }: GamePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const run = async () => {
      if (!(iframeRef.current && gameFiles["index.html"])) return;
      const iframe = iframeRef.current!;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!doc) return;

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

      // Combine all files into a single HTML document
      let combinedHTML = gameFiles["index.html"];
      
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
    };

    run();
  }, [gameFiles]);

  return (
    <div className="h-full w-full bg-[hsl(var(--preview-bg))] rounded-xl border border-border overflow-hidden">
      {gameFiles["index.html"] ? (
        <iframe
          ref={iframeRef}
          className="w-full h-full"
          title="Game Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl">🎮</div>
            <h3 className="text-xl font-semibold text-muted-foreground">
              Your game will appear here
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Enter a prompt and click Generate to create an instant playable game
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePreview;
