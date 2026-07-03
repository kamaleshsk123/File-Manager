import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStorage } from '../../api';
import {
  Home, FileText, Star, Trash2, Settings,
  HardDrive, Clock, Tag, ChevronRight, FolderOpen
} from 'lucide-react';

const MAX_BYTES = 15 * 1024 * 1024 * 1024; // 15 GB cap (arbitrary display limit)

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const sections = [
  {
    title: 'Main',
    items: [
      { id: 'home',     label: 'Home',      icon: <Home className="h-4 w-4" /> },
      { id: 'recent',   label: 'Recent',     icon: <Clock className="h-4 w-4" /> },
    ]
  },
  {
    title: 'Library',
    items: [
      { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
      { id: 'favorites', label: 'Favorites', icon: <Star className="h-4 w-4" /> },
      { id: 'tagged',    label: 'Tagged',    icon: <Tag className="h-4 w-4" /> },
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'trash',    label: 'Trash',     icon: <Trash2 className="h-4 w-4" />, badge: 0 },
      { id: 'settings', label: 'Settings',  icon: <Settings className="h-4 w-4" /> },
    ]
  }
];

interface SidebarProps {
  active: string;
  onChange: (id: string) => void;
}

const Sidebar = ({ active, onChange }: SidebarProps) => {

  const { data: storageData, isLoading } = useQuery({
    queryKey: ['storage'],
    queryFn: fetchStorage,
    refetchInterval: 30_000, // refresh every 30 s
  });

  const usedBytes  = storageData?.usedBytes  ?? 0;
  const totalFiles = storageData?.totalFiles ?? 0;
  const usedPct    = Math.min((usedBytes / MAX_BYTES) * 100, 100);
  const freeBytes  = Math.max(MAX_BYTES - usedBytes, 0);

  // Pick bar colour based on usage
  const barColor =
    usedPct > 85 ? 'from-red-500 to-red-400' :
    usedPct > 60 ? 'from-amber-500 to-yellow-400' :
    'from-primary to-blue-400';

  return (
    <aside className="w-[220px] shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar-bg overflow-y-auto">
      <nav className="flex-1 py-3 px-2 space-y-4">
        {sections.map(section => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-fg/40 select-none">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onChange(item.id)}
                      className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group
                        ${isActive
                          ? 'sidebar-item-active text-white'
                          : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-white'
                        }
                      `}
                    >
                      <span className={`${isActive ? 'text-white' : 'text-sidebar-fg/70 group-hover:text-white'} transition-colors`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {'badge' in item && item.badge! > 0 && (
                        <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold
                          ${isActive ? 'bg-white/20 text-white' : 'bg-destructive text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="h-3 w-3 text-white/60 ml-auto shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Real Storage Indicator ── */}
      <div className="m-3 p-3 rounded-xl border border-sidebar-border bg-sidebar-hover">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-sidebar-fg/80">Storage</span>
          {isLoading ? (
            <span className="text-[10px] text-sidebar-fg/40 animate-pulse">Loading…</span>
          ) : (
            <span className="text-[10px] text-sidebar-fg/50 tabular-nums">
              {formatBytes(usedBytes)} used
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-sidebar-border overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${barColor}`}
            style={{ width: isLoading ? '0%' : `${usedPct}%` }}
          />
        </div>

        {/* Stats row */}
        {!isLoading && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-sidebar-fg/40">
              {formatBytes(freeBytes)} free
            </p>
            <p className="text-[10px] text-sidebar-fg/40">
              {totalFiles} file{totalFiles !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
