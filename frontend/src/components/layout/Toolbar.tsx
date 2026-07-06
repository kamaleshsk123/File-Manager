import React, { useState } from 'react';
import {
  FolderPlus, Upload, RefreshCw, Trash2, PenLine,
  LayoutGrid, List, Copy, Scissors, ClipboardPaste,
  Share2, ChevronDown, MoreHorizontal, SortAsc
} from 'lucide-react';

interface ToolbarProps {
  onUpload?: () => void;
  onNewFolder?: () => void;
  view: 'grid' | 'list';
  onViewChange: (v: 'grid' | 'list') => void;
  selectedCount?: number;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

// Separator between button groups
const Sep = () => (
  <div className="w-px h-6 bg-border mx-0.5 shrink-0" />
);

// Windows 11 flat command bar button
const CmdBtn = ({
  icon,
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 min-w-[44px] h-full rounded transition-colors duration-75 select-none
      ${danger
        ? 'text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent'
        : 'text-foreground hover:bg-[#E5E5E5] disabled:opacity-30 disabled:hover:bg-transparent'
      } disabled:cursor-not-allowed`}
  >
    <span className="flex items-center justify-center">{icon}</span>
    <span className="text-[10.5px] leading-none whitespace-nowrap">{label}</span>
  </button>
);

const Toolbar = ({ 
  onUpload, onNewFolder, view, onViewChange, selectedCount = 0,
  onCut, onCopy, onPaste, canPaste = false,
  onRename, onDelete, onShare 
}: ToolbarProps) => {
  const [sortOpen, setSortOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <div className="flex items-stretch h-[52px] border-b border-border bg-[#F3F3F3] px-1 shrink-0 z-10">

      {/* Group 1: New / Upload */}
      <CmdBtn
        icon={<FolderPlus className="h-4 w-4 text-[#FFB900]" />}
        label="New folder"
        onClick={onNewFolder}
      />
      <CmdBtn
        icon={<Upload className="h-4 w-4 text-primary" />}
        label="Upload"
        onClick={onUpload}
      />

      <Sep />

      {/* Group 2: Clipboard */}
      <CmdBtn icon={<Scissors className="h-4 w-4" />} label="Cut" disabled={selectedCount === 0} onClick={onCut} />
      <CmdBtn icon={<Copy className="h-4 w-4" />} label="Copy" disabled={selectedCount === 0} onClick={onCopy} />
      <CmdBtn icon={<ClipboardPaste className="h-4 w-4" />} label="Paste" disabled={!canPaste} onClick={onPaste} />

      <Sep />

      {/* Group 3: Item actions */}
      <CmdBtn icon={<PenLine className="h-4 w-4" />} label="Rename" disabled={selectedCount === 0} onClick={onRename} />
      <CmdBtn icon={<Share2 className="h-4 w-4" />} label="Share" disabled={selectedCount === 0} onClick={onShare} />
      <CmdBtn icon={<Trash2 className="h-4 w-4" />} label="Delete" disabled={selectedCount === 0} danger onClick={onDelete} />

      <Sep />

      {/* Group 4: Refresh */}
      <CmdBtn icon={<RefreshCw className="h-4 w-4" />} label="Refresh" onClick={() => window.location.reload()} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sort dropdown */}
      <div className="relative flex items-center">
        <button
          onClick={() => { setSortOpen(v => !v); setViewOpen(false); }}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 h-full rounded hover:bg-[#E5E5E5] transition-colors"
        >
          <SortAsc className="h-4 w-4 text-foreground" />
          <span className="text-[10.5px]">Sort</span>
        </button>
        {sortOpen && (
          <div className="absolute right-0 top-full mt-0.5 z-50 w-44 bg-popover border border-border rounded-lg shadow-win-menu animate-scale-in overflow-hidden py-1">
            {['Name', 'Date modified', 'Size', 'Type'].map(o => (
              <button
                key={o}
                onClick={() => setSortOpen(false)}
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#E5E5E5] transition-colors"
              >
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View toggle */}
      <div className="relative flex items-center">
        <button
          onClick={() => { setViewOpen(v => !v); setSortOpen(false); }}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 h-full rounded hover:bg-[#E5E5E5] transition-colors"
        >
          {view === 'grid'
            ? <LayoutGrid className="h-4 w-4 text-foreground" />
            : <List className="h-4 w-4 text-foreground" />
          }
          <span className="text-[10.5px]">View</span>
        </button>
        {viewOpen && (
          <div className="absolute right-0 top-full mt-0.5 z-50 w-40 bg-popover border border-border rounded-lg shadow-win-menu animate-scale-in overflow-hidden py-1">
            <button
              onClick={() => { onViewChange('grid'); setViewOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#E5E5E5] transition-colors
                ${view === 'grid' ? 'font-semibold text-primary' : ''}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Medium icons
              {view === 'grid' && <span className="ml-auto text-primary">✓</span>}
            </button>
            <button
              onClick={() => { onViewChange('list'); setViewOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-[#E5E5E5] transition-colors
                ${view === 'list' ? 'font-semibold text-primary' : ''}`}
            >
              <List className="h-3.5 w-3.5" />
              Details
              {view === 'list' && <span className="ml-auto text-primary">✓</span>}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default Toolbar;
