import React, { useState, useEffect, useCallback } from 'react';
import LeftPanel from './components/LeftPanel';
import MainChat from './components/MainChat';
import BranchPanel from './components/BranchPanel';
import ReferenceVault from './components/ReferenceVault';
import * as api from './api';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeBranch, setActiveBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [referenceNotes, setReferenceNotes] = useState([]);
  const [showVault, setShowVault] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const convos = await api.listConversations();
      setConversations(convos);
    } catch (err) {
      console.error('Failed to load conversations:', err);
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
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNewConversation = async () => {
    try {
      const convo = await api.createConversation({ title: 'New Conversation' });
      setConversations(prev => [convo, ...prev]);
      loadConversation(convo.id);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
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
    }
  };

  const handleSendMessage = async (content) => {
    if (!activeConversation) return;
    try {
      setLoading(true);
      // Optimistic update: add user message immediately
      setActiveConversation(prev => ({
        ...prev,
        messages: [...(prev.messages || []), {
          id: 'temp-' + Date.now(),
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }],
      }));

      const result = await api.sendMessage(activeConversation.id, content);
      
      // Replace temp message and add AI message
      setActiveConversation(prev => ({
        ...prev,
        messages: [
          ...(prev.messages || []).filter(m => !m.id.startsWith('temp-')),
          result.userMessage,
          result.aiMessage,
        ],
      }));
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove temp message on error
      setActiveConversation(prev => ({
        ...prev,
        messages: (prev.messages || []).filter(m => !m.id.startsWith('temp-')),
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (anchorMessageId, title, anchorText) => {
    try {
      const branch = await api.createBranch({
        anchor_message_id: anchorMessageId,
        title: title || 'Rough Sheet',
        anchor_text: anchorText,
      });
      setBranches(prev => [branch, ...prev]);
      setActiveBranch(branch);
      setShowVault(false);
    } catch (err) {
      console.error('Failed to create branch:', err);
    }
  };

  const handleOpenBranch = async (branchId) => {
    try {
      const branch = await api.getBranch(branchId);
      setActiveBranch(branch);
      setShowVault(false);
    } catch (err) {
      console.error('Failed to open branch:', err);
    }
  };

  const handleSendBranchMessage = async (content) => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      // Optimistic update
      setActiveBranch(prev => ({
        ...prev,
        messages: [...(prev.messages || []), {
          id: 'temp-' + Date.now(),
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }],
      }));

      const result = await api.sendBranchMessage(activeBranch.id, content);
      
      setActiveBranch(prev => ({
        ...prev,
        messages: [
          ...(prev.messages || []).filter(m => !m.id.startsWith('temp-')),
          result.userMessage,
          result.aiMessage,
        ],
      }));
    } catch (err) {
      console.error('Failed to send branch message:', err);
      setActiveBranch(prev => ({
        ...prev,
        messages: (prev.messages || []).filter(m => !m.id.startsWith('temp-')),
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleResolveBranch = async () => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      const result = await api.resolveBranch(activeBranch.id);
      
      // Update branch status
      setActiveBranch(prev => ({ ...prev, status: 'resolved' }));
      setBranches(prev =>
        prev.map(b => b.id === activeBranch.id ? { ...b, status: 'resolved' } : b)
      );

      // Add summary message to main conversation
      if (result.summaryMessage) {
        setActiveConversation(prev => ({
          ...prev,
          messages: [...(prev.messages || []), result.summaryMessage],
        }));
      }
    } catch (err) {
      console.error('Failed to resolve branch:', err);
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
    }
  };

  return (
    <div className="flex h-screen w-screen bg-atonement-bg overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-atonement-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-atonement-cyan/5 rounded-full blur-3xl" />
      </div>

      {/* Left Panel */}
      <LeftPanel
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        branches={branches}
        activeBranchId={activeBranch?.id}
        onNewConversation={handleNewConversation}
        onSelectConversation={loadConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenBranch={handleOpenBranch}
        onShowVault={handleShowVault}
        showVault={showVault}
      />

      {/* Center Panel - Main Chat */}
      <MainChat
        conversation={activeConversation}
        onSendMessage={handleSendMessage}
        onCreateBranch={handleCreateBranch}
        loading={loading}
        branches={branches}
      />

      {/* Right Panel - Branch or Vault */}
      {(activeBranch || showVault) && (
        <div className="w-[420px] flex-shrink-0 animate-slide-in-right">
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
    </div>
  );
}
