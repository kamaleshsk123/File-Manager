import React, { useState, useRef } from 'react';
import {
  Folder, FileText, Image as ImageIcon, Film, Music,
  Archive, Code, File, Trash2, PenLine, Share2,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

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
}

const getExtension = (name: string) => name.split('.').pop()?.toUpperCase() || 'FILE';

interface TypeInfo { label: string; color: string; bg: string; icon: React.ReactNode }

const getTypeInfo = (item: ListItem): TypeInfo => {
  if (item.isFolder) return { label: 'FOLDER', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Folder className="h-4 w-4 text-amber-500" fill="currentColor" fillOpacity={0.2} /> };
  const t = item.type || '';
  const ext = getExtension(item.name);
  if (t.startsWith('image/'))  return { label: ext, color: 'text-sky-700',     bg: 'bg-sky-100',     icon: <ImageIcon className="h-4 w-4 text-sky-500" /> };
  if (t.startsWith('video/'))  return { label: ext, color: 'text-violet-700',  bg: 'bg-violet-100',  icon: <Film className="h-4 w-4 text-violet-500" /> };
  if (t.startsWith('audio/'))  return { label: ext, color: 'text-yellow-700',  bg: 'bg-yellow-100',  icon: <Music className="h-4 w-4 text-yellow-500" /> };
  if (t.includes('pdf') || ext === 'PDF')  return { label: 'PDF', color: 'text-red-700', bg: 'bg-red-100', icon: <FileText className="h-4 w-4 text-red-500" /> };
  if (['DOC','DOCX','TXT','RTF'].includes(ext)) return { label: ext, color: 'text-blue-700', bg: 'bg-blue-100', icon: <FileText className="h-4 w-4 text-blue-500" /> };
  if (['MD'].includes(ext))    return { label: 'MARKDOWN', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: <FileText className="h-4 w-4 text-indigo-500" /> };
  if (['ZIP','TAR','GZ','RAR'].includes(ext)) return { label: ext, color: 'text-orange-700', bg: 'bg-orange-100', icon: <Archive className="h-4 w-4 text-orange-500" /> };
  if (['JS','TS','JSX','TSX','PY','JAVA','CPP','HTML','CSS','JSON'].includes(ext))
    return { label: ext, color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <Code className="h-4 w-4 text-emerald-500" /> };
  return { label: ext || 'FILE', color: 'text-slate-600', bg: 'bg-slate-100', icon: <File className="h-4 w-4 text-slate-400" /> };
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
}

const ListRow = ({ item, selected, onSelect, onDoubleClick, onDelete }: RowProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeInfo = getTypeInfo(item);
  const date = item.isFolder ? item.createdAt : item.uploadedAt;

  useClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <tr
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      className={`group relative border-b border-border cursor-pointer select-none transition-colors
        ${selected ? 'bg-primary/5' : 'hover:bg-muted/50'}
      `}
    >
      {/* Name */}
      <td className="py-2 pl-4 pr-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0">{typeInfo.icon}</span>
          <span className={`text-sm font-medium truncate max-w-xs ${selected ? 'text-primary' : 'text-foreground'}`} title={item.name}>
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
            className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-7 z-50 w-36 rounded-xl border border-border bg-card shadow-card animate-scale-in overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <button className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors">
                <PenLine className="h-3 w-3" />Rename
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors">
                <Share2 className="h-3 w-3" />Share
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { setMenuOpen(false); onDelete?.(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" />Delete
              </button>
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
      className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors group"
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={`transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
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
  onDeleteFolder?: (id: string) => void;
  onDeleteFile?: (id: string) => void;
}

export const ListView = ({
  folders, files, selectedId, onSelect, onFolderOpen, onDeleteFolder, onDeleteFile
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
              onDoubleClick={item.isFolder ? () => onFolderOpen?.(item._id, item.name) : undefined}
              onDelete={item.isFolder ? () => onDeleteFolder?.(item._id) : () => onDeleteFile?.(item._id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
