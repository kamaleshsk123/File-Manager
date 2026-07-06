import React from 'react';
import {
  Folder, FileText, Image as ImageIcon, Film, Music,
  Archive, Code, File, Download, ExternalLink, X, FolderOpen
} from 'lucide-react';
import { API_URL } from '../api';

interface PreviewPanelProps {
  item: {
    _id: string;
    name: string;
    size?: number;
    type?: string;
    createdAt?: string;
    uploadedAt?: string;
    filename?: string;
    isFolder?: boolean; // If mapped from ListView
  } | null;
  onClose: () => void;
  onOpenFolder?: (id: string, name: string) => void;
  onOpenFile?: (item: any) => void;
}

const getFileConfig = (type: string, name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (type.startsWith('image/'))
    return { icon: <ImageIcon className="h-16 w-16 text-sky-500" />, label: 'Image File' };
  if (type.startsWith('video/'))
    return { icon: <Film className="h-16 w-16 text-violet-500" />, label: 'Video File' };
  if (type.startsWith('audio/'))
    return { icon: <Music className="h-16 w-16 text-yellow-500" />, label: 'Audio File' };
  if (type.includes('pdf') || type.includes('document') || ['pdf', 'doc', 'docx'].includes(ext))
    return { icon: <FileText className="h-16 w-16 text-red-500" />, label: 'Document' };
  if (['zip', 'tar', 'gz', 'rar'].includes(ext) || type.includes('zip'))
    return { icon: <Archive className="h-16 w-16 text-orange-500" />, label: 'Archive' };
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json'].includes(ext))
    return { icon: <Code className="h-16 w-16 text-emerald-500" />, label: 'Source Code' };
  return { icon: <File className="h-16 w-16 text-slate-400" />, label: 'File' };
};

const formatSize = (bytes?: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const PreviewPanel = ({ item, onClose, onOpenFolder, onOpenFile }: PreviewPanelProps) => {
  if (!item) return null;

  // Determine if it is a folder.
  // Note: folders from MongoDB usually don't have a 'type' field, files do.
  const isFolder = item.isFolder || !item.type;

  const title = item.name;
  const dateStr = new Date(item.createdAt || item.uploadedAt || '').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const fileTypeLabel = isFolder ? 'Folder' : (item.type ? getFileConfig(item.type, item.name).label : 'File');
  
  // Icon / Preview Rendering
  let previewElement;
  if (isFolder) {
    previewElement = (
      <div className="relative flex items-center justify-center h-28 w-28">
        <Folder className="h-24 w-24 text-amber-400" fill="currentColor" fillOpacity={0.15} strokeWidth={1.5} />
      </div>
    );
  } else if (item.type?.startsWith('image/') && item.filename) {
    previewElement = (
      <div className="h-28 w-full rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center shadow-sm">
        <img
          src={`${API_URL}/files/download/${item._id}`}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  } else {
    const cfg = getFileConfig(item.type || '', item.name);
    previewElement = (
      <div className="flex items-center justify-center h-28 w-28 rounded-2xl bg-muted border border-border">
        {cfg.icon}
      </div>
    );
  }

  // Set mock/standard descriptions
  let description = 'No description available.';
  if (isFolder) {
    if (title === 'Research & Discovery') {
      description = 'Customer pain points and user journey flows — the foundation of the product.';
    } else {
      description = 'Folder containing files and subdirectories.';
    }
  } else if (item.type?.startsWith('image/')) {
    description = 'Image file uploaded by user.';
  } else if (item.type?.includes('pdf')) {
    description = 'Portable Document Format (PDF) file.';
  } else if (item.type?.includes('document') || item.name.endsWith('.doc') || item.name.endsWith('.docx')) {
    description = 'Microsoft Word document.';
  }

  return (
    <div className="w-[280px] shrink-0 border-l border-border bg-card flex flex-col h-full animate-fade-in relative z-10 shadow-soft">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-foreground/80 tracking-wider uppercase">Preview</span>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main preview details */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center">
        {/* Preview graphic */}
        <div className="mb-6 flex justify-center w-full">
          {previewElement}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground text-center w-full truncate px-2 mb-6" title={title}>
          {title}
        </h3>

        {/* Description section */}
        <div className="w-full text-left mb-6">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
          <p className="text-xs text-foreground/80 leading-relaxed font-normal">
            {description}
          </p>
        </div>

        {/* Properties section */}
        <div className="w-full text-left mb-8">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Properties</h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium text-foreground">{fileTypeLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">{dateStr}</span>
            </div>
            {!isFolder && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Size</span>
                <span className="font-medium text-foreground">{formatSize(item.size)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full mt-auto">
          {isFolder ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onOpenFolder?.(item._id, item.name)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted transition-colors"
              >
                <FolderOpen className="h-4 w-4" /> Open Folder
              </button>
              <button
                onClick={() => window.open(`${API_URL}/folders/download/${item._id}`)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-soft"
              >
                <Download className="h-4 w-4" /> Download ZIP
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (onOpenFile) onOpenFile(item);
                  else window.open(`${API_URL}/files/download/${item._id}`);
                }}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Open File
              </button>
              <button
                onClick={() => window.open(`${API_URL}/files/download/${item._id}`)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-soft"
              >
                <Download className="h-4 w-4" /> Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
