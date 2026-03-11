import React from 'react';
import {
  MessageSquarePlus,
  GitBranch,
  BookOpen,
  Trash2,
  MessageCircle,
  CheckCircle2,
  Circle,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  Edit2,
  Share2,
} from 'lucide-react';

export default function LeftPanel({
  conversations,
  activeConversationId,
  branches,
  activeBranchId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onShareConversation,
  onOpenBranch,
  onShowVault,
  showVault,
  isOpen,
  onToggle,
  editingId,
  setEditingId,
  draftTitle,
  setDraftTitle,
}) {
  const [menuOpenId, setMenuOpenId] = React.useState(null);

  const handleStartRename = (convo) => {
    setEditingId(convo.id);
    setDraftTitle(convo.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id) => {
    if (draftTitle.trim() && draftTitle !== conversations.find(c => c.id === id)?.title) {
      onRenameConversation(id, draftTitle.trim());
    } else {
      setEditingId(null);
    }
  };
  return (
    <div 
      className="h-full flex flex-col glass-strong border-r border-atonement-border/30 relative z-40 transition-all duration-300 ease-in-out"
    >
      {/* Header */}
      <div className="p-4 border-b border-atonement-border/30 overflow-hidden whitespace-nowrap">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-atonement-accent to-atonement-cyan flex items-center justify-center">
              <GitBranch size={16} className="text-white" />
            </div>
            <h1 className="text-lg font-bold gradient-text">Atonement</h1>
          </div>
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-atonement-card text-atonement-muted">
            <PanelLeftClose size={18} />
          </button>
        </div>
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-atonement-accent/10 hover:bg-atonement-accent/20 text-atonement-accent-light border border-atonement-accent/20 transition-all duration-200"
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
          </div>
        ) : (
          conversations.map((convo) => (
            <div
              key={convo.id}
              className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 mb-0.5 ${
                activeConversationId === convo.id
                  ? 'bg-atonement-accent/15 text-atonement-accent-light border-l-2 border-atonement-accent'
                  : 'hover:bg-atonement-card/60 text-atonement-text'
              }`}
              onClick={() => onSelectConversation(convo.id)}
            >
              <MessageCircle size={14} className="flex-shrink-0 opacity-60" />
              
              {editingId === convo.id ? (
                <input
                  autoFocus
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  onBlur={() => handleSaveRename(convo.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveRename(convo.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-sm truncate">{convo.title}</span>
              )}

              {/* Menu Button */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === convo.id ? null : convo.id);
                  }}
                  className={`p-1 rounded hover:bg-atonement-card transition-all ${activeConversationId === convo.id || menuOpenId === convo.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <MoreVertical size={14} />
                </button>

                {menuOpenId === convo.id && (
                  <div className="absolute right-0 top-8 w-36 glass-strong rounded-lg shadow-xl border border-atonement-border/30 py-1 z-50">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartRename(convo); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-atonement-accent/10 transition-colors"
                    >
                      <Edit2 size={12} /> Rename
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onShareConversation(convo.id); setMenuOpenId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-atonement-accent/10 transition-colors"
                    >
                      <Share2 size={12} /> Share
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteConversation(convo.id); setMenuOpenId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
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
