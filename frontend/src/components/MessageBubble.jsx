import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GitBranch, User, Bot, ClipboardList, CornerDownRight } from 'lucide-react';

export default function MessageBubble({ message, onCreateBranch, branchCount, isLast }) {
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [branchTitle, setBranchTitle] = useState('');
  const [selectionPopover, setSelectionPopover] = useState(null); // { x, y, text }
  const bubbleRef = useRef(null);
  const isUser = message.role === 'user';
  const isSummary = message.role === 'branch_summary';

  // ── Selection detection ─────────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    // Only on AI messages
    if (isUser || isSummary) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText || selectedText.length < 3) {
      setSelectionPopover(null);
      return;
    }

    // Make sure the selection is within THIS bubble
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!bubbleRef.current?.contains(range.commonAncestorContainer)) {
      setSelectionPopover(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const bubbleRect = bubbleRef.current.getBoundingClientRect();

    setSelectionPopover({
      // Position relative to the bubble so it follows scroll
      x: rect.left - bubbleRect.left + rect.width / 2,
      y: rect.top - bubbleRect.top - 8, // 8px above the selection
      text: selectedText,
    });
  }, [isUser, isSummary]);

  // Dismiss popover if user clicks elsewhere
  useEffect(() => {
    const dismiss = (e) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        setSelectionPopover(null);
      }
    };
    document.addEventListener('mousedown', dismiss);
    return () => document.removeEventListener('mousedown', dismiss);
  }, []);

  // ── Branch from selection ───────────────────────────────────────────────────
  const handleReplyToSelection = () => {
    if (!selectionPopover) return;
    const excerpt = selectionPopover.text;
    // Auto-title: first 40 chars of the selection
    const autoTitle = excerpt.length > 40 ? excerpt.slice(0, 40) + '…' : excerpt;
    onCreateBranch(message.id, autoTitle, excerpt);
    window.getSelection()?.removeAllRanges();
    setSelectionPopover(null);
  };

  // ── Manual branch (full message) ────────────────────────────────────────────
  const handleCreateBranch = () => {
    if (!branchTitle.trim()) return;
    onCreateBranch(message.id, branchTitle.trim(), message.content);
    setBranchTitle('');
    setShowBranchMenu(false);
  };

  // ── Branch summary style ────────────────────────────────────────────────────
  if (isSummary) {
    return (
      <div className="msg-enter my-3">
        <div className="branch-marker ml-4 pl-4">
          <div className="glass rounded-xl px-4 py-3 border-l-2 border-atonement-success/50">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={14} className="text-atonement-success" />
              <span className="text-xs font-semibold text-atonement-success uppercase tracking-wide">
                Branch Summary
              </span>
            </div>
            <div className="text-sm text-atonement-text/90 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`msg-enter group flex gap-3 my-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-atonement-accent to-atonement-cyan flex items-center justify-center flex-shrink-0 mt-1">
          <Bot size={14} className="text-white" />
        </div>
      )}

      <div className={`max-w-[70%] relative ${isUser ? 'order-first' : ''}`} ref={bubbleRef}>
        {/* Message bubble */}
        <div
          onMouseUp={handleMouseUp}
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap select-text ${
            isUser
              ? 'bg-atonement-accent/20 text-atonement-text border border-atonement-accent/20 rounded-br-md'
              : 'glass text-atonement-text rounded-bl-md'
          }`}
        >
          {message.content}
        </div>

        {/* ── Floating selection popover ── */}
        {selectionPopover && (
          <div
            className="absolute z-50 animate-fade-in"
            style={{
              left: `${selectionPopover.x}px`,
              top: `${selectionPopover.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <button
              onMouseDown={(e) => e.preventDefault()} // keep selection alive
              onClick={handleReplyToSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-atonement-accent text-white text-xs font-semibold shadow-xl hover:bg-atonement-accent/85 active:scale-95 transition-all whitespace-nowrap"
            >
              <CornerDownRight size={11} />
              Reply to selection
            </button>
            {/* little caret */}
            <div className="w-2 h-2 bg-atonement-accent rotate-45 mx-auto -mt-1 rounded-sm" />
          </div>
        )}

        {/* Branch indicator + manual branch action */}
        <div className="flex items-center gap-2 mt-1.5 px-1">
          <span className="text-[10px] text-atonement-muted/50">
            {message.created_at 
              ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {branchCount > 0 && (
            <span className="text-[10px] text-atonement-cyan flex items-center gap-0.5">
              <GitBranch size={10} /> {branchCount}
            </span>
          )}

          <button
            onClick={() => setShowBranchMenu(!showBranchMenu)}
            className="opacity-0 group-hover:opacity-100 text-[10px] text-atonement-muted hover:text-atonement-cyan flex items-center gap-0.5 transition-all"
          >
            <GitBranch size={10} />
            Branch
          </button>
        </div>

        {/* Manual branch creation popover (full message) */}
        {showBranchMenu && (
          <div className="absolute top-full left-0 mt-2 glass-strong rounded-xl p-3 z-50 w-72 shadow-2xl animate-fade-in">
            <div className="text-xs font-semibold text-atonement-muted mb-2 uppercase tracking-wide">
              Create Rough Sheet
            </div>
            <input
              type="text"
              value={branchTitle}
              onChange={(e) => setBranchTitle(e.target.value)}
              placeholder="e.g., Explain this logic..."
              className="w-full px-3 py-2 rounded-lg bg-atonement-bg border border-atonement-border/40 text-atonement-text text-sm placeholder-atonement-muted/50 focus:outline-none focus:border-atonement-accent/50 mb-2"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateBranch}
                disabled={!branchTitle.trim()}
                className="flex-1 px-3 py-1.5 rounded-lg bg-atonement-accent text-white text-xs font-medium hover:bg-atonement-accent/80 disabled:opacity-30 transition-all"
              >
                Create Branch
              </button>
              <button
                onClick={() => { setShowBranchMenu(false); setBranchTitle(''); }}
                className="px-3 py-1.5 rounded-lg bg-atonement-card text-atonement-muted text-xs hover:bg-atonement-card/60 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-atonement-card border border-atonement-border/40 flex items-center justify-center flex-shrink-0 mt-1">
          <User size={14} className="text-atonement-muted" />
        </div>
      )}
    </div>
  );
}
