import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStorage } from '../../api';

interface StatusBarProps {
  totalItems?: number;
  selectedCount?: number;
  selectedSize?: number;
  selectedType?: 'folder' | 'file';
  currentPath?: string;
}

const MAX_BYTES = 15 * 1024 * 1024 * 1024;

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
}: StatusBarProps) => {
  const { data: storageData, isLoading } = useQuery({
    queryKey: ['storage'],
    queryFn: fetchStorage,
    refetchInterval: 30_000,
  });

  const usedBytes = storageData?.usedBytes ?? 0;

  return (
    <footer className="flex items-center justify-between border-t border-border bg-[#F3F3F3] px-4 h-[22px] shrink-0 select-none">
      {/* Left: item count / selection info */}
      <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
        <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
        {selectedCount > 0 && (
          <span className="text-foreground">
            {selectedCount} {selectedType || 'item'} selected
            {selectedType === 'file' && selectedSize !== undefined
              ? ` (${formatBytes(selectedSize)})`
              : ''}
          </span>
        )}
      </div>

      {/* Right: storage */}
      <div className="text-[12px] text-muted-foreground">
        {isLoading ? (
          <span>Loading…</span>
        ) : (
          <span>{formatBytes(usedBytes)} used of {formatBytes(MAX_BYTES)}</span>
        )}
      </div>
    </footer>
  );
};

export default StatusBar;
