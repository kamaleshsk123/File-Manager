import React from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronRight as Sep, RotateCcw } from 'lucide-react';

interface BreadcrumbProps {
  path?: { id: string; name: string }[];
  onNavigate?: (id: string | null) => void;
}

const Breadcrumb = ({ path = [], onNavigate }: BreadcrumbProps) => {
  const canGoBack = path.length > 0;
  const canGoUp = path.length > 0;
  // "Back" goes to parent (second-to-last)
  const handleBack = () => {
    if (path.length === 1) {
      onNavigate?.(null);
    } else if (path.length > 1) {
      onNavigate?.(path[path.length - 2].id);
    }
  };
  // "Up" goes to root or parent
  const handleUp = () => {
    if (path.length <= 1) {
      onNavigate?.(null);
    } else {
      onNavigate?.(path[path.length - 2].id);
    }
  };

  return (
    <div className="flex items-center h-9 border-b border-border bg-white px-2 gap-0.5 shrink-0">
      {/* Navigation arrows */}
      <button
        onClick={handleBack}
        disabled={!canGoBack}
        title="Back"
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#E5E5E5] text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        disabled
        title="Forward"
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#E5E5E5] text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        onClick={handleUp}
        disabled={!canGoUp}
        title="Up"
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#E5E5E5] text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
      </button>

      {/* Path bar */}
      <div className="flex-1 flex items-center h-7 mx-1 px-2 rounded border border-border bg-white hover:border-primary/40 transition-colors overflow-hidden">
        {/* Home segment */}
        <button
          onClick={() => onNavigate?.(null)}
          className="flex items-center gap-1 text-[12px] text-foreground hover:text-primary transition-colors shrink-0 py-0.5 px-1 rounded hover:bg-[#E5F3FF]"
        >
          {/* small folder icon */}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M2 5H14V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V5Z" fill="#FFC83D"/>
            <path d="M1 4C1 3.44772 1.44772 3 2 3H6.17157C6.43678 3 6.69114 3.10536 6.87868 3.29289L7.62132 4.03553C7.80886 4.22307 8.06322 4.32843 8.32843 4.32843H13C13.5523 4.32843 14 4.77614 14 5.32843V5H2V4Z" fill="#FFB900"/>
          </svg>
          <span>This PC</span>
        </button>

        {path.map((segment, i) => (
          <React.Fragment key={segment.id}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-0.5 shrink-0" strokeWidth={1.5} />
            <button
              onClick={() => onNavigate?.(segment.id)}
              className={`text-[12px] transition-colors shrink-0 py-0.5 px-1 rounded hover:bg-[#E5F3FF]
                ${i === path.length - 1
                  ? 'text-foreground font-semibold hover:text-primary'
                  : 'text-foreground hover:text-primary'
                }`}
            >
              {segment.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Refresh button */}
      <button
        title="Refresh"
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#E5E5E5] text-foreground transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default Breadcrumb;
