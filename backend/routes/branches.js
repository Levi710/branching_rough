import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { buildBranchContext } from '../services/contextManager.js';
import { generateResponse, generateBranchSummary } from '../services/ai.js';

const router = Router();

// Create a new branch from an anchor message
router.post('/', (req, res) => {
  const { anchor_message_id, title, anchor_text } = req.body;

  const anchorMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(anchor_message_id);
  if (!anchorMessage) return res.status(404).json({ error: 'Anchor message not found' });

  const id = uuidv4();
  db.prepare(
    'INSERT INTO branches (id, conversation_id, anchor_message_id, anchor_text, title) VALUES (?, ?, ?, ?, ?)'
  ).run(id, anchorMessage.conversation_id, anchor_message_id, anchor_text || anchorMessage.content, title || 'Rough Sheet');

  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
  res.status(201).json(branch);
});

// Get a branch with its messages
router.get('/:id', (req, res) => {
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  const messages = db.prepare(
    'SELECT * FROM branch_messages WHERE branch_id = ? ORDER BY created_at ASC'
  ).all(req.params.id);

  const anchorMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(branch.anchor_message_id);

  res.json({ ...branch, messages, anchorMessage });
});

// List branches for a conversation
router.get('/conversation/:conversationId', (req, res) => {
  const branches = db.prepare(
    'SELECT * FROM branches WHERE conversation_id = ? ORDER BY created_at DESC'
  ).all(req.params.conversationId);
  res.json(branches);
});

// Send a message in a branch
router.post('/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    const branchId = req.params.id;

    const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    if (branch.status === 'resolved') return res.status(400).json({ error: 'Branch is already resolved' });

    // Save user message
    const userMsgId = uuidv4();
    db.prepare(
      'INSERT INTO branch_messages (id, branch_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(userMsgId, branchId, 'user', content);

    // Build context and generate AI response
    const { systemPrompt, contextMessages } = buildBranchContext(branchId);
    const aiResponse = await generateResponse(contextMessages, systemPrompt);

    // Save AI message
    const aiMsgId = uuidv4();
    db.prepare(
      'INSERT INTO branch_messages (id, branch_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(aiMsgId, branchId, 'assistant', aiResponse);

    const now = new Date().toISOString();
    res.json({
      userMessage: { id: userMsgId, branch_id: branchId, role: 'user', content, created_at: now },
      aiMessage: { id: aiMsgId, branch_id: branchId, role: 'assistant', content: aiResponse, created_at: now },
    });
  } catch (error) {
    console.error('Branch message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resolve a branch – generate summary, inject into main thread, store reference
router.post('/:id/resolve', async (req, res) => {
  try {
    const branchId = req.params.id;
    const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    if (branch.status === 'resolved') return res.status(400).json({ error: 'Branch already resolved' });

    const branchMessages = db.prepare(
      'SELECT role, content FROM branch_messages WHERE branch_id = ? ORDER BY created_at ASC'
    ).all(branchId);

    if (branchMessages.length === 0) {
      return res.status(400).json({ error: 'No messages in branch to summarize' });
    }

    const anchorMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(branch.anchor_message_id);
    const anchorContent = branch.anchor_text || anchorMessage?.content || '';

    // Generate AI summary
    const { summary, tags } = await generateBranchSummary(branchMessages, anchorContent, branch.title);

    // Create reference note
    const noteId = uuidv4();
    db.prepare(
      'INSERT INTO reference_notes (id, branch_id, conversation_id, anchor_message_id, title, summary, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(noteId, branchId, branch.conversation_id, branch.anchor_message_id, branch.title, summary, JSON.stringify(tags));

    // Inject summary into main thread as a branch_summary message
    const summaryMsgId = uuidv4();
    const summaryContent = `📋 **Branch Resolved: "${branch.title}"**\n\n${summary}\n\n_Tags: ${tags.join(', ')}_`;
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(summaryMsgId, branch.conversation_id, 'branch_summary', summaryContent);

    // Mark branch as resolved
    db.prepare(
      "UPDATE branches SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?"
    ).run(branchId);

    res.json({
      branch: db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId),
      referenceNote: { id: noteId, summary, tags },
      summaryMessage: { id: summaryMsgId, content: summaryContent, created_at: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Resolve error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all reference notes
router.get('/references/all', (req, res) => {
  const notes = db.prepare(
    'SELECT rn.*, b.title as branch_title FROM reference_notes rn LEFT JOIN branches b ON rn.branch_id = b.id ORDER BY rn.created_at DESC'
  ).all();
  
  // Parse tags JSON
  const parsed = notes.map(n => ({ ...n, tags: JSON.parse(n.tags || '[]') }));
  res.json(parsed);
});

// Get reference notes for a conversation
router.get('/references/conversation/:conversationId', (req, res) => {
  const notes = db.prepare(
    'SELECT rn.*, b.title as branch_title FROM reference_notes rn LEFT JOIN branches b ON rn.branch_id = b.id WHERE rn.conversation_id = ? ORDER BY rn.created_at DESC'
  ).all(req.params.conversationId);
  
  const parsed = notes.map(n => ({ ...n, tags: JSON.parse(n.tags || '[]') }));
  res.json(parsed);
});

export default router;
