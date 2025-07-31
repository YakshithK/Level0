"use client";

import React, { useState, useEffect } from "react";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
}

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
  isExpanded?: boolean;
}

const FileExplorer: React.FC<{ onSelect: (file: string) => void, refreshTrigger?: number }> = ({ onSelect, refreshTrigger }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");

  // Helper function to build tree structure from flat file list
  const buildFileTree = (files: FileItem[]): FileTreeNode[] => {
    const tree: FileTreeNode[] = [];
    const pathMap = new Map<string, FileTreeNode>();

    // Sort files so directories come first, then by name
    const sortedFiles = [...files].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const file of sortedFiles) {
      const pathParts = file.path.split('/');
      let currentPath = '';
      let currentLevel = tree;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        let node = pathMap.get(currentPath);
        
        if (!node) {
          const isLastPart = i === pathParts.length - 1;
          node = {
            name: part,
            path: currentPath,
            type: isLastPart ? file.type : 'directory',
            children: file.type === 'directory' || !isLastPart ? [] : undefined,
            isExpanded: i === 0 // Auto-expand root level
          };
          
          pathMap.set(currentPath, node);
          currentLevel.push(node);
        }
        
        if (node.children) {
          currentLevel = node.children;
        }
      }
    }

    return tree;
  };

  useEffect(() => {
    fetch("/api/files")
      .then((res) => res.json())
      .then((data: FileItem[]) => {
        const tree = buildFileTree(data);
        setFileTree(tree);
      })
      .catch(() => setFileTree([]));
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  const handleFileSelect = (filePath: string, type: string) => {
    if (type === 'file') {
      setSelectedFile(filePath);
      onSelect(filePath);
    }
  };

  const toggleDirectory = (path: string) => {
    const updateTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.map(node => {
        if (node.path === path && node.type === 'directory') {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    
    setFileTree(updateTree(fileTree));
  };

  const getFileIcon = (fileName: string, type: string) => {
    if (type === 'directory') {
      return (
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        );
      case 'js':
      case 'jsx':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        );
      case 'json':
        return (
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 3C3.89 3 3 3.89 3 5v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2H5m0 2h14v14H5V5m1 2v2h2V7H6m4 0v2h2V7h-2m4 0v2h2V7h-2m-8 4v2h2v-2H6m4 0v2h2v-2h-2m4 0v2h2v-2h-2m-8 4v2h2v-2H6m4 0v2h2v-2h-2"/>
          </svg>
        );
      case 'md':
        return (
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const renderTreeNode = (node: FileTreeNode, depth: number = 0): React.ReactNode => {
    const indentWidth = depth * 16; // 16px per level
    
    return (
      <div key={node.path}>
        <button
          className={`w-full flex items-center space-x-2 px-3 py-1.5 text-left transition-all duration-150 hover:bg-gray-800 ${
            selectedFile === node.path && node.type === 'file'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
          style={{ paddingLeft: `${12 + indentWidth}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDirectory(node.path);
            } else {
              handleFileSelect(node.path, node.type);
            }
          }}
        >
          {node.type === 'directory' && (
            <svg 
              className={`w-3 h-3 text-gray-500 transition-transform ${node.isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {node.type === 'file' && <div className="w-3" />}
          {getFileIcon(node.name, node.type)}
          <span className="text-sm font-medium truncate">{node.name}</span>
        </button>
        
        {node.type === 'directory' && node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const countTotalFiles = (nodes: FileTreeNode[]): number => {
    let count = 0;
    for (const node of nodes) {
      if (node.type === 'file') {
        count++;
      }
      if (node.children) {
        count += countTotalFiles(node.children);
      }
    }
    return count;
  };

  const totalFiles = countTotalFiles(fileTree);

  return (
    <aside className="bg-gray-900 text-white w-80 h-full flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0H8z" />
          </svg>
          <span className="font-semibold text-sm">Explorer</span>
        </div>
        <button
          className="p-1 rounded hover:bg-gray-700 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* File Tree */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
              Project Files
            </div>
            <div>
              {fileTree.length > 0 ? (
                fileTree.map(node => renderTreeNode(node))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No files found
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-auto p-4 border-t border-gray-700 bg-gray-850">
            <div className="text-xs text-gray-500">
              {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default FileExplorer;
