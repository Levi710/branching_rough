import MessageBubble from './MessageBubble';
import { Send, Loader2, Target, PanelLeftOpen } from 'lucide-react';

  onCreateBranch,
  loading,
  branches,
  sidebarOpen,
  onToggleSidebar,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  // Get branch count for a specific message
  const getBranchesForMessage = (messageId) => {
    return branches.filter(b => b.anchor_message_id === messageId);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col relative z-10">
        {!sidebarOpen && (
          <button 
            onClick={onToggleSidebar}
            className="absolute top-4 left-4 p-2 rounded-lg glass border border-atonement-border/30 text-atonement-muted hover:text-atonement-accent transition-all z-50"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
        <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-atonement-accent to-atonement-cyan flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <Target size={36} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold gradient-text">Atonement</h2>
          <p className="text-atonement-muted text-lg max-w-md">
            Branch-based context management for AI conversations.
          </p>
          <p className="text-atonement-muted/70 text-sm max-w-sm">
            Create a conversation to begin. Branch off messages to explore ideas
            without polluting your main thread.
          </p>
        </div>
      </div>
    );
  }

  const messages = conversation.messages || [];

  return (
    <div className="flex-1 flex flex-col relative min-w-0">
      {/* Header */}
      <div className="glass-strong border-b border-atonement-border/30 px-6 py-3.5 flex items-center gap-3">
        {!sidebarOpen && (
          <button 
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-atonement-card text-atonement-muted transition-all"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
        <div className="w-2 h-2 rounded-full bg-atonement-success animate-pulse" />
        <h2 className="text-base font-semibold text-atonement-text truncate">
          {conversation.title}
        </h2>
        <span className="text-xs text-atonement-muted bg-atonement-card px-2 py-0.5 rounded-full">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-atonement-muted">
            <p className="text-sm">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onCreateBranch={onCreateBranch}
              branchCount={getBranchesForMessage(msg.id).length}
              isLast={i === messages.length - 1}
            />
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3 msg-enter">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-atonement-accent typing-dot" />
              <div className="w-2 h-2 rounded-full bg-atonement-accent typing-dot" />
              <div className="w-2 h-2 rounded-full bg-atonement-accent typing-dot" />
            </div>
            <span className="text-xs text-atonement-muted">AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-atonement-border/20">
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="w-full px-5 py-3.5 pr-14 rounded-2xl bg-atonement-card border border-atonement-border/40 text-atonement-text placeholder-atonement-muted/50 focus:outline-none focus:border-atonement-accent/50 focus:ring-1 focus:ring-atonement-accent/20 transition-all text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-atonement-accent hover:bg-atonement-accent/80 text-white transition-all duration-200 disabled:opacity-30 disabled:hover:bg-atonement-accent hover:scale-105 active:scale-95"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
