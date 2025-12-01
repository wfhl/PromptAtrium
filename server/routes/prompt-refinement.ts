import { Router, Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated?.() || !req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
  currentPrompt: z.string().optional(),
  templateInfo: z.object({
    name: z.string(),
    category: z.string(),
  }).optional(),
});

const updateMemorySchema = z.object({
  preferredStyles: z.array(z.string()).optional(),
  preferredThemes: z.array(z.string()).optional(),
  preferredModifiers: z.array(z.string()).optional(),
  avoidedTerms: z.array(z.string()).optional(),
  customInstructions: z.string().optional(),
});

function buildSystemPrompt(memory: any, currentPrompt?: string, templateInfo?: { name: string; category: string }): string {
  let systemPrompt = `You are an expert AI prompt engineer specializing in crafting optimized prompts for image generation AI models like Midjourney, DALL-E, Stable Diffusion, and Flux.

Your role is to help users refine and improve their prompts through conversational interaction. You should:
1. Understand what the user wants to achieve with their prompt
2. Suggest improvements in clarity, detail, and effectiveness
3. Add artistic direction, lighting, composition, and style suggestions when appropriate
4. Keep prompts concise but impactful
5. Remember the user's preferences and incorporate them naturally

When refining prompts:
- Preserve the user's core vision and intent
- Add professional photography and art terminology where helpful
- Suggest specific styles, artists, or aesthetic references when relevant
- Consider aspect ratio and composition
- Include technical details like camera angles, lighting setups, or rendering styles`;

  if (memory) {
    if (memory.preferredStyles?.length > 0) {
      systemPrompt += `\n\nUser's preferred styles: ${memory.preferredStyles.join(', ')}`;
    }
    if (memory.preferredThemes?.length > 0) {
      systemPrompt += `\nUser's preferred themes: ${memory.preferredThemes.join(', ')}`;
    }
    if (memory.preferredModifiers?.length > 0) {
      systemPrompt += `\nUser's commonly used modifiers: ${memory.preferredModifiers.join(', ')}`;
    }
    if (memory.avoidedTerms?.length > 0) {
      systemPrompt += `\nTerms to avoid: ${memory.avoidedTerms.join(', ')}`;
    }
    if (memory.customInstructions) {
      systemPrompt += `\nUser's custom instructions: ${memory.customInstructions}`;
    }
  }

  if (templateInfo) {
    systemPrompt += `\n\nCurrent template: ${templateInfo.name} (Category: ${templateInfo.category})`;
  }

  if (currentPrompt) {
    systemPrompt += `\n\nThe user's current prompt to refine is:\n"${currentPrompt}"`;
  }

  systemPrompt += `\n\nWhen providing a refined prompt, clearly mark it with [REFINED_PROMPT] tags so it can be extracted. Format: [REFINED_PROMPT]your refined prompt here[/REFINED_PROMPT]`;

  return systemPrompt;
}

function extractRefinedPrompt(response: string): { text: string; refinedPrompt: string | null } {
  const refinedMatch = response.match(/\[REFINED_PROMPT\]([\s\S]*?)\[\/REFINED_PROMPT\]/);
  const refinedPrompt = refinedMatch ? refinedMatch[1].trim() : null;
  const text = response.replace(/\[REFINED_PROMPT\][\s\S]*?\[\/REFINED_PROMPT\]/g, '').trim();
  
  return { text, refinedPrompt };
}

async function extractUserPreferences(messages: Array<{ role: string; content: string }>): Promise<{
  styles: string[];
  themes: string[];
  modifiers: string[];
  avoidedTerms: string[];
}> {
  try {
    const analysisPrompt = `Analyze this conversation and extract any user preferences mentioned. Return a JSON object with:
- styles: artistic styles the user seems to prefer (e.g., "cinematic", "anime", "photorealistic")
- themes: themes or subjects they gravitate toward
- modifiers: common descriptive terms they use or like
- avoidedTerms: things they explicitly want to avoid

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Return ONLY valid JSON, no other text:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5', // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: [{ role: 'user', content: analysisPrompt }],
      response_format: { type: 'json_object' },
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    
    return {
      styles: parsed.styles || [],
      themes: parsed.themes || [],
      modifiers: parsed.modifiers || [],
      avoidedTerms: parsed.avoidedTerms || [],
    };
  } catch (error) {
    console.error('Error extracting preferences:', error);
    return { styles: [], themes: [], modifiers: [], avoidedTerms: [] };
  }
}

router.post('/chat', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsed = chatMessageSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const { message, conversationId, currentPrompt, templateInfo } = parsed.data;
    
    let conversation;
    let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (conversationId) {
      conversation = await storage.getRefinementConversation(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      const existingMessages = await storage.getConversationMessages(conversationId);
      messages = existingMessages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));
    } else {
      conversation = await storage.createRefinementConversation({
        userId,
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        initialPrompt: currentPrompt || null,
        currentPrompt: currentPrompt || null,
        isActive: true,
      });
    }

    const userMemory = await storage.getUserPromptMemory(userId);
    const systemPrompt = buildSystemPrompt(userMemory, currentPrompt || conversation.currentPrompt, templateInfo);

    await storage.createRefinementMessage({
      conversationId: conversation.id,
      role: 'user',
      content: message,
    });
    messages.push({ role: 'user', content: message });

    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-5', // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: chatMessages,
      max_completion_tokens: 2000,
    });

    const assistantResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    
    const { text, refinedPrompt } = extractRefinedPrompt(assistantResponse);

    await storage.createRefinementMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: assistantResponse,
    });

    if (refinedPrompt) {
      await storage.updateRefinementConversation(conversation.id, {
        currentPrompt: refinedPrompt,
      });
    }

    res.json({
      conversationId: conversation.id,
      message: text,
      refinedPrompt,
      tokensUsed: completion.usage?.total_tokens || 0,
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

router.get('/conversations', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const activeOnly = req.query.activeOnly === 'true';

    const conversations = await storage.getUserRefinementConversations(userId, {
      limit,
      offset,
      activeOnly,
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const conversation = await storage.getRefinementConversation(id);
    if (!conversation || conversation.userId !== userId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await storage.getConversationMessages(id);

    res.json({
      conversation,
      messages,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.delete('/conversations/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const conversation = await storage.getRefinementConversation(id);
    if (!conversation || conversation.userId !== userId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await storage.deleteRefinementConversation(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

router.get('/memory', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const memory = await storage.getUserPromptMemory(userId);
    
    res.json(memory || {
      preferredStyles: [],
      preferredThemes: [],
      preferredModifiers: [],
      avoidedTerms: [],
      customInstructions: null,
      totalConversations: 0,
      totalRefinements: 0,
    });
  } catch (error) {
    console.error('Error fetching memory:', error);
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

router.patch('/memory', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsed = updateMemorySchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const memory = await storage.upsertUserPromptMemory(userId, parsed.data);
    res.json(memory);
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

router.post('/learn-preferences', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    const conversation = await storage.getRefinementConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await storage.getConversationMessages(conversationId);
    const extractedPrefs = await extractUserPreferences(
      messages.map(m => ({ role: m.role, content: m.content }))
    );

    const currentMemory = await storage.getUserPromptMemory(userId);
    
    const mergeUnique = (existing: string[] = [], newItems: string[]): string[] => {
      const combined = [...existing, ...newItems];
      return [...new Set(combined)].slice(0, 20);
    };

    const updatedMemory = await storage.upsertUserPromptMemory(userId, {
      preferredStyles: mergeUnique(currentMemory?.preferredStyles, extractedPrefs.styles),
      preferredThemes: mergeUnique(currentMemory?.preferredThemes, extractedPrefs.themes),
      preferredModifiers: mergeUnique(currentMemory?.preferredModifiers, extractedPrefs.modifiers),
      avoidedTerms: mergeUnique(currentMemory?.avoidedTerms, extractedPrefs.avoidedTerms),
    });

    res.json({
      success: true,
      extractedPreferences: extractedPrefs,
      updatedMemory,
    });
  } catch (error) {
    console.error('Error learning preferences:', error);
    res.status(500).json({ error: 'Failed to learn preferences' });
  }
});

router.delete('/memory', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    await storage.upsertUserPromptMemory(userId, {
      preferredStyles: [],
      preferredThemes: [],
      preferredModifiers: [],
      avoidedTerms: [],
      customInstructions: null,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing memory:', error);
    res.status(500).json({ error: 'Failed to clear memory' });
  }
});

export default router;
