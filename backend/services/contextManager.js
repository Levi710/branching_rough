import db from '../database/db.js';

/**
 * Build context for the main conversation thread.
 * Includes: system prompt, user goal, all messages, and branch summaries (not full branch content).
 */
export function buildMainContext(conversationId) {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
  if (!conversation) throw new Error('Conversation not found');

  const messages = db.prepare(
    'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(conversationId);

  const systemPrompt = `You are a helpful AI assistant in the Atonement conversation system.
${conversation.goal ? `The user's goal: ${conversation.goal}` : ''}
You maintain focus on the main conversation thread. Side topics have their own branches.
Be concise, clear, and helpful.`;

  // Filter to only include user/assistant/branch_summary messages in context
  const contextMessages = messages
    .filter(m => ['user', 'assistant', 'branch_summary'].includes(m.role))
    .map(m => ({
      role: m.role === 'branch_summary' ? 'user' : m.role,
      content: m.role === 'branch_summary'
        ? `[Branch Summary Note] ${m.content}`
        : m.content,
    }));

  return { systemPrompt, contextMessages };
}

/**
 * Build context for a branch conversation.
 * Includes: anchor message, limited surrounding context, and branch messages only.
 */
export function buildBranchContext(branchId) {
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
  if (!branch) throw new Error('Branch not found');

  // Get anchor message
  const anchorMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(branch.anchor_message_id);
  if (!anchorMessage) throw new Error('Anchor message not found');

  // Get limited surrounding context (2 messages before and after anchor)
  const surroundingMessages = db.prepare(`
    SELECT role, content FROM messages 
    WHERE conversation_id = ? 
    AND created_at <= (SELECT created_at FROM messages WHERE id = ?)
    ORDER BY created_at DESC 
    LIMIT 5
  `).all(branch.conversation_id, branch.anchor_message_id).reverse();

  // Get branch messages
  const branchMessages = db.prepare(
    'SELECT role, content FROM branch_messages WHERE branch_id = ? ORDER BY created_at ASC'
  ).all(branchId);

  const anchorText = branch.anchor_text || anchorMessage.content;

  const systemPrompt = `You are a helpful AI assistant in a branch discussion (rough sheet).
This branch is exploring a specific topic anchored to the following message:

---
${anchorText}
---

Branch title: "${branch.title}"

Focus your responses on this specific topic. Be detailed and thorough since this is a dedicated exploration space.`;

  // Build context: surrounding context + branch messages
  const contextMessages = [];
  
  // Add surrounding context as initial context
  if (surroundingMessages.length > 0) {
    const contextSummary = surroundingMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    contextMessages.push({
      role: 'user',
      content: `[Context from main thread]\n${contextSummary}\n\n[Now discussing in branch: "${branch.title}"]`,
    });
    contextMessages.push({
      role: 'assistant',
      content: `I understand. Let's explore "${branch.title}" in this branch. What would you like to discuss?`,
    });
  }

  // Add branch messages
  branchMessages.forEach(m => {
    contextMessages.push({ role: m.role, content: m.content });
  });

  return { systemPrompt, contextMessages, anchorContent: anchorText };
}
