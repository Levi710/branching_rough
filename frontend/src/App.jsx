import React, { useState, useEffect, useCallback } from 'react';
import LeftPanel from './components/LeftPanel';
import MainChat from './components/MainChat';
import BranchPanel from './components/BranchPanel';
import ReferenceVault from './components/ReferenceVault';
import AboutModal from './components/AboutModal';
import Toast from './components/Toast';
import * as api from './api';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeBranch, setActiveBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [referenceNotes, setReferenceNotes] = useState([]);
  const [showVault, setShowVault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [isSharedMode, setIsSharedMode] = useState(false);

  // Load conversations or shared link on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/shared/')) {
      const parts = path.split('/shared/');
      const token = parts[1]?.split('/')[0];
      if (token) {
        loadSharedConversation(token);
        return;
      }
    }
    loadConversations();
  }, []);

  const loadSharedConversation = async (token) => {
    try {
      setLoading(true);
      setIsSharedMode(true);
      const convo = await api.getSharedConversation(token);
      setActiveConversation(convo);
      setBranches(convo.branches || []);
      // Auto-close sidebar on mobile for shared links
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to load shared conversation:', err);
      setToast({ visible: true, message: 'This shared link is invalid or expired.' });
      setIsSharedMode(false);
      loadConversations();
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const convos = await api.listConversations();
      setConversations(convos);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setToast({ visible: true, message: 'Connection lost. Please try again.' });
    }
  };

  const loadConversation = useCallback(async (id) => {
    try {
      setLoading(true);
      const convo = await api.getConversation(id);
      setActiveConversation(convo);
      setBranches(convo.branches || []);
      setActiveBranch(null);
      setShowVault(false);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setToast({ visible: true, message: 'Failed to load conversation history.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNewConversation = () => {
    // Lazy creation: Just reset UI to empty state instead of calling backend immediately
    setActiveConversation({ id: null, title: 'New Conversation', messages: [] });
    setBranches([]);
    setActiveBranch(null);
    setShowVault(false);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setActiveBranch(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setToast({ visible: true, message: 'Could not delete conversation.' });
    }
  };

  const handleRenameConversation = async (id, newTitle) => {
    try {
      const updated = await api.updateConversation(id, { title: newTitle });
      setConversations(prev => prev.map(c => c.id === id ? updated : c));
      if (activeConversation?.id === id) {
        setActiveConversation(prev => ({ ...prev, title: updated.title }));
      }
      setEditingId(null);
    } catch (err) {
      console.error('Failed to rename conversation:', err);
      setToast({ visible: true, message: 'Rename failed.' });
    }
  };

  const handleShareConversation = async (id) => {
    try {
      const { shareToken } = await api.shareConversation(id);
      const shareUrl = `${window.location.origin}/shared/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      setToast({ visible: true, message: 'Share link copied to clipboard!' });
    } catch (err) {
      console.error('Failed to share conversation:', err);
      setToast({ visible: true, message: 'Share link creation failed.' });
    }
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  
  const handleChatAreaClick = () => {
    if (window.innerWidth < 768 && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!activeConversation) return;
    
    let conversationId = activeConversation.id;
    let isFirstMessage = false;

    try {
      setLoading(true);

      // 1. Optimistic Update (Immediate UI response before DB)
      setActiveConversation(prev => ({
        ...prev,
        messages: [...(prev.messages || []), {
          id: 'temp-' + Date.now(),
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }],
      }));

      // 2. Lazy Create Conversation if this is the very first message!
      if (!conversationId) {
        const newConvo = await api.createConversation({ title: 'New Conversation' });
        conversationId = newConvo.id;
        
        setActiveConversation(prev => ({ ...prev, id: conversationId }));
        setConversations(prev => [newConvo, ...prev]); // Add to sidebar
        isFirstMessage = true;
      }

      // 3. Send the message payload
      const result = await api.sendMessage(conversationId, content);
      
      // 4. Update UI with AI response and replace temporary user message ID
      setActiveConversation(prev => ({
        ...prev,
        messages: [
          ...(prev.messages || []).filter(m => (m.id?.toString() || '').startsWith('temp-') === false),
          result.userMessage,
          result.aiMessage,
        ],
      }));

      // 5. If it was the first message, poll the backend briefly to get the async LLM title
      if (isFirstMessage) {
        pollForTitleUpdate(conversationId);
      }
    } catch (err) {
      setToast({ visible: true, message: 'Failed to send message.' });
      // Remove temp message on error
      setActiveConversation(prev => ({
        ...prev,
        messages: (prev.messages || []).filter(m => (m.id?.toString() || '').startsWith('temp-') === false),
      }));
    } finally {
      setLoading(false);
    }
  };

  // Polls backend a few times to get the updated title right after creation
  const pollForTitleUpdate = (convoId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const convo = await api.getConversation(convoId);
        if (convo && convo.title !== 'New Conversation') {
          // Success: title was generated in background
          clearInterval(interval);
          setConversations(prev => prev.map(c => c.id === convo.id ? convo : c));
          setActiveConversation(prev => prev?.id === convo.id ? { ...prev, title: convo.title } : prev);
        } else if (attempts >= 10) {
          // Stop polling after 20 seconds
          clearInterval(interval);
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleCreateBranch = (anchorMessageId, title, anchorText) => {
    // Special case for "About" button
    if (anchorMessageId === 'about') {
      setShowAbout(true);
      return;
    }

    // Lazy creation: Set a pending branch state without calling the backend
    setShowVault(false);
    const pendingBranch = { 
      id: 'pending-' + Date.now(), 
      anchor_message_id: anchorMessageId,
      title: title || 'Rough Sheet', 
      status: 'active',
      messages: [],
      anchor_text: anchorText,
      isPending: true // Flag to identify unsaved branches
    };
    setActiveBranch(pendingBranch);
  };

  const handleOpenBranch = async (branchId) => {
    try {
      const branch = await api.getBranch(branchId);
      setActiveBranch(branch);
      setShowVault(false);
    } catch (err) {
      console.error('Failed to open branch:', err);
      setToast({ visible: true, message: 'Failed to load branch.' });
    }
  };

  const handleSendBranchMessage = async (content) => {
    if (!activeBranch) return;
    
    let currentBranchId = activeBranch.id;
    let isNewBranch = activeBranch.isPending;

    try {
      setLoading(true);

      // 1. If branch is pending, create it now
      if (isNewBranch) {
        const newBranch = await api.createBranch({
          anchor_message_id: activeBranch.anchor_message_id,
          title: activeBranch.title,
          anchor_text: activeBranch.anchor_text,
        });
        currentBranchId = newBranch.id;
        setBranches(prev => [newBranch, ...prev]);
        // Update local active branch state to switch from pending to real ID
        setActiveBranch(prev => ({ 
          ...prev, 
          id: currentBranchId, 
          isPending: false 
        }));
      }

      // 2. Optimistic update for UI
      setActiveBranch(prev => ({
        ...prev,
        messages: [...(prev.messages || []), {
          id: 'temp-' + Date.now(),
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }],
      }));

      // 3. Send message to backend
      const result = await api.sendBranchMessage(currentBranchId, content);
      
      setActiveBranch(prev => ({
        ...prev,
        messages: [
          ...(prev.messages || []).filter(m => (m.id?.toString() || '').startsWith('temp-') === false),
          result.userMessage,
          result.aiMessage,
        ],
      }));
    } catch (err) {
      console.error('Failed to send branch message:', err);
      setToast({ visible: true, message: 'Failed to send message.' });
    } finally {
      setLoading(false);
    }
  };


  const handleResolveBranch = async () => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      const result = await api.resolveBranch(activeBranch.id);
      
      // Update branch status locally
      setActiveBranch(prev => ({ ...prev, status: 'resolved' }));
      setBranches(prev =>
        prev.map(b => b.id === activeBranch.id ? { ...b, status: 'resolved' } : b)
      );
    } catch (err) {
      console.error('Failed to resolve branch:', err);
      setToast({ visible: true, message: 'Failed to resolve branch.' });
    } finally {
      setLoading(false);
    }
  };

  const handleShowVault = async () => {
    try {
      const notes = activeConversation
        ? await api.listConversationReferenceNotes(activeConversation.id)
        : await api.listReferenceNotes();
      setReferenceNotes(notes);
      setShowVault(true);
      setActiveBranch(null);
    } catch (err) {
      console.error('Failed to load reference notes:', err);
      setToast({ visible: true, message: 'Vault is currently unavailable.' });
    }
  };

  return (
    <div className={`flex h-screen w-screen bg-atonement-bg overflow-hidden relative ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Background gradient effects - Simplified for performance */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-atonement-accent/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-atonement-cyan/20 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <div className="sidebar-overlay" onClick={handleChatAreaClick} />

      {/* Left Panel */}
      <div className="sidebar-container h-full">
        <LeftPanel
          conversations={isSharedMode ? [] : conversations}
          activeConversationId={activeConversation?.id}
          branches={branches}
          activeBranchId={activeBranch?.id}
          onNewConversation={isSharedMode ? () => window.location.href = '/' : handleNewConversation}
          onSelectConversation={loadConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onShareConversation={handleShareConversation}
          onOpenBranch={handleOpenBranch}
          onShowVault={handleShowVault}
          onShowAbout={() => setShowAbout(true)}
          showVault={showVault}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          editingId={editingId}
          setEditingId={setEditingId}
          draftTitle={draftTitle}
          setDraftTitle={setDraftTitle}
        />
      </div>

      {/* Center Panel - Main Chat */}
      <div className="flex-1 flex flex-col min-w-0" onClick={handleChatAreaClick}>
        <MainChat
          conversation={activeConversation}
          onSendMessage={handleSendMessage}
          onCreateBranch={handleCreateBranch}
          loading={loading}
          branches={branches}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
      </div>

      {/* Right Panel - Branch or Vault */}
      {(activeBranch || showVault) && (
        <div className="w-full md:w-[420px] flex-shrink-0 animate-slide-in-right md:relative branch-panel-mobile md:block h-full overflow-hidden border-l border-atonement-border/20 z-[60] md:z-10">
          {showVault ? (
            <ReferenceVault
              notes={referenceNotes}
              onClose={() => setShowVault(false)}
              onOpenBranch={handleOpenBranch}
            />
          ) : (
            <BranchPanel
              branch={activeBranch}
              onSendMessage={handleSendBranchMessage}
              onResolve={handleResolveBranch}
              onClose={() => setActiveBranch(null)}
              loading={loading}
            />
          )}
        </div>
      )}
      {/* Modals & Notifications */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
}
