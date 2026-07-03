import React from 'react';
import { HardDrive } from 'lucide-react';

interface StatusBarProps {
  totalItems?: number;
  selectedCount?: number;
  currentPath?: string;
}

const StatusBar = ({ totalItems = 0, selectedCount = 0, currentPath = 'Home' }: StatusBarProps) => {
  return (
    <footer className="flex items-center justify-between border-t border-border bg-[hsl(var(--toolbar-bg))] px-5 py-1 shrink-0">
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
        {selectedCount > 0 && (
          <span className="text-primary font-medium">{selectedCount} selected</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <HardDrive className="h-3 w-3" />
        <span>4.2 GB used of 15 GB</span>
      </div>
    </footer>
  );
};

export default StatusBar;
