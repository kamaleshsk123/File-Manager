import React, { useState } from 'react';
import {
  FolderPlus, Upload, RefreshCw, Trash2, PenLine,
  LayoutGrid, List, ArrowUpDown, MoreHorizontal,
  Copy, Scissors, ClipboardPaste
} from 'lucide-react';

interface ToolbarProps {
  onUpload?: () => void;
  onNewFolder?: () => void;
  view: 'grid' | 'list';
  onViewChange: (v: 'grid' | 'list') => void;
  selectedCount?: number;
}

const Toolbar = ({ onUpload, onNewFolder, view, onViewChange, selectedCount = 0 }: ToolbarProps) => {
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div className="flex items-center gap-1 border-b border-border bg-[hsl(var(--toolbar-bg))] px-4 py-1.5 shrink-0 z-10">
      {/* Primary actions */}
      <button
        onClick={onNewFolder}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        <FolderPlus className="h-3.5 w-3.5 text-primary" />
        New Folder
      </button>
      <button
        onClick={onUpload}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        <Upload className="h-3.5 w-3.5 text-primary" />
        Upload
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Selection actions — only show when selected */}
      <button
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy
      </button>
      <button
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Scissors className="h-3.5 w-3.5" />
        Cut
      </button>
      <button
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <PenLine className="h-3.5 w-3.5" />
        Rename
      </button>
      <button
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      <button className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors">
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </button>

      <div className="flex-1" />

      {/* Sort */}
      <div className="relative">
        <button
          onClick={() => setSortOpen(v => !v)}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort
        </button>
        {sortOpen && (
          <div className="absolute right-0 top-9 z-50 w-40 rounded-xl border border-border bg-card shadow-card animate-scale-in overflow-hidden">
            {['Name', 'Date modified', 'Size', 'Type'].map(o => (
              <button key={o} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View toggle */}
      <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/50">
        <button
          onClick={() => onViewChange('grid')}
          className={`flex h-5.5 w-5.5 items-center justify-center rounded transition-all p-1 ${view === 'grid' ? 'bg-background shadow-soft text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onViewChange('list')}
          className={`flex h-5.5 w-5.5 items-center justify-center rounded transition-all p-1 ${view === 'list' ? 'bg-background shadow-soft text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <List className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
