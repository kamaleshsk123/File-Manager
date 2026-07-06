import React, { useState, useRef } from 'react';
import {
  Folder, FileText, Image as ImageIcon, Film, Music,
  Archive, Code, File, Trash2, PenLine, Share2, Download,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { API_URL } from '../api';

// ── helpers ──────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'date' | 'type' | 'size';
type SortDir = 'asc' | 'desc';

interface ListItem {
  _id: string;
  name: string;
  size?: number;
  type?: string;
  createdAt?: string;
  uploadedAt?: string;
  isFolder: boolean;
  filename?: string;
  isShared?: boolean;
}

const getExtension = (name: string) => name.split('.').pop()?.toUpperCase() || 'FILE';

interface TypeInfo { label: string; color: string; bg: string; icon: React.ReactNode }

const getTypeInfo = (item: ListItem): TypeInfo => {
  if (item.isFolder) return { label: 'Folder', color: 'text-amber-700', bg: 'bg-amber-50', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 5H14V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V5Z" fill="#FFC83D"/>
      <path d="M1 4C1 3.44 1.44 3 2 3H6.17C6.43 3 6.69 3.1 6.87 3.29L7.62 4.04C7.8 4.22 8.06 4.33 8.32 4.33H13C13.55 4.33 14 4.77 14 5.33V5H2V4Z" fill="#FFB900"/>
    </svg>
  )};
  const t = item.type || '';
  const ext = getExtension(item.name);
  if (t.startsWith('image/'))  return { label: ext, color: 'text-sky-700',     bg: 'bg-sky-50',     icon: <ImageIcon className="h-4 w-4" style={{color:'#0078D4'}} /> };
  if (t.startsWith('video/'))  return { label: ext, color: 'text-violet-700',  bg: 'bg-violet-50',  icon: <Film className="h-4 w-4" style={{color:'#5C2D91'}} /> };
  if (t.startsWith('audio/'))  return { label: ext, color: 'text-yellow-700',  bg: 'bg-yellow-50',  icon: <Music className="h-4 w-4" style={{color:'#E81123'}} /> };
  if (t.includes('pdf') || ext === 'PDF')  return { label: 'PDF Document', color: 'text-red-700', bg: 'bg-red-50', icon: <FileText className="h-4 w-4" style={{color:'#D83B01'}} /> };
  if (['DOC','DOCX','TXT','RTF'].includes(ext)) return { label: ext + ' Document', color: 'text-blue-700', bg: 'bg-blue-50', icon: <FileText className="h-4 w-4" style={{color:'#0078D4'}} /> };
  if (['MD'].includes(ext))    return { label: 'Markdown', color: 'text-indigo-700', bg: 'bg-indigo-50', icon: <FileText className="h-4 w-4" style={{color:'#8764B8'}} /> };
  if (['ZIP','TAR','GZ','RAR'].includes(ext)) return { label: 'Compressed', color: 'text-orange-700', bg: 'bg-orange-50', icon: <Archive className="h-4 w-4" style={{color:'#986F0B'}} /> };
  if (['JS','TS','JSX','TSX','PY','JAVA','CPP','HTML','CSS','JSON'].includes(ext))
    return { label: ext + ' Source', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <Code className="h-4 w-4" style={{color:'#107C10'}} /> };
  return { label: ext || 'File', color: 'text-slate-600', bg: 'bg-slate-50', icon: <File className="h-4 w-4 text-slate-400" /> };
};

const formatSize = (bytes?: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  item: ListItem;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onShare?: () => void;
}

const ListRow = ({ item, selected, onSelect, onDoubleClick, onDelete, onRename, onShare }: RowProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeInfo = getTypeInfo(item);
  const date = item.isFolder ? item.createdAt : item.uploadedAt;

  useClickOutside(menuRef, () => setMenuOpen(false));

  const isImage = !item.isFolder && item.type?.startsWith('image/') && item.filename;
  const iconElement = isImage ? (
    <div className="h-5 w-5 rounded overflow-hidden border border-border bg-muted flex items-center justify-center">
      <img
        src={`${API_URL}/files/download/${item._id}`}
        alt={item.name}
        className="h-full w-full object-cover"
      />
    </div>
  ) : (
    typeInfo.icon
  );

  return (
    <tr
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      className={`group relative border-b border-border cursor-pointer select-none transition-colors duration-75
        ${selected
          ? 'bg-[#CCE4F7]'
          : 'hover:bg-[#E5F3FF]'
        }
      `}
    >
      {/* Name */}
      <td className="py-2 pl-4 pr-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0">{iconElement}</span>
          <span className={`text-sm font-medium truncate max-w-xs flex items-center gap-1.5 ${selected ? 'text-primary' : 'text-foreground'}`} title={item.name}>
            {item.isShared && <Share2 className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />}
            {item.name}
          </span>
        </div>
      </td>

      {/* Date */}
      <td className="py-2 px-3 text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(date)}
      </td>

      {/* Type badge */}
      <td className="py-2 px-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${typeInfo.bg} ${typeInfo.color}`}>
          {typeInfo.label}
        </span>
      </td>

      {/* Size */}
      <td className="py-2 px-3 text-sm text-muted-foreground whitespace-nowrap">
        {item.isFolder ? '—' : formatSize(item.size)}
      </td>

      {/* Actions */}
      <td className="py-2 pl-3 pr-4 w-10 text-right relative">
        <div ref={menuRef} className="relative inline-block">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[#D1D1D1] transition-all"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-7 z-50 win-context-menu animate-scale-in"
              onClick={e => e.stopPropagation()}
            >
              <div
                className="win-context-menu-item"
                onClick={() => { setMenuOpen(false); window.open(`${API_URL}/${item.isFolder ? 'folders' : 'files'}/download/${item._id}`); }}
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                Download
              </div>
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
      </td>
    </tr>
  );
};

// ── Column Header ─────────────────────────────────────────────────────────────

const ColHeader = ({
  label, sortKey, current, dir, onSort
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) => {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="py-1.5 px-3 text-left text-[12px] font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:bg-[#E5E5E5] transition-colors border-b-2 border-border"
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={`transition-opacity ${active ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-40'}`}>
          {active && dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </div>
    </th>
  );
};

// ── List View Component ───────────────────────────────────────────────────────

interface ListViewProps {
  folders: any[];
  files: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFolderOpen?: (id: string, name: string) => void;
  onOpenFile?: (file: any) => void;
  onDeleteFolder?: (id: string) => void;
  onDeleteFile?: (id: string) => void;
  onRenameFolder?: (id: string) => void;
  onRenameFile?: (id: string) => void;
  onShareFolder?: (id: string) => void;
  onShareFile?: (id: string) => void;
}

export const ListView = ({
  folders, files, selectedId, onSelect, onFolderOpen, onOpenFile, onDeleteFolder, onDeleteFile, onRenameFolder, onRenameFile, onShareFolder, onShareFile
}: ListViewProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // Merge and sort items (folders first, then files)
  const folderItems: ListItem[] = folders.map((f: any) => ({ ...f, isFolder: true }));
  const fileItems: ListItem[] = files.map((f: any) => ({ ...f, isFolder: false }));

  const sortItems = (items: ListItem[]) =>
    [...items].sort((a, b) => {
      let av: string | number = '', bv: string | number = '';
      if (sortKey === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      if (sortKey === 'date') { av = a.createdAt || a.uploadedAt || ''; bv = b.createdAt || b.uploadedAt || ''; }
      if (sortKey === 'size') { av = a.size || 0; bv = b.size || 0; }
      if (sortKey === 'type') { av = getTypeInfo(a).label; bv = getTypeInfo(b).label; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const sortedFolders = sortItems(folderItems);
  const sortedFiles = sortItems(fileItems);
  const allItems = [...sortedFolders, ...sortedFiles];

  return (
    <div className="animate-fade-in w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="py-2 pl-4 pr-3 text-left text-xs font-semibold text-muted-foreground w-full">
              <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors group" onClick={() => handleSort('name')}>
                Name
                <span className={sortKey === 'name' ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}>
                  {sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </span>
              </div>
            </th>
            <ColHeader label="Date modified" sortKey="date" current={sortKey} dir={sortDir} onSort={handleSort} />
            <ColHeader label="Type"          sortKey="type" current={sortKey} dir={sortDir} onSort={handleSort} />
            <ColHeader label="Size"          sortKey="size" current={sortKey} dir={sortDir} onSort={handleSort} />
            <th className="py-2 pl-3 pr-4 w-10" />
          </tr>
        </thead>
        <tbody>
          {allItems.map(item => (
            <ListRow
              key={item._id}
              item={item}
              selected={selectedId === item._id}
              onSelect={() => onSelect(item._id)}
              onDoubleClick={item.isFolder 
                ? () => onFolderOpen?.(item._id, item.name) 
                : () => onOpenFile?.(item)
              }
              onDelete={item.isFolder ? () => onDeleteFolder?.(item._id) : () => onDeleteFile?.(item._id)}
              onRename={item.isFolder ? () => onRenameFolder?.(item._id) : () => onRenameFile?.(item._id)}
              onShare={item.isFolder ? () => onShareFolder?.(item._id) : () => onShareFile?.(item._id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
