import React, { useState } from 'react';
import {
  Search, Upload, FolderPlus, Bell, User,
  Command
} from 'lucide-react';

interface HeaderProps {
  onUpload?: () => void;
  onNewFolder?: () => void;
}

const Header = ({ onUpload, onNewFolder }: HeaderProps) => {
  const [search, setSearch] = useState('');

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-[hsl(var(--header-bg))] px-5 z-20 shadow-soft">
      {/* Logo */}
      <div className="flex items-center gap-2.5 min-w-[200px]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-primary-glow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M3 7C3 5.89 3.89 5 5 5H10.59C10.86 5 11.11 5.11 11.29 5.29L12.71 6.71C12.89 6.89 13.14 7 13.41 7H19C20.11 7 21 7.89 21 9V17C21 18.11 20.11 19 19 19H5C3.89 19 3 18.11 3 17V7Z" fill="currentColor" fillOpacity="0.9"/>
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-foreground">DocVault</span>
      </div>

      {/* Search */}
      <div className="flex flex-1 max-w-lg mx-6">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files and folders..."
            className="h-9 w-full rounded-lg border border-border bg-muted/60 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-white transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:flex h-5 items-center rounded border border-border bg-background px-1 text-[10px] font-medium text-muted-foreground">
              <Command className="h-2.5 w-2.5 mr-0.5" />K
            </kbd>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 min-w-[200px] justify-end">
        <button
          onClick={onNewFolder}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-soft"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          New Folder
        </button>
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all shadow-soft hover:shadow-primary-glow"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white text-xs font-semibold shadow-soft hover:shadow-primary-glow transition-all">
          JD
        </button>
      </div>
    </header>
  );
};

export default Header;
