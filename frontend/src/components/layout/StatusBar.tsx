import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStorage } from '../../api';
import { HardDrive } from 'lucide-react';

interface StatusBarProps {
  totalItems?: number;
  selectedCount?: number;
  selectedSize?: number;
  selectedType?: 'folder' | 'file';
  currentPath?: string;
}

const MAX_BYTES = 15 * 1024 * 1024 * 1024; // 15 GB cap

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const StatusBar = ({
  totalItems = 0,
  selectedCount = 0,
  selectedSize,
  selectedType,
  currentPath = 'Home'
}: StatusBarProps) => {
  const { data: storageData, isLoading } = useQuery({
    queryKey: ['storage'],
    queryFn: fetchStorage,
    refetchInterval: 30_000,
  });

  const usedBytes = storageData?.usedBytes ?? 0;

  return (
    <footer className="flex items-center justify-between border-t border-border bg-[hsl(var(--toolbar-bg))] px-5 py-1.5 shrink-0">
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
        {selectedCount > 0 && (
          <span className="text-primary font-semibold">
            1 {selectedType || 'item'} selected
            {selectedType === 'file' && selectedSize !== undefined && ` (${formatBytes(selectedSize)})`}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <HardDrive className="h-3 w-3" />
        {isLoading ? (
          <span>Loading storage...</span>
        ) : (
          <span>{formatBytes(usedBytes)} used of {formatBytes(MAX_BYTES)}</span>
        )}
      </div>
    </footer>
  );
};

export default StatusBar;
