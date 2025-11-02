import { ChevronRight, ChevronDown, FileCode, Palette, Globe, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileExplorerProps {
  files: Record<string, string>;
  activeFile: string;
  onFileSelect: (path: string) => void;
}

const FileExplorer = ({ files, activeFile, onFileSelect }: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Build file tree from flat file list
  const buildFileTree = (): FileNode => {
    const root: FileNode = { name: 'root', path: 'root', type: 'folder', children: [] };
    
    Object.keys(files).forEach(filePath => {
      const parts = filePath.split('/');
      let current = root;
      
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');
        
        if (!current.children) current.children = [];
        
        let existing = current.children.find(child => child.name === part);
        
        if (!existing) {
          existing = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : []
          };
          current.children.push(existing);
        }
        
        if (!isFile) {
          current = existing;
        }
      });
    });
    
    return root;
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.html')) return <Globe className="h-4 w-4 text-orange-400" />;
    if (fileName.endsWith('.css')) return <Palette className="h-4 w-4 text-blue-400" />;
    if (fileName.endsWith('.js')) return <FileCode className="h-4 w-4 text-yellow-400" />;
    return <FileCode className="h-4 w-4 text-gray-400" />;
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderNode = (node: FileNode, depth: number = 0): JSX.Element | null => {
    if (node.type === 'folder' && node.name === 'root') {
      return (
        <div key="root">
          {node.children?.map(child => renderNode(child, depth))}
        </div>
      );
    }

    const isExpanded = expandedFolders.has(node.path);
    const isActive = node.type === 'file' && activeFile === node.path;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-2 py-1.5 h-auto font-mono text-xs hover:bg-muted/50 rounded-lg smooth-transition"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 mr-1 shrink-0 text-accent" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1 shrink-0 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 mr-2 shrink-0 text-accent" />
            ) : (
              <Folder className="h-4 w-4 mr-2 shrink-0 text-primary" />
            )}
            <span className="truncate font-medium">{node.name}</span>
          </Button>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Button
        key={node.path}
        variant="ghost"
        size="sm"
        className={`w-full justify-start px-2 py-1.5 h-auto font-mono text-xs rounded-lg smooth-transition ${
          isActive 
            ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-foreground font-semibold border border-accent/30' 
            : 'hover:bg-muted/50'
        }`}
        style={{ paddingLeft: `${depth * 12 + 24}px` }}
        onClick={() => onFileSelect(node.path)}
      >
        {getFileIcon(node.name)}
        <span className="ml-2 truncate">{node.name}</span>
      </Button>
    );
  };

  const fileTree = buildFileTree();

  return (
    <div className="h-full">
      <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <h3 className="text-xs font-bold uppercase gradient-text">Explorer</h3>
      </div>
      <ScrollArea className="h-[calc(100%-48px)]">
        <div className="p-2">
          {renderNode(fileTree)}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileExplorer;
