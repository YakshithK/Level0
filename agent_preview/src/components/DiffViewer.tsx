import React, { ReactNode } from 'react';
import { diff_match_patch } from 'diff-match-patch';

interface DiffViewerProps {
  original: string;
  updated: string;
  onApply: () => void;
  onDiscard: () => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  updated,
  onApply,
  onDiscard,
}) => {
  // Generate diff using diff-match-patch
  const dmp = new diff_match_patch();
  const diff = dmp.diff_main(original, updated);
  dmp.diff_cleanupSemantic(diff);

  // Split diffs into left (deletions) and right (additions)
  const leftContent: ReactNode[] = [];
  const rightContent: ReactNode[] = [];
  
  diff.forEach((change, index) => {
    const [type, text] = change;
    const formattedText = text.split('\n').map((line, i, arr) => (
      <React.Fragment key={`${index}-${i}`}>
        {line}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    ));

    if (type === -1) { // Deletion
      leftContent.push(
        <span key={index} className="bg-red-200 text-red-900">
          {formattedText}
        </span>
      );
      rightContent.push(<span key={index}></span>);
    } else if (type === 1) { // Addition
      leftContent.push(<span key={index}></span>);
      rightContent.push(
        <span key={index} className="bg-green-200 text-green-900">
          {formattedText}
        </span>
      );
    } else { // No change
      leftContent.push(
        <span key={index} className="text-gray-700">
          {formattedText}
        </span>
      );
      rightContent.push(
        <span key={index} className="text-gray-700">
          {formattedText}
        </span>
      );
    }
  });

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-750 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span className="text-sm font-medium text-red-300">Original</span>
          </div>
          <div className="w-px h-4 bg-gray-600"></div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-sm font-medium text-green-300">Updated</span>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {diff.filter(([type]) => type !== 0).length} changes
        </div>
      </div>

      {/* Diff Content */}
      <div className="grid grid-cols-2 divide-x divide-gray-700">
        <div className="bg-red-900/10">
          <div className="p-3 bg-red-900/20 border-b border-red-800/50">
            <div className="text-sm font-medium text-red-300 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              <span>Deletions</span>
            </div>
          </div>
          <pre className="p-4 text-sm font-mono overflow-auto max-h-[400px] whitespace-pre-wrap text-gray-300 leading-relaxed">
            {leftContent}
          </pre>
        </div>
        <div className="bg-green-900/10">
          <div className="p-3 bg-green-900/20 border-b border-green-800/50">
            <div className="text-sm font-medium text-green-300 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Additions</span>
            </div>
          </div>
          <pre className="p-4 text-sm font-mono overflow-auto max-h-[400px] whitespace-pre-wrap text-gray-300 leading-relaxed">
            {rightContent}
          </pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-750 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          Review the changes and choose an action
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md transition-all duration-200 flex items-center space-x-2 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Discard</span>
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-md transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
