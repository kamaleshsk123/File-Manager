import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  path?: { id: string; name: string }[];
  onNavigate?: (id: string | null) => void;
}

const Breadcrumb = ({ path = [], onNavigate }: BreadcrumbProps) => {
  return (
    <div className="flex items-center gap-1 px-5 py-2 border-b border-border bg-[hsl(var(--toolbar-bg))] shrink-0">
      <button
        onClick={() => onNavigate?.(null)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Home className="h-3 w-3" />
        Home
      </button>

      {path.map((segment) => (
        <React.Fragment key={segment.id}>
          <ChevronRight className="h-3 w-3 text-border shrink-0" />
          <button
            onClick={() => onNavigate?.(segment.id)}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors truncate max-w-[160px]"
          >
            {segment.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;
