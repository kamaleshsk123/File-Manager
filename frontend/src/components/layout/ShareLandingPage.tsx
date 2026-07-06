import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  fetchSharedItem,
  fetchSharedSubfolder,
  fetchSharedFile,
  API_URL,
  downloadFile
} from '../../api';
import {
  Download,
  Folder,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Film,
  Music,
  Image as ImageIcon,
  Share2,
  Calendar,
  Layers,
  ArrowLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { marked } from 'marked';
import { MarkdownPreviewModal } from '../MarkdownPreviewModal';

// Helper to determine icon configuration
const getFileConfig = (type: string, name: string) => {
  const t = type.toLowerCase();
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (t.startsWith('image/')) return { icon: <ImageIcon className="h-10 w-10" />, bg: 'bg-blue-500/10 border-blue-500/20', color: 'text-blue-500' };
  if (t.includes('pdf')) return { icon: <FileText className="h-10 w-10" />, bg: 'bg-red-500/10 border-red-500/20', color: 'text-red-500' };
  if (ext === 'md' || t.includes('markdown')) return { icon: <FileText className="h-10 w-10" />, bg: 'bg-teal-500/10 border-teal-500/20', color: 'text-teal-500' };
  if (t.includes('zip') || t.includes('tar') || t.includes('rar') || t.includes('gzip')) return { icon: <FileArchive className="h-10 w-10" />, bg: 'bg-orange-500/10 border-orange-500/20', color: 'text-orange-500' };
  if (t.startsWith('video/')) return { icon: <Film className="h-10 w-10" />, bg: 'bg-purple-500/10 border-purple-500/20', color: 'text-purple-500' };
  if (t.startsWith('audio/')) return { icon: <Music className="h-10 w-10" />, bg: 'bg-pink-500/10 border-pink-500/20', color: 'text-pink-500' };
  if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') return { icon: <FileSpreadsheet className="h-10 w-10" />, bg: 'bg-emerald-500/10 border-emerald-500/20', color: 'text-emerald-500' };
  if (['html', 'css', 'js', 'ts', 'json', 'py', 'java', 'go', 'sh'].includes(ext)) return { icon: <FileCode className="h-10 w-10" />, bg: 'bg-indigo-500/10 border-indigo-500/20', color: 'text-indigo-500' };

  return { icon: <FileText className="h-10 w-10" />, bg: 'bg-slate-500/10 border-slate-500/20', color: 'text-slate-500' };
};

const formatSize = (bytes?: number) => {
  if (bytes === undefined || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const ShareLandingPage = () => {
  const { type, shareId } = useParams<{ type: string; shareId: string }>();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mdPreviewOpen, setMdPreviewOpen] = useState(false);

  // Initial fetch of the shared item
  const { data, error, isLoading } = useQuery({
    queryKey: ['sharedItem', type, shareId],
    queryFn: () => fetchSharedItem(type || '', shareId || ''),
    enabled: !!type && !!shareId,
    retry: false
  });

  // Folder contents fetch (if currentFolderId changes, or initial folder load)
  const isFolder = type === 'folder';
  const activeFolderId = currentFolderId || (isFolder ? data?.folder?._id : null);

  const { data: folderContents, isLoading: isFolderContentsLoading } = useQuery({
    queryKey: ['sharedFolderContents', activeFolderId],
    queryFn: () => fetchSharedSubfolder(activeFolderId),
    enabled: isFolder && !!activeFolderId,
    retry: false
  });

  // Watch for initial load to set up current folder
  useEffect(() => {
    if (isFolder && data?.folder) {
      if (!currentFolderId) {
        setFolderPath([{ id: data.folder._id, name: data.folder.name }]);
      }
    }
  }, [data, isFolder]);

  // Handle clicking on a child folder in the shared folder list
  const handleFolderClick = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
    setPreviewFile(null);
  };

  // Handle clicking breadcrumb navigation
  const handleBreadcrumbClick = (idx: number) => {
    const target = folderPath[idx];
    setCurrentFolderId(idx === 0 ? null : target.id);
    setFolderPath(prev => prev.slice(0, idx + 1));
    setPreviewFile(null);
  };

  const handleFilePreview = async (file: any) => {
    setPreviewFile(file);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'md') {
      setPreviewLoading(true);
      try {
        const res = await fetch(`${API_URL}/files/download/${file._id}`);
        const text = await res.text();
        setPreviewContent(marked.parse(text) as string);
      } catch (err) {
        setPreviewContent('<p class="text-destructive">Failed to load preview.</p>');
      } finally {
        setPreviewLoading(false);
      }
    } else {
      setPreviewContent('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading shared content...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <Share2 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Link Unavailable</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          This share link might have expired, been disabled by the owner, or is invalid.
        </p>
        <Link to="/" className="mt-6 flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/95 transition-all">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to DocVault
        </Link>
      </div>
    );
  }

  // If the shared item is a File
  if (type === 'file') {
    const file = data;
    const cfg = getFileConfig(file.type, file.name);
    const isImage = file.type.startsWith('image/');
    const isMarkdown = file.name.endsWith('.md');

    return (
      <div className="min-h-screen w-screen bg-slate-900/10 dark:bg-slate-950/40 flex flex-col font-sans">
        
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground text-sm tracking-tight">DocVault Share</span>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 overflow-auto p-6 md:p-12 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
          
          <div className="w-full rounded-3xl border border-border bg-card shadow-card overflow-hidden flex flex-col md:flex-row">
            
            {/* Visual Container */}
            <div className="flex-1 p-8 flex flex-col items-center justify-center bg-muted/20 border-b md:border-b-0 md:border-r border-border min-h-[300px]">
              {isImage ? (
                <div className="relative max-h-[350px] w-full flex items-center justify-center rounded-2xl overflow-hidden border border-border bg-black/5">
                  <img
                    src={`${API_URL}/files/download/${file._id}`}
                    alt={file.name}
                    className="max-h-[320px] max-w-full object-contain hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className={`h-24 w-24 rounded-3xl border-2 ${cfg.bg} ${cfg.color} flex items-center justify-center shadow-lg mb-4`}>
                  {cfg.icon}
                </div>
              )}
            </div>

            {/* Info details */}
            <div className="w-full md:w-[400px] p-8 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wide uppercase mb-4">
                  Shared File
                </span>
                <h1 className="text-lg font-bold text-foreground leading-snug break-words mb-2">{file.name}</h1>
                <p className="text-xs text-muted-foreground font-medium mb-6">{formatSize(file.size)}</p>

                <div className="space-y-3.5 border-t border-border/80 pt-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Shared on</span>
                    <span className="font-semibold text-foreground">
                      {new Date(file.uploadedAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> File Type</span>
                    <span className="font-semibold text-foreground uppercase text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/40">
                      {file.name.split('.').pop() || 'FILE'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-2.5">
                {(isMarkdown || file.type.includes('pdf')) && (
                  <button
                    onClick={() => {
                        if (isMarkdown) {
                            setMdPreviewOpen(true);
                        } else {
                            window.open(`${API_URL}/files/download/${file._id}`);
                        }
                    }}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-muted transition-all shadow-soft"
                  >
                    <Eye className="h-4 w-4" /> Preview File
                  </button>
                )}
                <button
                  onClick={() => downloadFile(file._id, file.name).catch(() => alert('Download failed'))}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/95 transition-all shadow-soft"
                >
                  <Download className="h-4 w-4" /> Download File
                </button>
              </div>

            </div>

          </div>

          {/* Render Markdown Preview Modal */}
          {isMarkdown && file && (
            <MarkdownPreviewModal
              open={mdPreviewOpen}
              onClose={() => setMdPreviewOpen(false)}
              fileName={file.name}
              fileId={file._id}
              fileUrl={`${API_URL}/files/download/${file._id}`}
            />
          )}

        </main>
      </div>
    );
  }

  // If the shared item is a Folder
  const rootFolder = data.folder;
  const currentFolders = folderContents?.folders || [];
  const currentFiles = folderContents?.files || [];

  return (
    <div className="min-h-screen w-screen bg-slate-900/10 dark:bg-slate-950/40 flex flex-col font-sans">
      
      {/* Header */}
      <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-bold text-foreground text-sm tracking-tight">DocVault Share</span>
        </div>
        <button
          onClick={() => window.open(`${API_URL}/folders/download/${rootFolder._id}`)}
          className="h-8 px-4 flex items-center gap-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all shadow-soft"
        >
          <Download className="h-3.5 w-3.5" /> Download Folder
        </button>
      </header>

      {/* Main Folder Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Files Grid/List Panel */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 mb-5 flex-wrap">
            {folderPath.map((node, i) => (
              <React.Fragment key={node.id}>
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className={`text-xs font-semibold transition-colors hover:text-primary ${
                    i === folderPath.length - 1 ? 'text-foreground cursor-default hover:text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {node.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-auto rounded-2xl border border-border bg-card shadow-card">
            {isFolderContentsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : currentFolders.length === 0 && currentFiles.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <Folder className="h-12 w-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">This folder is empty</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/10 text-xs font-semibold text-muted-foreground select-none">
                    <th className="py-2.5 pl-4 pr-3">Name</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 pr-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  
                  {/* Folders */}
                  {currentFolders.map((f: any) => (
                    <tr
                      key={f._id}
                      onDoubleClick={() => handleFolderClick(f._id, f.name)}
                      className="border-b border-border hover:bg-muted/40 cursor-pointer select-none text-xs"
                    >
                      <td className="py-3 pl-4 pr-3 font-medium text-foreground flex items-center gap-2">
                        <Folder className="h-4 w-4 text-amber-500 shrink-0" fill="currentColor" fillOpacity={0.15} />
                        <span className="truncate max-w-xs">{f.name}</span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">—</td>
                      <td className="py-3 px-3 text-muted-foreground">Folder</td>
                      <td className="py-3 pr-4 text-right">
                        <button
                          onClick={() => handleFolderClick(f._id, f.name)}
                          className="h-7 px-2.5 rounded-lg border border-border hover:bg-muted font-medium text-[11px] transition-colors"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Files */}
                  {currentFiles.map((f: any) => {
                    const cfg = getFileConfig(f.type, f.name);
                    return (
                      <tr
                        key={f._id}
                        onClick={() => handleFilePreview(f)}
                        onDoubleClick={() => window.open(`${API_URL}/files/download/${f._id}`)}
                        className={`border-b border-border hover:bg-muted/40 cursor-pointer select-none text-xs ${
                          previewFile?._id === f._id ? 'bg-primary/5 hover:bg-primary/5' : ''
                        }`}
                      >
                        <td className="py-3 pl-4 pr-3 font-medium text-foreground flex items-center gap-2">
                          <span className={`${cfg.color} shrink-0`}>{cfg.icon}</span>
                          <span className="truncate max-w-xs">{f.name}</span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{formatSize(f.size)}</td>
                        <td className="py-3 px-3 text-muted-foreground uppercase text-[10px]">{f.name.split('.').pop() || 'FILE'}</td>
                        <td className="py-3 pr-4 text-right flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleFilePreview(f)}
                            className="h-7 px-2 rounded-lg border border-border hover:bg-muted text-[11px] font-medium text-foreground transition-colors flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> Preview
                          </button>
                          <button
                            onClick={() => downloadFile(f._id, f.name).catch(() => alert('Download failed'))}
                            className="h-7 px-2 rounded-lg bg-primary hover:bg-primary/95 text-[11px] font-semibold text-white transition-colors flex items-center justify-center"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Preview Side panel (if file selected) */}
        {previewFile && (
          <div className="w-[380px] border-l border-border bg-card flex flex-col shrink-0 overflow-hidden animate-slide-in">
            
            {/* Title / Close button */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">File Preview</span>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                Close
              </button>
            </div>

            {/* Info details */}
            <div className="p-5 flex-1 overflow-auto flex flex-col">
              
              <div className="flex flex-col items-center justify-center p-6 border border-border rounded-2xl bg-muted/10 mb-5">
                {previewFile.type.startsWith('image/') ? (
                  <img
                    src={`${API_URL}/files/download/${previewFile._id}`}
                    alt={previewFile.name}
                    className="max-h-[140px] rounded-lg object-contain"
                  />
                ) : (
                  <div className={`h-16 w-16 rounded-2xl border-2 ${getFileConfig(previewFile.type, previewFile.name).bg} ${getFileConfig(previewFile.type, previewFile.name).color} flex items-center justify-center shadow-soft`}>
                    {getFileConfig(previewFile.type, previewFile.name).icon}
                  </div>
                )}
                <h3 className="text-sm font-bold text-foreground text-center mt-3 truncate w-full" title={previewFile.name}>
                  {previewFile.name}
                </h3>
                <span className="text-[11px] text-muted-foreground mt-0.5">{formatSize(previewFile.size)}</span>
              </div>

              {/* Render Markdown Preview */}
              {previewFile.name.endsWith('.md') && (
                <div className="flex-1 flex flex-col border border-border rounded-xl p-4 bg-muted/20 overflow-hidden text-xs">
                  {previewLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-primary mx-auto" />
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto prose dark:prose-invert max-w-full" dangerouslySetInnerHTML={{ __html: previewContent }} />
                      <div className="pt-3 border-t border-border/50 mt-3 flex justify-center">
                        <button
                          onClick={() => setMdPreviewOpen(true)}
                          className="h-8 px-3 rounded-lg bg-card border border-border hover:bg-muted text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Eye className="h-3 w-3 text-primary" /> Open Full Viewer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* PDF Preview message */}
              {previewFile.type.includes('pdf') && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-xl bg-muted/20">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-medium text-foreground">PDF Preview</p>
                  <a
                    href={`${API_URL}/files/download/${previewFile._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Open PDF in new tab <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

            </div>

            <div className="p-4 border-t border-border bg-muted/10">
              <button
                onClick={() => downloadFile(previewFile._id, previewFile.name).catch(() => alert('Download failed'))}
                className="w-full h-10 rounded-xl bg-primary hover:bg-primary/95 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-soft"
              >
                <Download className="h-3.5 w-3.5" /> Download this File
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Render Markdown Preview Modal for Folder View */}
      {previewFile?.name?.endsWith('.md') && (
        <MarkdownPreviewModal
          open={mdPreviewOpen}
          onClose={() => setMdPreviewOpen(false)}
          fileName={previewFile.name}
          fileId={previewFile._id}
          fileUrl={`${API_URL}/files/download/${previewFile._id}`}
        />
      )}
    </div>
  );
};

export default ShareLandingPage;
