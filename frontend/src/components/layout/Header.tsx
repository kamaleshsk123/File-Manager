import React, { useState } from 'react';
import { Search, FolderPlus, Upload, Minus, Square, X } from 'lucide-react';

interface HeaderProps {
  onUpload?: () => void;
  onNewFolder?: () => void;
}

const Header = ({ onUpload, onNewFolder }: HeaderProps) => {
  const [search, setSearch] = useState('');

  return (
    <header className="flex h-9 shrink-0 items-center justify-between bg-[#F3F3F3] border-b border-border px-2 z-20 select-none">
      {/* Left: App icon + title */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Windows-style folder icon */}
        <div className="flex h-5 w-5 items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 4C1 3.44772 1.44772 3 2 3H6.17157C6.43678 3 6.69114 3.10536 6.87868 3.29289L7.62132 4.03553C7.80886 4.22307 8.06322 4.32843 8.32843 4.32843H13C13.5523 4.32843 14 4.77614 14 5.32843V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V5H1V4Z" fill="#FFB900"/>
            <path d="M2 5H14V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V5Z" fill="#FFC83D"/>
          </svg>
        </div>
        <span className="text-[12px] font-normal text-foreground">File Explorer</span>
      </div>

      {/* Center: Search */}
      <div className="flex flex-1 max-w-sm mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className="h-7 w-full rounded border border-border bg-white pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Right: Window chrome controls (cosmetic) */}
      <div className="flex items-center">
        <button
          title="Minimize"
          className="flex h-9 w-12 items-center justify-center text-foreground/70 hover:bg-[#E5E5E5] transition-colors"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <button
          title="Maximize"
          className="flex h-9 w-12 items-center justify-center text-foreground/70 hover:bg-[#E5E5E5] transition-colors"
        >
          <Square className="h-3 w-3" strokeWidth={1.5} />
        </button>
        <button
          title="Close"
          className="flex h-9 w-12 items-center justify-center text-foreground/70 hover:bg-[#C42B1C] hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};

export default Header;
