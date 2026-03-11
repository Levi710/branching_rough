import React from 'react';
import {
  MessageSquarePlus,
  GitBranch,
  BookOpen,
  Trash2,
  MessageCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react';

export default function LeftPanel({
  conversations,
  activeConversationId,
  branches,
  activeBranchId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onOpenBranch,
  onShowVault,
  showVault,
}) {
  return (
    <div className="w-[280px] flex-shrink-0 h-full flex flex-col glass-strong border-r border-atonement-border/30 relative z-10">
      {/* Header */}
      <div className="p-4 border-b border-atonement-border/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-atonement-accent to-atonement-cyan flex items-center justify-center">
            <GitBranch size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-bold gradient-text">Atonement</h1>
        </div>
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-atonement-accent/20 hover:bg-atonement-accent/30 text-atonement-accent-light border border-atonement-accent/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <MessageSquarePlus size={16} />
          <span className="text-sm font-medium">New Conversation</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="px-2 py-1.5 text-xs font-semibold text-atonement-muted uppercase tracking-wider">
          Conversations
        </div>
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-atonement-muted text-sm">
            No conversations yet.
            <br />
            Start one above!
          </div>
        ) : (
          conversations.map((convo) => (
            <div
              key={convo.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 mb-0.5 ${
                activeConversationId === convo.id
                  ? 'bg-atonement-accent/15 text-atonement-accent-light border-l-2 border-atonement-accent'
                  : 'hover:bg-atonement-card/60 text-atonement-text'
              }`}
              onClick={() => onSelectConversation(convo.id)}
            >
              <MessageCircle size={14} className="flex-shrink-0 opacity-60" />
              <span className="flex-1 text-sm truncate">{convo.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(convo.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Branches Section */}
      {branches.length > 0 && (
        <div className="border-t border-atonement-border/30 p-2 max-h-[30%] overflow-y-auto">
          <div className="px-2 py-1.5 text-xs font-semibold text-atonement-muted uppercase tracking-wider flex items-center gap-1.5">
            <GitBranch size={12} />
            Branches
          </div>
          {branches.map((branch) => (
            <div
              key={branch.id}
              onClick={() => onOpenBranch(branch.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 mb-0.5 ${
                activeBranchId === branch.id
                  ? 'bg-atonement-cyan/15 text-atonement-cyan-light'
                  : 'hover:bg-atonement-card/60 text-atonement-text'
              }`}
            >
              {branch.status === 'resolved' ? (
                <CheckCircle2 size={14} className="text-atonement-success flex-shrink-0" />
              ) : (
                <Circle size={14} className="text-atonement-warning flex-shrink-0" />
              )}
              <span className="flex-1 text-sm truncate">{branch.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reference Vault Button */}
      <div className="p-3 border-t border-atonement-border/30">
        <button
          onClick={onShowVault}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
            showVault
              ? 'bg-atonement-cyan/20 text-atonement-cyan-light border border-atonement-cyan/30'
              : 'bg-atonement-card hover:bg-atonement-card/80 text-atonement-muted border border-atonement-border/30'
          }`}
        >
          <BookOpen size={16} />
          <span className="text-sm font-medium">Reference Vault</span>
        </button>
      </div>
    </div>
  );
}
