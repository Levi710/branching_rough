import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle, GitBranch, Anchor, Bot, User } from 'lucide-react';

export default function BranchPanel({ branch, onSendMessage, onResolve, onClose, loading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [branch?.messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  if (!branch) return null;

  const messages = branch.messages || [];
  const isResolved = branch.status === 'resolved';
  const isCreationLoading = branch.status === 'loading';

  return (
    <div className="h-full flex flex-col glass-strong border-l border-atonement-border/30 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-atonement-border/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-atonement-cyan to-atonement-accent flex items-center justify-center">
              <GitBranch size={13} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-atonement-text truncate max-w-[240px]">
                {branch.title}
              </h3>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${
                isResolved ? 'text-atonement-success' : 'text-atonement-warning'
              }`}>
                {isResolved ? '● Resolved' : '● Active'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-atonement-card text-atonement-muted hover:text-atonement-text transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Anchor Info */}
        {branch.anchorMessage && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-atonement-bg/50 border border-atonement-border/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Anchor size={10} className="text-atonement-cyan" />
              <span className="text-[10px] text-atonement-cyan font-medium uppercase tracking-wide">
                Anchor
              </span>
            </div>
            <p className="text-xs text-atonement-muted line-clamp-2">
              {branch.anchor_text || branch.anchorMessage.content}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isCreationLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
             <Loader2 size={24} className="text-atonement-cyan animate-spin" />
             <p className="text-xs text-atonement-muted">Creating rough sheet...</p>
          </div>
        ) : messages.length === 0 && !isResolved ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <GitBranch size={24} className="text-atonement-muted/30" />
            <p className="text-xs text-atonement-muted/60">
              Start exploring this topic in isolation.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`msg-enter flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-atonement-cyan to-atonement-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={11} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-atonement-cyan/15 text-atonement-text border border-atonement-cyan/20 rounded-br-sm'
                    : 'bg-atonement-card/60 text-atonement-text border border-atonement-border/20 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-atonement-card border border-atonement-border/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={11} className="text-atonement-muted" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-atonement-cyan typing-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-atonement-cyan typing-dot" />
              <div className="w-1.5 h-1.5 rounded-full bg-atonement-cyan typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-atonement-border/30 space-y-2">
        {/* Resolve button */}
        {!isResolved && messages.length > 0 && (
          <button
            onClick={onResolve}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-atonement-success/15 hover:bg-atonement-success/25 text-atonement-success border border-atonement-success/30 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <CheckCircle size={14} />
            Resolve & Summarize
          </button>
        )}

        {isResolved ? (
          <div className="text-center py-2 text-xs text-atonement-success/70">
            ✓ This branch has been resolved
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Explore in this branch..."
              disabled={loading}
              className="w-full px-4 py-2.5 pr-11 rounded-xl bg-atonement-bg border border-atonement-border/30 text-atonement-text text-xs placeholder-atonement-muted/50 focus:outline-none focus:border-atonement-cyan/50 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-atonement-cyan hover:bg-atonement-cyan/80 text-white transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
