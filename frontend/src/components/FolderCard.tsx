import React, { useState, useRef } from 'react';
import { Share2, MoreVertical, PenLine, Trash2, Download } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { API_URL } from '../api';

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

// Windows 11 folder SVG icon
const WinFolderIcon = ({ size = 48, selected = false }: { size?: number; selected?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {/* Tab */}
    <path
      d="M4 16C4 13.7909 5.79086 12 8 12H20.4853C21.0177 12 21.5284 12.2107 21.9142 12.5858L24.0858 14.7574C24.4716 15.1425 24.9823 15.3536 25.5147 15.3536H40C42.2091 15.3536 44 17.1445 44 19.3536V35C44 37.2091 42.2091 39 40 39H8C5.79086 39 4 37.2091 4 35V16Z"
      fill={selected ? '#0078D4' : '#FFB900'}
    />
    {/* Body */}
    <path
      d="M4 20H44V35C44 37.2091 42.2091 39 40 39H8C5.79086 39 4 37.2091 4 35V20Z"
      fill={selected ? '#55AAFF' : '#FFC83D'}
    />
    {/* Shine */}
    <path
      d="M4 20H44V24C44 24 34 28 24 24C14 20 4 24 4 24V20Z"
      fill="rgba(255,255,255,0.15)"
    />
  </svg>
);

export const FolderCard = ({ folder, onDoubleClick, selected, onSelect, onDelete, onRename, onShare }: FolderCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      className={`group relative flex flex-col items-center justify-start p-2 pt-3 cursor-pointer select-none rounded transition-colors duration-75
        ${selected
          ? 'bg-[#CCE4F7] outline outline-1 outline-[#0078D4]'
          : 'hover:bg-[#E5F3FF] hover:outline hover:outline-1 hover:outline-[#E5E5E5]'
        }
      `}
    >
      {/* Context menu trigger — only on hover */}
      <div ref={menuRef} className="absolute top-1 right-1 z-20">
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
          className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-[#D1D1D1] transition-all text-muted-foreground"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>

        {menuOpen && (
          <div
            className="absolute top-7 right-0 z-50 win-context-menu animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="win-context-menu-item"
              onClick={() => { setMenuOpen(false); window.open(`${API_URL}/folders/download/${folder._id}`); }}
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              Download
            </div>
            <div className="win-context-menu-sep" />
            <div
              className="win-context-menu-item"
              onClick={() => { setMenuOpen(false); onRename?.(); }}
            >
              <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
              Rename
            </div>
            <div
              className="win-context-menu-item"
              onClick={() => { setMenuOpen(false); onShare?.(); }}
            >
              <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
              Share
            </div>
            <div className="win-context-menu-sep" />
            <div
              className="win-context-menu-item text-red-600"
              onClick={() => { setMenuOpen(false); onDelete?.(); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </div>
          </div>
        )}
      </div>

      {/* Folder icon */}
      <WinFolderIcon size={48} selected={selected} />

      {/* Name */}
      <div className="mt-1.5 flex items-center gap-1 w-full justify-center px-1">
        {folder.isShared && (
          <Share2 className="h-2.5 w-2.5 text-primary shrink-0" />
        )}
        <p
          className="text-[12px] text-foreground text-center leading-tight truncate max-w-full"
          title={folder.name}
        >
          {folder.name}
        </p>
      </div>
    </div>
  );
};
