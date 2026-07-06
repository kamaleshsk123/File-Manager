import React, { useState, useRef } from 'react';
import {
  FileText, Image as ImageIcon, Film, Music, Archive,
  Code, File, MoreVertical, PenLine, Trash2, Share2, Download
} from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { API_URL } from '../api';

interface FileCardProps {
  file: {
    _id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt?: string;
    filename?: string;
    isShared?: boolean;
  };
  selected?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onShare?: () => void;
}

interface FileTypeConfig {
  icon: React.ReactNode;
  color: string;
  ext: string;
}

const getFileConfig = (type: string, name: string): FileTypeConfig => {
  const ext = name.split('.').pop()?.toUpperCase() || 'FILE';

  if (type.startsWith('image/'))
    return { icon: <ImageIcon className="h-10 w-10" />, color: '#0078D4', ext };
  if (type.startsWith('video/'))
    return { icon: <Film className="h-10 w-10" />, color: '#5C2D91', ext };
  if (type.startsWith('audio/'))
    return { icon: <Music className="h-10 w-10" />, color: '#E81123', ext };
  if (type.includes('pdf') || ['pdf', 'doc', 'docx'].includes(ext.toLowerCase()))
    return { icon: <FileText className="h-10 w-10" />, color: '#D83B01', ext };
  if (['zip', 'tar', 'gz', 'rar'].includes(ext.toLowerCase()) || type.includes('zip'))
    return { icon: <Archive className="h-10 w-10" />, color: '#986F0B', ext };
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json'].includes(ext.toLowerCase()))
    return { icon: <Code className="h-10 w-10" />, color: '#107C10', ext };
  return { icon: <File className="h-10 w-10" />, color: '#616161', ext };
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const FileCard = ({ file, selected, onSelect, onDoubleClick, onDelete, onRename, onShare }: FileCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cfg = getFileConfig(file.type, file.name);

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
      {/* Context menu trigger */}
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
              onClick={() => { setMenuOpen(false); window.open(`${API_URL}/files/download/${file._id}`); }}
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

      {/* File type icon */}
      <div
        className="flex items-center justify-center w-12 h-12 relative"
        style={{ color: cfg.color }}
      >
        {cfg.icon}
        {/* File type badge */}
        <span
          className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold px-0.5 rounded"
          style={{ background: cfg.color, color: 'white' }}
        >
          {cfg.ext}
        </span>
      </div>

      {/* Name + size */}
      <div className="mt-1.5 flex items-center gap-1 w-full justify-center px-1">
        {file.isShared && <Share2 className="h-2.5 w-2.5 text-primary shrink-0" />}
        <p
          className="text-[12px] text-foreground text-center leading-tight truncate max-w-full"
          title={file.name}
        >
          {file.name}
        </p>
      </div>
      <p className="text-[10.5px] text-muted-foreground mt-0.5">{formatSize(file.size)}</p>
    </div>
  );
};
