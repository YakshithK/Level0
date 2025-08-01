import React, { useEffect, useRef, useState } from 'react';

interface PreviewProps {
  selectedFile: string;
  onRefresh: () => void;
}

export default function Preview({ selectedFile, onRefresh }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Auto-refresh when file changes
  const handleRefresh = () => {
    setIsLoading(true);
    setError("");
    setLastRefresh(Date.now());
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Load the preview
  useEffect(() => {
    handleRefresh();
  }, [selectedFile]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError("");
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError("Failed to load preview. Make sure your game files are properly configured.");
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 2H7a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z" />
          </svg>
          <span className="font-semibold text-xs text-white">Game Preview</span>
          {isLoading && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400">Loading...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 rounded text-xs"
          >
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </div>
          </button>
          <button
            onClick={() => window.open('/api/preview', '_blank')}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
          >
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Open</span>
            </div>
          </button>
        </div>
      </div>

      {/* Preview Content - Takes remaining space */}
      <div className="flex-1 relative bg-black min-h-0">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">Preview Error</h3>
            <p className="text-gray-400 mb-4 max-w-md">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-300">Loading game preview...</p>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={`/api/preview?t=${lastRefresh}`}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="Game Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </>
        )}
      </div>
    </div>
  );
}
