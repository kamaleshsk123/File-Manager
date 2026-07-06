import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Calendar, Globe, Trash2 } from 'lucide-react';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  item: {
    _id: string;
    name: string;
    isShared?: boolean;
    shareId?: string | null;
    shareExpiresAt?: string | null;
  };
  type: 'folder' | 'file';
  onShare: (expiresInHours?: number) => void;
  onUnshare: () => void;
  isPending?: boolean;
}

const ShareModal = ({
  open,
  onClose,
  item,
  type,
  onShare,
  onUnshare,
  isPending = false
}: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [expiryOption, setExpiryOption] = useState('0'); // '0' = Never, '1' = 1h, '24' = 24h, '168' = 7d

  useEffect(() => {
    if (open) {
      setCopied(false);
      // Determine initial expiry option from item.shareExpiresAt if shared
      if (item.isShared && item.shareExpiresAt) {
        const diffMs = new Date(item.shareExpiresAt).getTime() - Date.now();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours <= 1.5) setExpiryOption('1');
        else if (diffHours <= 25) setExpiryOption('24');
        else if (diffHours <= 170) setExpiryOption('168');
        else setExpiryOption('0');
      } else {
        setExpiryOption('0');
      }
    }
  }, [open, item]);

  if (!open) return null;

  const shareUrl = item.shareId
    ? `${window.location.origin}/#/share/${type}/${item.shareId}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleExpiryChange = (val: string) => {
    setExpiryOption(val);
    const hours = parseInt(val, 10);
    onShare(hours > 0 ? hours : undefined);
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-card p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Share2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground truncate">Share "{item.name}"</h2>
            <p className="text-xs text-muted-foreground">Manage public link sharing settings</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          
          {/* Public Sharing Toggle Area */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Link Sharing</p>
                <p className="text-xs text-muted-foreground">Anyone with this link can view & download</p>
              </div>
            </div>
            
            {/* Toggle switch */}
            <button
              onClick={() => item.isShared ? onUnshare() : onShare(expiryOption !== '0' ? parseInt(expiryOption, 10) : undefined)}
              disabled={isPending}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                item.isShared ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  item.isShared ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Config options (Only show if shared) */}
          {item.isShared && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Share link input with copy button */}
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onClick={handleCopy}
                  className="flex-1 h-10 rounded-lg border border-border bg-muted/50 px-3 text-xs text-foreground cursor-pointer focus:outline-none transition-all"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all shadow-soft"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>

              {/* Expiration Configuration */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-muted/10">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Link Expiration</label>
                  <select
                    value={expiryOption}
                    onChange={e => handleExpiryChange(e.target.value)}
                    className="w-full h-8 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="0">Never Expires</option>
                    <option value="1">1 Hour</option>
                    <option value="24">1 Day</option>
                    <option value="168">7 Days</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  {item.shareExpiresAt ? (
                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-500/10 rounded-lg p-2 border border-amber-500/10">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <div className="text-[10px] leading-tight font-medium">
                        Expires on <br />
                        <span className="font-semibold text-foreground">{formatDate(item.shareExpiresAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/10">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <div className="text-[10px] leading-tight font-medium">
                        Link is permanent & public.
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-border">
          {item.isShared && (
            <button
              onClick={onUnshare}
              disabled={isPending}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-transparent text-xs text-destructive hover:bg-destructive/10 transition-colors mr-auto"
            >
              <Trash2 className="h-3.5 w-3.5" /> Stop Sharing
            </button>
          )}
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ShareModal;
