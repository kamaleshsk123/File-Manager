import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFolders, fetchFiles, createFolder, uploadFile, deleteFolder, deleteFile, renameFolder, renameFile, shareItem, unshareItem } from '../../api';
import { FolderCard } from '../FolderCard';
import { FileCard } from '../FileCard';
import { ListView } from '../ListView';
import { PreviewPanel } from '../PreviewPanel';
import { MarkdownPreviewModal } from '../MarkdownPreviewModal';
import StatusBar from './StatusBar';
import RenameModal from './RenameModal';
import ShareModal from './ShareModal';
import { FolderPlus, Upload, FolderOpen, X } from 'lucide-react';

interface MainContentProps {
  currentFolderId?: string | null;
  onFolderOpen?: (id: string, name: string) => void;
  view: 'grid' | 'list';
  activeTab?: string;
}

// --- New Folder Modal ---
const NewFolderModal = ({ open, onClose, parentId }: { open: boolean; onClose: () => void; parentId?: string | null }) => {
  const [name, setName] = useState('');
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => createFolder(name, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setName('');
      onClose();
    }
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm rounded border border-border bg-white shadow-win-menu p-0 animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 5H14V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V5Z" fill="#FFC83D"/>
              <path d="M1 4C1 3.44 1.44 3 2 3H6.17C6.43 3 6.69 3.1 6.87 3.29L7.62 4.04C7.8 4.22 8.06 4.33 8.32 4.33H13C13.55 4.33 14 4.77 14 5.33V5H2V4Z" fill="#FFB900"/>
            </svg>
            <h2 className="text-[13px] font-semibold text-foreground">New Folder</h2>
          </div>
        </div>
        <div className="px-5 pt-4 pb-5">
          <p className="text-[12px] text-muted-foreground mb-3">Enter a name for the new folder:</p>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && mutation.mutate()}
            placeholder="New folder"
            className="w-full h-8 rounded border border-border bg-white px-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 mb-4"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="h-8 px-5 rounded border border-border text-[12px] font-normal text-foreground hover:bg-[#E5E5E5] transition-colors">
              Cancel
            </button>
            <button
              onClick={() => name.trim() && mutation.mutate()}
              disabled={!name.trim() || mutation.isPending}
              className="h-8 px-5 rounded bg-primary text-white text-[12px] font-normal hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {mutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Upload Modal ---
const ALLOWED_EXTS = ['.pdf', '.md'];
const ALLOWED_TYPES = ['application/pdf', 'text/markdown', 'text/x-markdown'];

const isAllowed = (file: File) => {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return ALLOWED_EXTS.includes(ext) || ALLOWED_TYPES.includes(file.type);
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

interface QueuedFile { file: File; id: string; valid: boolean; }

const UploadModal = ({ open, onClose, folderId }: { open: boolean; onClose: () => void; folderId?: string | null }) => {
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (files: File[]) => uploadFile(files, folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
      setQueue([]);
      setError(null);
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next: QueuedFile[] = Array.from(incoming).map(file => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      valid: isAllowed(file),
    }));
    setQueue(prev => {
      // Avoid duplicate names
      const existing = new Set(prev.map(q => q.file.name));
      return [...prev, ...next.filter(n => !existing.has(n.file.name))];
    });
  };

  const removeFile = (id: string) => setQueue(prev => prev.filter(q => q.id !== id));

  const validFiles = queue.filter(q => q.valid).map(q => q.file);

  const handleUpload = () => {
    setError(null);
    if (validFiles.length === 0) return;
    mutation.mutate(validFiles);
  };

  const handleClose = () => {
    setQueue([]);
    setError(null);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in" onClick={handleClose}>
      <div
        className="w-full max-w-md rounded border border-border bg-white shadow-win-menu animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <h2 className="text-[13px] font-semibold text-foreground">Upload Files</h2>
          </div>
          <button onClick={handleClose} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#E5E5E5] text-muted-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-5">
          {/* Restriction notice */}
          <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            Only <strong className="mx-0.5">.pdf</strong> and <strong className="mx-0.5">.md</strong> files are supported. Multiple files allowed.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-1.5 rounded border-2 border-dashed p-6 cursor-pointer transition-colors mb-3
              ${dragging
                ? 'border-primary bg-[#E5F3FF]'
                : 'border-border bg-[#FAFAFA] hover:border-primary/50 hover:bg-[#F5F5F5]'
              }`}
          >
            <Upload className={`h-7 w-7 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-[12px] font-medium text-foreground">Drop files here or click to browse</p>
            <p className="text-[11px] text-muted-foreground">Supported: PDF, Markdown (.md)</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.md,application/pdf,text/markdown"
              className="hidden"
              onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
            />
          </div>

          {/* File queue */}
          {queue.length > 0 && (
            <div className="border border-border rounded overflow-hidden mb-3">
              <div className="bg-[#F3F3F3] border-b border-border px-3 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {queue.length} file{queue.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setQueue([])}
                  className="text-[11px] text-muted-foreground hover:text-red-600 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-44 overflow-y-auto">
                {queue.map(q => (
                  <div
                    key={q.id}
                    className={`flex items-center gap-2 px-3 py-2 border-b border-border last:border-0
                      ${q.valid ? 'bg-white' : 'bg-red-50'}`}
                  >
                    {/* Icon */}
                    <div className={`shrink-0 w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white
                      ${q.valid ? 'bg-primary' : 'bg-red-500'}`}
                    >
                      {q.file.name.split('.').pop()?.toUpperCase().slice(0, 3)}
                    </div>
                    {/* Name + size */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground truncate" title={q.file.name}>{q.file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(q.file.size)}</p>
                    </div>
                    {/* Status badge */}
                    {!q.valid && (
                      <span className="text-[10px] text-red-600 font-semibold bg-red-100 px-1.5 py-0.5 rounded shrink-0">
                        Invalid type
                      </span>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(q.id)}
                      className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#E5E5E5] text-muted-foreground transition-colors shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button onClick={handleClose} className="h-8 px-5 rounded border border-border text-[12px] font-normal text-foreground hover:bg-[#E5E5E5] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={validFiles.length === 0 || mutation.isPending}
              className="h-8 px-5 rounded bg-primary text-white text-[12px] font-normal hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {mutation.isPending
                ? <>Uploading…</>
                : <>
                    <Upload className="h-3.5 w-3.5" />
                    Upload {validFiles.length > 0 ? `${validFiles.length} file${validFiles.length !== 1 ? 's' : ''}` : ''}
                  </>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Skeleton loader ---
const SkeletonCard = () => (
  <div className="flex flex-col items-center p-4 rounded-xl border border-border bg-card animate-pulse">
    <div className="mb-3 h-14 w-14 rounded-2xl bg-muted" />
    <div className="h-3 w-20 rounded bg-muted mb-1.5" />
    <div className="h-2.5 w-12 rounded bg-muted" />
  </div>
);

// --- Main Component ---
const MainContent = ({ currentFolderId = null, onFolderOpen, view, activeTab = 'home' }: MainContentProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mdPreviewOpen, setMdPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ _id: string; name: string; filename: string } | null>(null);
  const qc = useQueryClient();

  const handleOpenFile = (file: any) => {
    if (file.name.toLowerCase().endsWith('.md')) {
      setPreviewFile(file);
      setMdPreviewOpen(true);
    } else {
      window.open(`http://localhost:5000/uploads/${file.filename}`);
    }
  };

  // Reset selection when changing folders or tabs
  useEffect(() => {
    setSelectedId(null);
  }, [currentFolderId, activeTab]);

  const { data: folders = [], isLoading: fl } = useQuery({
    queryKey: ['folders', currentFolderId, activeTab],
    queryFn: () => fetchFolders(currentFolderId, activeTab),
  });

  const { data: files = [], isLoading: fil } = useQuery({
    queryKey: ['files', currentFolderId, activeTab],
    queryFn: () => fetchFiles(currentFolderId, activeTab),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
    }
  });

  const [renameItem, setRenameItem] = useState<{ _id: string; name: string; type: 'folder' | 'file' } | null>(null);

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameFolder(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setRenameItem(null);
    }
  });

  const renameFileMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameFile(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
      setRenameItem(null);
    }
  });

  const [shareItemTarget, setShareItemTarget] = useState<{ _id: string; name: string; type: 'folder' | 'file'; isShared?: boolean; shareId?: string | null; shareExpiresAt?: string | null } | null>(null);

  const shareItemMutation = useMutation({
    mutationFn: ({ id, type, expiresInHours }: { id: string; type: 'folder' | 'file'; expiresInHours?: number }) => shareItem(id, type, expiresInHours),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['files'] });
      setShareItemTarget((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isShared: data.isShared,
          shareId: data.shareId,
          shareExpiresAt: data.shareExpiresAt
        };
      });
    }
  });

  const unshareItemMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'folder' | 'file' }) => unshareItem(id, type),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['files'] });
      setShareItemTarget((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isShared: data.isShared,
          shareId: data.shareId,
          shareExpiresAt: data.shareExpiresAt
        };
      });
    }
  });

  const selectedItem =
    folders.find((f: any) => f._id === selectedId) ||
    files.find((f: any) => f._id === selectedId);

  const isLoading = fl || fil;
  const totalItems = folders.length + files.length;
  const isSelectedFolder = folders.some((f: any) => f._id === selectedId);
  const selectedType = selectedId ? (isSelectedFolder ? 'folder' : 'file') : undefined;
  const selectedSize = !isSelectedFolder && selectedItem ? selectedItem.size : undefined;

  return (
    <>
      <NewFolderModal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} parentId={currentFolderId} />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} folderId={currentFolderId} />

      <div className="flex flex-1 flex-col overflow-hidden h-full w-full">
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-background">
            {isLoading ? (
              <div className={`p-5 grid gap-3 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1'}`}>
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : totalItems === 0 ? (
              /* Empty state */
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 animate-fade-in">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/60 border border-border">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-foreground mb-1">No files here yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">Upload files or create folders to organize your documents.</p>
                </div>
                {activeTab === 'home' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setNewFolderOpen(true)}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-soft"
                    >
                      <FolderPlus className="h-4 w-4" /> New Folder
                    </button>
                    <button
                      onClick={() => setUploadOpen(true)}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all shadow-soft"
                    >
                      <Upload className="h-4 w-4" /> Upload File
                    </button>
                  </div>
                )}
              </div>
            ) : (
              view === 'grid' ? (
                <div className="p-5 animate-fade-in grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {folders.map((folder: any) => (
                    <FolderCard
                      key={folder._id}
                      folder={folder}
                      selected={selectedId === folder._id}
                      onSelect={() => setSelectedId(folder._id)}
                      onDoubleClick={() => onFolderOpen?.(folder._id, folder.name)}
                      onDelete={() => deleteFolderMutation.mutate(folder._id)}
                      onRename={() => setRenameItem({ _id: folder._id, name: folder.name, type: 'folder' })}
                      onShare={() => setShareItemTarget({ _id: folder._id, name: folder.name, type: 'folder', isShared: folder.isShared, shareId: folder.shareId, shareExpiresAt: folder.shareExpiresAt })}
                    />
                  ))}
                  {files.map((file: any) => (
                    <FileCard
                      key={file._id}
                      file={file}
                      selected={selectedId === file._id}
                      onSelect={() => setSelectedId(file._id)}
                      onDoubleClick={() => handleOpenFile(file)}
                      onDelete={() => deleteFileMutation.mutate(file._id)}
                      onRename={() => setRenameItem({ _id: file._id, name: file.name, type: 'file' })}
                      onShare={() => setShareItemTarget({ _id: file._id, name: file.name, type: 'file', isShared: file.isShared, shareId: file.shareId, shareExpiresAt: file.shareExpiresAt })}
                    />
                  ))}
                </div>
              ) : (
                <ListView
                  folders={folders}
                  files={files}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onFolderOpen={onFolderOpen}
                  onOpenFile={handleOpenFile}
                  onDeleteFolder={(id) => deleteFolderMutation.mutate(id)}
                  onDeleteFile={(id) => deleteFileMutation.mutate(id)}
                  onRenameFolder={(id) => {
                    const f = folders.find((fol: any) => fol._id === id);
                    if (f) setRenameItem({ _id: id, name: f.name, type: 'folder' });
                  }}
                  onRenameFile={(id) => {
                    const f = files.find((fil: any) => fil._id === id);
                    if (f) setRenameItem({ _id: id, name: f.name, type: 'file' });
                  }}
                  onShareFolder={(id) => {
                    const f = folders.find((fol: any) => fol._id === id);
                    if (f) setShareItemTarget({ _id: id, name: f.name, type: 'folder', isShared: f.isShared, shareId: f.shareId, shareExpiresAt: f.shareExpiresAt });
                  }}
                  onShareFile={(id) => {
                    const f = files.find((fil: any) => fil._id === id);
                    if (f) setShareItemTarget({ _id: id, name: f.name, type: 'file', isShared: f.isShared, shareId: f.shareId, shareExpiresAt: f.shareExpiresAt });
                  }}
                />
              )
            )}
          </main>

          {selectedItem && (
            <PreviewPanel
              item={selectedItem}
              onClose={() => setSelectedId(null)}
              onOpenFolder={onFolderOpen}
              onOpenFile={handleOpenFile}
            />
          )}
        </div>

        <StatusBar
          totalItems={totalItems}
          selectedCount={selectedId ? 1 : 0}
          selectedSize={selectedSize}
          selectedType={selectedType}
        />
      </div>

      {previewFile && (
        <MarkdownPreviewModal
          open={mdPreviewOpen}
          onClose={() => {
            setMdPreviewOpen(false);
            setPreviewFile(null);
          }}
          fileName={previewFile.name}
          fileId={previewFile._id}
          fileUrl={`http://localhost:5000/uploads/${previewFile.filename}`}
        />
      )}

      {renameItem && (
        <RenameModal
          open={!!renameItem}
          onClose={() => setRenameItem(null)}
          initialName={renameItem.name}
          type={renameItem.type}
          onRename={(newName) => {
            if (renameItem.type === 'folder') {
              renameFolderMutation.mutate({ id: renameItem._id, name: newName });
            } else {
              renameFileMutation.mutate({ id: renameItem._id, name: newName });
            }
          }}
          isPending={renameFolderMutation.isPending || renameFileMutation.isPending}
        />
      )}

      {shareItemTarget && (
        <ShareModal
          open={!!shareItemTarget}
          onClose={() => setShareItemTarget(null)}
          item={shareItemTarget}
          type={shareItemTarget.type}
          onShare={(expiresInHours) => {
            shareItemMutation.mutate({ id: shareItemTarget._id, type: shareItemTarget.type, expiresInHours });
          }}
          onUnshare={() => {
            unshareItemMutation.mutate({ id: shareItemTarget._id, type: shareItemTarget.type });
          }}
          isPending={shareItemMutation.isPending || unshareItemMutation.isPending}
        />
      )}
    </>
  );
};

export { MainContent as default, type MainContentProps };
export { NewFolderModal, UploadModal };
