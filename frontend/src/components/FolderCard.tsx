import React, { useState, useRef } from 'react';
import { Folder, MoreVertical, PenLine, Trash2, Share2 } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface FolderCardProps {
  folder: {
    _id: string;
    name: string;
    createdAt: string;
    isShared?: boolean;
  };
  onDoubleClick?: () => void;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onShare?: () => void;
}

export const FolderCard = ({ folder, onDoubleClick, selected, onSelect, onDelete, onRename, onShare }: FolderCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      className={`group relative flex flex-col items-center p-4 rounded-xl border cursor-pointer card-hover select-none
        ${selected
          ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20'
          : 'border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]'
        }
      `}
    >
      {/* Context menu wrapper */}
      <div ref={menuRef} className="absolute top-2 right-2 z-50">
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
          className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>

        {/* Context menu */}
        {menuOpen && (
          <div
            className="absolute top-8 right-0 w-36 rounded-xl border border-border bg-card shadow-card animate-scale-in overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename?.(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
            >
              <PenLine className="h-3 w-3" />Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onShare?.(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
            >
              <Share2 className="h-3 w-3" />Share
            </button>
            <div className="h-px bg-border my-1" />
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />Delete
            </button>
          </div>
        )}
      </div>

      {/* Icon */}
      <div className="relative mb-3">
        <div className={`absolute inset-0 rounded-full blur-xl opacity-20 transition-opacity group-hover:opacity-40
          ${selected ? 'bg-primary' : 'bg-amber-400'}`}
        />
        <Folder
          className={`h-14 w-14 relative icon-folder transition-transform duration-200 group-hover:scale-105
            ${selected ? 'text-primary' : 'text-amber-400'}`}
          fill="currentColor"
          fillOpacity={0.15}
          strokeWidth={1.5}
        />
      </div>

      {/* Name */}
      <div className="flex items-center justify-center gap-1 w-full max-w-full px-1">
        {folder.isShared && <Share2 className="h-3 w-3 text-primary shrink-0" />}
        <p className="text-[13px] font-medium text-foreground truncate leading-tight" title={folder.name}>
          {folder.name}
        </p>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {new Date(folder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  );
};
