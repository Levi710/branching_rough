import Groq from 'groq-sdk';

const API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: API_KEY });
const model = 'llama-3.3-70b-versatile';

/**
 * Generate a response for the main thread or branch conversation.
 * @param {Array<{role: string, content: string}>} contextMessages - Conversation context
 * @param {string} systemPrompt - System instructions
 * @returns {Promise<string>} AI response text
 */
export async function generateResponse(contextMessages, systemPrompt = '') {
  try {
    const messages = [
      { role: 'system', content: systemPrompt || 'You are a helpful AI assistant. Be concise and clear.' },
      ...contextMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || 'No response generated.';
  } catch (error) {
    console.error('AI generation error:', error.message);
    return `I encountered an error generating a response. Please try again. (${error.message})`;
  }
}

/**
 * Generate a branch summary from the branch conversation.
 * @param {Array<{role: string, content: string}>} branchMessages 
 * @param {string} anchorContent - The original anchor message content
 * @param {string} branchTitle - The branch title
 * @returns {Promise<{summary: string, tags: string[]}>}
 */
export async function generateBranchSummary(branchMessages, anchorContent, branchTitle) {
  try {
    const conversation = branchMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `You are summarizing a branch discussion from an AI conversation system.

**Anchor Message:** ${anchorContent}

**Branch Title:** ${branchTitle}

**Branch Discussion:**
${conversation}

Generate a concise summary of this branch discussion. Include:
1. The issue or question that was explored
2. The resolution or key findings
3. Any important details worth remembering

Also provide 2-4 relevant tags for categorization.

Respond in this exact JSON format:
{
  "summary": "your concise summary here",
  "tags": ["tag1", "tag2"]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const text = chatCompletion.choices[0]?.message?.content;
    
    try {
      return JSON.parse(text);
    } catch(e) {
      console.error('JSON parse error from groq:', e, text);
      return { summary: text, tags: ['general'] };
    }
  } catch (error) {
    console.error('Summary generation error:', error.message);
    return {
      summary: `Branch "${branchTitle}" was discussed and resolved.`,
      tags: ['auto-generated'],
    };
  }
}
