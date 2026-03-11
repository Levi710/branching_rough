const API_BASE = '/api';

// Helper to get or create a persistent user ID for privacy
const getUserId = () => {
  let userId = localStorage.getItem('atonement_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('atonement_user_id', userId);
  }
  return userId;
};

async function request(url, options = {}) {
  const headers = { 
    'Content-Type': 'application/json',
    'X-User-Id': getUserId() 
  };
  
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

// Conversations
export const createConversation = (data) =>
  request('/conversations', { method: 'POST', body: JSON.stringify(data) });

export const listConversations = () =>
  request('/conversations');

export const getConversation = (id) =>
  request(`/conversations/${id}`);

export const sendMessage = (conversationId, content) =>
  request(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

export const updateConversation = (id, data) =>
  request(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteConversation = (id) =>
  request(`/conversations/${id}`, { method: 'DELETE' });

export const shareConversation = (id) =>
  request(`/conversations/${id}/share`, { method: 'POST' });

export const getSharedConversation = (token) =>
  request(`/conversations/shared/${token}`);

// Branches
export const createBranch = (data) =>
  request('/branches', { method: 'POST', body: JSON.stringify(data) });

export const getBranch = (id) =>
  request(`/branches/${id}`);

export const listBranches = (conversationId) =>
  request(`/branches/conversation/${conversationId}`);

export const sendBranchMessage = (branchId, content) =>
  request(`/branches/${branchId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

export const resolveBranch = (branchId) =>
  request(`/branches/${branchId}/resolve`, { method: 'POST' });

// Reference Notes
export const listReferenceNotes = () =>
  request('/branches/references/all');

export const listConversationReferenceNotes = (conversationId) =>
  request(`/branches/references/conversation/${conversationId}`);
