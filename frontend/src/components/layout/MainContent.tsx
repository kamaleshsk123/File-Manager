import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFolders, fetchFiles, createFolder, uploadFile, deleteFolder, deleteFile } from '../../api';
import { FolderCard } from '../FolderCard';
import { FileCard } from '../FileCard';
import { ListView } from '../ListView';
import { PreviewPanel } from '../PreviewPanel';
import { FolderPlus, Upload, FolderOpen } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-card p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FolderPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">New Folder</h2>
            <p className="text-xs text-muted-foreground">Enter a name for your folder</p>
          </div>
        </div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && mutation.mutate()}
          placeholder="Folder name"
          className="w-full h-10 rounded-lg border border-border bg-muted/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 shadow-soft"
          >
            {mutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Upload Modal ---
const UploadModal = ({ open, onClose, folderId }: { open: boolean; onClose: () => void; folderId?: string | null }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (file: File) => uploadFile(file, folderId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['files'] }); onClose(); }
  });

  const handleFiles = (files: FileList | null) => {
    if (files?.[0]) mutation.mutate(files[0]);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-card p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Upload File</h2>
            <p className="text-xs text-muted-foreground">Drop or click to choose a file</p>
          </div>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`upload-area flex flex-col items-center justify-center gap-2 rounded-xl p-8 cursor-pointer transition-all mb-4 ${dragging ? 'dragover' : ''}`}
        >
          <Upload className={`h-8 w-8 mb-1 transition-colors ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-sm font-medium text-foreground">Drop file here</p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
          <input ref={inputRef} type="file" className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
        </div>
        {mutation.isPending && (
          <p className="mt-3 text-center text-xs text-primary animate-pulse">Uploading...</p>
        )}
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

  const selectedItem =
    folders.find((f: any) => f._id === selectedId) ||
    files.find((f: any) => f._id === selectedId);

  const isLoading = fl || fil;
  const totalItems = folders.length + files.length;

  return (
    <>
      <NewFolderModal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} parentId={currentFolderId} />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} folderId={currentFolderId} />

      <div className="flex flex-1 overflow-hidden h-full w-full">
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
                  />
                ))}
                {files.map((file: any) => (
                  <FileCard
                    key={file._id}
                    file={file}
                    selected={selectedId === file._id}
                    onSelect={() => setSelectedId(file._id)}
                    onDoubleClick={() => window.open(`http://localhost:5000/uploads/${file.filename}`)}
                    onDelete={() => deleteFileMutation.mutate(file._id)}
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
                onDeleteFolder={(id) => deleteFolderMutation.mutate(id)}
                onDeleteFile={(id) => deleteFileMutation.mutate(id)}
              />
            )
          )}
        </main>

        {selectedItem && (
          <PreviewPanel
            item={selectedItem}
            onClose={() => setSelectedId(null)}
            onOpenFolder={onFolderOpen}
          />
        )}
      </div>
    </>
  );
};

export { MainContent as default, type MainContentProps };
export { NewFolderModal, UploadModal };
