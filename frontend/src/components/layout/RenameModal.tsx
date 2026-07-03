import React, { useState, useEffect } from 'react';
import { PenLine } from 'lucide-react';

interface RenameModalProps {
  open: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  initialName: string;
  type: 'folder' | 'file';
  isPending?: boolean;
}

const RenameModal = ({
  open,
  onClose,
  onRename,
  initialName,
  type,
  isPending = false
}: RenameModalProps) => {
  const [name, setName] = useState('');

  // Set the input field to initialName when modal opens
  useEffect(() => {
    if (open) {
      setName(initialName);
    }
  }, [open, initialName]);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== initialName) {
      onRename(trimmed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-card p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <PenLine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Rename {type === 'folder' ? 'Folder' : 'File'}</h2>
            <p className="text-xs text-muted-foreground">Enter a new name for this {type}</p>
          </div>
        </div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && handleSubmit()}
          placeholder={`${type === 'folder' ? 'Folder' : 'File'} name`}
          className="w-full h-10 rounded-lg border border-border bg-muted/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || name.trim() === initialName || isPending}
            className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 shadow-soft"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;
