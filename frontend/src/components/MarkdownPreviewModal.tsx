import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import { X, FileText, Download, Copy, Check } from 'lucide-react';

interface MarkdownPreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  fileId: string;
  fileUrl: string;
}

export const MarkdownPreviewModal = ({ open, onClose, fileName, fileId, fileUrl }: MarkdownPreviewModalProps) => {
  const [content, setContent] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !fileUrl) return;

    setLoading(true);
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load markdown file');
        return res.text();
      })
      .then((text) => {
        setContent(text);
        // marked.parse returns string or Promise<string>. In older/newer marked versions, it returns a string if synchronous.
        const html = marked.parse(text);
        if (typeof html === 'string') {
          setHtmlContent(html);
        } else {
          (html as Promise<string>).then(setHtmlContent);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setHtmlContent('<p class="text-destructive font-medium text-center">Failed to load content.</p>');
        setLoading(false);
      });
  }, [open, fileUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-3xl h-[85vh] rounded-2xl border border-border bg-card shadow-card flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100">
              <FileText className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground truncate max-w-md" title={fileName}>
                {fileName}
              </h2>
              <p className="text-[11px] text-muted-foreground">Markdown Preview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="h-8 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-all text-muted-foreground hover:text-foreground"
              title="Copy Markdown Source"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Raw
                </>
              )}
            </button>
            <button
              onClick={() => window.open(`http://localhost:5000/api/files/download/${fileId}`)}
              className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-soft"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-card">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">Loading preview...</p>
            </div>
          ) : (
            <article 
              className="markdown-content prose max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
