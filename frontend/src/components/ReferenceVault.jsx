import React, { useState } from 'react';
import { X, BookOpen, Search, Tag, ExternalLink, GitBranch } from 'lucide-react';

export default function ReferenceVault({ notes, onClose, onOpenBranch }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase();
    return (
      note.title?.toLowerCase().includes(query) ||
      note.branch_title?.toLowerCase().includes(query) ||
      note.summary?.toLowerCase().includes(query) ||
      (note.tags || []).some((t) => t.toLowerCase().includes(query))
    );
  });

  return (
    <div className="h-full flex flex-col glass-strong border-l border-atonement-border/30 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-atonement-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-atonement-border/20">
              <img src="/assets/penguin.png" alt="Icon" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-sm font-semibold text-atonement-text">Reference Vault</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-atonement-card text-atonement-muted hover:text-atonement-text transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-atonement-muted/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search references..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-atonement-bg border border-atonement-border/30 text-atonement-text text-xs placeholder-atonement-muted/50 focus:outline-none focus:border-atonement-accent/50 transition-all"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <img src="/assets/penguin.png" className="w-8 h-8 opacity-20 filter grayscale" alt="" />
            <p className="text-xs text-atonement-muted/50">
              {searchQuery
                ? 'No references match your search.'
                : 'No resolved branches yet. Resolve a branch to add a reference.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="glass rounded-xl p-3 hover:border-atonement-accent/30 transition-all cursor-pointer group"
              onClick={() => onOpenBranch(note.branch_id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <img src="/assets/penguin.png" className="w-3.5 h-3.5 rounded-sm object-cover" alt="" />
                  <h4 className="text-xs font-semibold text-atonement-text">
                    {note.branch_title || note.title}
                  </h4>
                </div>
                <ExternalLink
                  size={12}
                  className="text-atonement-muted/30 group-hover:text-atonement-accent transition-colors flex-shrink-0"
                />
              </div>

              <p className="text-[11px] text-atonement-muted leading-relaxed mb-2 line-clamp-3">
                {note.summary}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(note.tags || []).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-atonement-accent/10 text-atonement-accent-light text-[10px]"
                  >
                    <Tag size={8} />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-2 text-[10px] text-atonement-muted/40">
                {new Date(note.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2.5 border-t border-atonement-border/30 text-center">
        <span className="text-[10px] text-atonement-muted/50">
          {notes.length} reference{notes.length !== 1 ? 's' : ''} stored
        </span>
      </div>
    </div>
  );
}
