import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { buildMainContext } from '../services/contextManager.js';
import { generateResponse, generateConversationTitle } from '../services/ai.js';

const router = Router();

// Create a new conversation
router.post('/', (req, res) => {
  const { title, goal } = req.body;
  const id = uuidv4();
  
  db.prepare(
    'INSERT INTO conversations (id, title, goal) VALUES (?, ?, ?)'
  ).run(id, title || 'New Conversation', goal || '');
  
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  res.status(201).json(conversation);
});

// List all conversations
router.get('/', (req, res) => {
  const conversations = db.prepare(
    'SELECT * FROM conversations ORDER BY updated_at DESC'
  ).all();
  res.json(conversations);
});

// Get a conversation with its messages
router.get('/:id', (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const messages = db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(req.params.id);

  const branches = db.prepare(
    'SELECT * FROM branches WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(req.params.id);

  res.json({ ...conversation, messages, branches });
});

// Send a message and get AI reply
router.post('/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    const conversationId = req.params.id;

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Save user message
    const userMsgId = uuidv4();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(userMsgId, conversationId, 'user', content);

    // Build context and generate AI response
    const { systemPrompt, contextMessages } = buildMainContext(conversationId);
    const aiResponse = await generateResponse(contextMessages, systemPrompt);

    // Save AI message
    const aiMsgId = uuidv4();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(aiMsgId, conversationId, 'assistant', aiResponse);

    // Update conversation timestamp
    db.prepare(
      "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?"
    ).run(conversationId);

    // Asynchronous Auto-naming logic logic matching the user's pseudocode:
    // If this is the FIRST message exchange, trigger title generation.
    const messageCount = db.prepare('SELECT count(*) as count FROM messages WHERE conversation_id = ?').get(conversationId).count;
    if (messageCount === 2) { // 1 user + 1 AI
      generateConversationTitle(content, aiResponse).then(title => {
        if (title && title !== 'New Conversation') {
          db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, conversationId);
        }
      }).catch(err => console.error('Background title gen failed:', err));
    }

    res.json({
      userMessage: { id: userMsgId, conversation_id: conversationId, role: 'user', content },
      aiMessage: { id: aiMsgId, conversation_id: conversationId, role: 'assistant', content: aiResponse },
    });
  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update conversation goal
router.patch('/:id', (req, res) => {
  const { title, goal } = req.body;
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  if (title) db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, req.params.id);
  if (goal) db.prepare('UPDATE conversations SET goal = ? WHERE id = ?').run(goal, req.params.id);

  const updated = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete a conversation
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Share a conversation (Generate token)
router.post('/:id/share', (req, res) => {
  try {
    const token = uuidv4();
    db.prepare('UPDATE conversations SET share_token = ? WHERE id = ?').run(token, req.params.id);
    res.json({ shareToken: token });
  } catch (err) {
    console.error('Share generation error:', err);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// Get a shared read-only conversation
router.get('/shared/:token', (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE share_token = ?').get(req.params.token);
  if (!conversation) return res.status(404).json({ error: 'Shared conversation not found' });

  const messages = db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(conversation.id);

  const branches = db.prepare(
    'SELECT * FROM branches WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(conversation.id);

  res.json({ ...conversation, messages, branches, readonly: true });
});

export default router;
