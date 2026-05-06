import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationControls({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="w-9 h-9 rounded-xl border border-border bg-secondary text-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary/70 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-inter text-xs text-muted-foreground px-2">
        Page {page} / {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className="w-9 h-9 rounded-xl border border-border bg-secondary text-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary/70 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
