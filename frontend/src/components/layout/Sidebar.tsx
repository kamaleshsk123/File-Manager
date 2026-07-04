import React, { useState } from 'react';
import {
  Home, FileText, Star, Trash2, Settings,
  Clock, Tag, ChevronRight, ChevronDown, FolderOpen, Download, HardDrive
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchStorage } from '../../api';

const MAX_BYTES = 15 * 1024 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

interface SidebarProps {
  active: string;
  onChange: (id: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// Small inline Windows-style folder SVG icon
const FolderIcon = ({ color = '#FFC83D', size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
    <path d="M2 5H14V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V5Z" fill={color} />
    <path d="M1 4C1 3.44772 1.44772 3 2 3H6.17157C6.43678 3 6.69114 3.10536 6.87868 3.29289L7.62132 4.03553C7.80886 4.22307 8.06322 4.32843 8.32843 4.32843H13C13.5523 4.32843 14 4.77614 14 5.32843V5H2V4Z" fill="#FFB900" />
  </svg>
);

const NavItemRow = ({
  item,
  isActive,
  onClick,
  indent = 0,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  indent?: number;
}) => (
  <button
    onClick={onClick}
    style={{ paddingLeft: `${12 + indent * 12}px` }}
    className={`flex items-center gap-1.5 w-full pr-2 py-[5px] text-[13px] transition-colors duration-75 select-none text-left rounded
      ${isActive
        ? 'bg-[#CCE4F7] text-foreground font-semibold'
        : 'text-foreground hover:bg-[#E5E5E5]'
      }`}
  >
    <span className={`shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
      {item.icon}
    </span>
    <span className="truncate flex-1">{item.label}</span>
  </button>
);

const SectionLabel = ({ label }: { label: string }) => (
  <div className="px-3 pt-3 pb-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide select-none">
    {label}
  </div>
);

const Sidebar = ({ active, onChange }: SidebarProps) => {
  const [quickAccessOpen, setQuickAccessOpen] = useState(true);

  const { data: storageData, isLoading } = useQuery({
    queryKey: ['storage'],
    queryFn: fetchStorage,
    refetchInterval: 30_000,
  });

  const usedBytes = storageData?.usedBytes ?? 0;
  const totalFiles = storageData?.totalFiles ?? 0;
  const usedPct = Math.min((usedBytes / MAX_BYTES) * 100, 100);

  const quickAccessItems: NavItem[] = [
    { id: 'home',      label: 'Home',       icon: <Home className="h-3.5 w-3.5" /> },
    { id: 'recent',    label: 'Recent',      icon: <Clock className="h-3.5 w-3.5" /> },
    { id: 'documents', label: 'Documents',   icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'favorites', label: 'Favorites',   icon: <Star className="h-3.5 w-3.5" /> },
    { id: 'tagged',    label: 'Tagged',      icon: <Tag className="h-3.5 w-3.5" /> },
  ];

  const systemItems: NavItem[] = [
    { id: 'trash',    label: 'Recycle Bin', icon: <Trash2 className="h-3.5 w-3.5" /> },
    { id: 'settings', label: 'Settings',    icon: <Settings className="h-3.5 w-3.5" /> },
  ];

  return (
    <aside className="w-[220px] shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar-bg overflow-y-auto">
      
      {/* Quick access section */}
      <div className="mt-1">
        <button
          onClick={() => setQuickAccessOpen(v => !v)}
          className="flex items-center gap-1 w-full px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-[#E5E5E5] transition-colors rounded select-none"
        >
          {quickAccessOpen
            ? <ChevronDown className="h-3 w-3 shrink-0" />
            : <ChevronRight className="h-3 w-3 shrink-0" />
          }
          Quick access
        </button>

        {quickAccessOpen && (
          <div className="mt-0.5 px-1">
            {quickAccessItems.map(item => (
              <NavItemRow
                key={item.id}
                item={item}
                isActive={active === item.id}
                onClick={() => onChange(item.id)}
                indent={1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-2 my-2" />

      {/* System section */}
      <div className="px-1">
        {systemItems.map(item => (
          <NavItemRow
            key={item.id}
            item={item}
            isActive={active === item.id}
            onClick={() => onChange(item.id)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Storage — compact Windows-style */}
      <div className="mx-2 mb-2 mt-2 p-2.5 border border-border rounded bg-white">
        <div className="flex items-center gap-1.5 mb-1.5">
          <HardDrive className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground font-medium">Local Disk (C:)</span>
        </div>
        {/* Progress bar */}
        <div className="h-3 w-full rounded-sm border border-border bg-[#F3F3F3] overflow-hidden">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: isLoading ? '0%' : `${usedPct}%`,
              background: usedPct > 85 ? '#C42B1C' : '#0078D4',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            {isLoading ? '…' : `${formatBytes(Math.max(MAX_BYTES - usedBytes, 0))} free`}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatBytes(MAX_BYTES)}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
