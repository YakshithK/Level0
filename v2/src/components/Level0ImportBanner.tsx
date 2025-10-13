import { useEffect, useState } from 'react';
import { AlertTriangle, Gamepad2, Zap } from 'lucide-react';

interface ImportedGameInfo {
  originalPrompt: string;
  gameTitle: string;
  importedAt: string;
  sourceSystem: string;
  filesCreated: string[];
}

export default function Level0ImportBanner() {
  const [importInfo, setImportInfo] = useState<ImportedGameInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if this session started from a Level0 import
    const checkImportStatus = async () => {
      try {
        const response = await fetch('/api/check-import-status');
        if (response.ok) {
          const data = await response.json();
          if (data.isImported) {
            setImportInfo(data.metadata);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.log('[ImportBanner] No import detected');
      }
    };

    checkImportStatus();
  }, []);

  if (!isVisible || !importInfo) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4 mb-4 relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 animate-pulse"></div>
      
      <div className="relative z-10 flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="bg-purple-500/20 p-2 rounded-full">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">
              Welcome to Advanced Mode!
            </h3>
          </div>
          
          <div className="text-gray-300 space-y-1">
            <p className="text-sm">
              <span className="text-purple-400 font-medium">"{importInfo.gameTitle}"</span> has been imported from Level0
            </p>
            <p className="text-xs text-gray-400">
              Original prompt: <span className="italic">"{importInfo.originalPrompt}"</span>
            </p>
            <p className="text-xs text-gray-500">
              {importInfo.filesCreated.length} files created • Imported {new Date(importInfo.importedAt).toLocaleTimeString()}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <AlertTriangle className="w-3 h-3" />
            <span>Your game has been split into organized files. Use the chat to make modifications!</span>
          </div>
        </div>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
