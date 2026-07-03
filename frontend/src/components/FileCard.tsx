import React, { useState, useRef } from 'react';
import {
  FileText, Image as ImageIcon, Film, Music, Archive,
  Code, File, MoreVertical, PenLine, Trash2, Share2, Download
} from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface FileCardProps {
  file: {
    _id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt?: string;
    filename?: string;
  };
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

interface FileTypeConfig {
  icon: React.ReactNode;
  color: string;
  bg: string;
  label: string;
}

const getFileConfig = (type: string, name: string): FileTypeConfig => {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (type.startsWith('image/'))
    return { icon: <ImageIcon className="h-7 w-7" />, color: 'text-sky-500', bg: 'bg-sky-50 border-sky-100', label: 'Image' };
  if (type.startsWith('video/'))
    return { icon: <Film className="h-7 w-7" />, color: 'text-violet-500', bg: 'bg-violet-50 border-violet-100', label: 'Video' };
  if (type.startsWith('audio/'))
    return { icon: <Music className="h-7 w-7" />, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-100', label: 'Audio' };
  if (type.includes('pdf') || type.includes('document') || ['pdf', 'doc', 'docx'].includes(ext))
    return { icon: <FileText className="h-7 w-7" />, color: 'text-red-500', bg: 'bg-red-50 border-red-100', label: 'Document' };
  if (['zip', 'tar', 'gz', 'rar'].includes(ext) || type.includes('zip'))
    return { icon: <Archive className="h-7 w-7" />, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100', label: 'Archive' };
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json'].includes(ext))
    return { icon: <Code className="h-7 w-7" />, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', label: 'Code' };
  return { icon: <File className="h-7 w-7" />, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-100', label: 'File' };
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const FileCard = ({ file, selected, onSelect, onDelete }: FileCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cfg = getFileConfig(file.type, file.name);

  useClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <div
      onClick={onSelect}
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
              onClick={() => window.open(`http://localhost:5000/api/files/download/${file._id}`)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
            >
              <Download className="h-3 w-3" />Download
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"><PenLine className="h-3 w-3" />Rename</button>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"><Share2 className="h-3 w-3" />Share</button>
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

      {/* Icon box or Image preview */}
      {file.type.startsWith('image/') && file.filename ? (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-border overflow-hidden bg-muted transition-transform duration-200 group-hover:scale-105">
          <img
            src={`http://localhost:5000/uploads/${file.filename}`}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 ${cfg.bg} ${cfg.color} transition-transform duration-200 group-hover:scale-105`}>
          {cfg.icon}
        </div>
      )}

      {/* Name */}
      <p className="w-full text-center text-[13px] font-medium text-foreground truncate leading-tight" title={file.name}>
        {file.name}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatSize(file.size)}</p>
    </div>
  );
};
