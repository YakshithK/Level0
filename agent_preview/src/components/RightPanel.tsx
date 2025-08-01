import React, { useState } from 'react';
import MonacoEditor from './MonacoEditor';
import FileExplorer from './FileExplorer';
import DiffViewer from './DiffViewer';
import Preview from './Preview';

interface RightPanelProps {
  selectedFile: string;
  fileContent: string;
  onFileSelect: (file: string) => void;
  onFileContentChange: (value: string) => void;
  changeCounter: number;
  onRefresh: () => void;
  isProcessing: boolean;
  pendingDiffs: any[];
  onAcceptDiff: (index?: number) => void;
  onDiscardDiff: (index?: number) => void;
  onAcceptAllDiffs: () => void;
  error?: string;
  refreshTrigger?: number;
}

type ViewMode = 'code' | 'review' | 'preview';

export default function RightPanel({
  selectedFile,
  fileContent,
  onFileSelect,
  onFileContentChange,
  changeCounter,
  onRefresh,
  isProcessing,
  pendingDiffs,
  onAcceptDiff,
  onDiscardDiff,
  onAcceptAllDiffs,
  error,
  refreshTrigger
}: RightPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [showInlineDiff, setShowInlineDiff] = useState<boolean>(false);
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState<boolean>(false);

  // Auto-switch to review mode when there are pending diffs
  React.useEffect(() => {
    if (pendingDiffs.length > 0 && viewMode !== 'review') {
      setViewMode('review');
    }
  }, [pendingDiffs, viewMode]);

  // Check if current file has pending changes
  const currentFileDiff = pendingDiffs.find(diff => diff.mainFile === selectedFile);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'code'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>Code</span>
            </div>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'preview'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-green-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>Preview</span>
            </div>
          </button>
          <button
            onClick={() => setViewMode('review')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'review'
                ? 'bg-orange-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-orange-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>Review</span>
              {pendingDiffs.length > 0 && (
                <span className="bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">
                  {pendingDiffs.length}
                </span>
              )}
            </div>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          {viewMode === 'code' && (
            <button
              onClick={() => setIsFileExplorerCollapsed(!isFileExplorerCollapsed)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                !isFileExplorerCollapsed
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title={isFileExplorerCollapsed ? "Show Files" : "Hide Files"}
            >
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>{isFileExplorerCollapsed ? 'Show' : 'Hide'} Files</span>
              </div>
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isProcessing}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 rounded-md transition-colors"
          >
            <span>Refresh</span>
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {viewMode === 'code' && (
          <div className="h-full flex">
            {/* File Explorer Sidebar */}
            {!isFileExplorerCollapsed && (
              <div className="w-80 flex-shrink-0 border-r border-gray-700 bg-gray-900">
                <FileExplorer onSelect={onFileSelect} refreshTrigger={refreshTrigger} />
              </div>
            )}
            
            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Toggle Button */}
              <button
                onClick={() => setIsFileExplorerCollapsed(!isFileExplorerCollapsed)}
                className="p-2 bg-gray-800 hover:bg-gray-700 border-b border-gray-700 transition-colors self-start"
                title={isFileExplorerCollapsed ? "Show Files" : "Hide Files"}
              >
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isFileExplorerCollapsed ? 'rotate-0' : 'rotate-180'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <MonacoEditor
                  key={selectedFile + '-' + changeCounter}
                  value={fileContent}
                  language="typescript"
                  onChange={(value) => onFileContentChange(value ?? "")}
                />
              </div>
            </div>
          </div>
        )}
        {viewMode === 'preview' && (
          <div className="h-full">
            <Preview selectedFile={selectedFile} onRefresh={onRefresh} />
          </div>
        )}
        {viewMode === 'review' && (
          <div className="h-full overflow-auto p-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Review Changes ({pendingDiffs.length})
              </h3>
              {pendingDiffs.length > 1 && (
                <button
                  onClick={onAcceptAllDiffs}
                  disabled={isProcessing}
                  className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 text-white rounded-md transition-colors"
                >
                  Accept All Changes
                </button>
              )}
            </div>
            {pendingDiffs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No pending changes to review</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingDiffs.map((diff, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg border border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                      <span className="font-medium text-white">{diff.mainFile}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onAcceptDiff(index)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 text-white rounded-md transition-colors text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onDiscardDiff(index)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white rounded-md transition-colors text-sm"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <DiffViewer
                        original={diff.original || ""}
                        updated={diff.updated || ""}
                        onApply={() => onAcceptDiff(index)}
                        onDiscard={() => onDiscardDiff(index)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <div className="mx-4 my-4 p-4 bg-red-900/20 border border-red-500/50 text-red-300 rounded-lg">
          <div className="font-semibold">Error</div>
          <div className="mt-1 text-sm">{error}</div>
        </div>
      )}
    </div>
  );
}
