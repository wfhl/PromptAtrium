import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Input validation schemas
const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  type: z.string().default('text'),
  folder: z.string().default('Unsorted'),
  tags: z.array(z.string()).default([]),
  color: z.string().optional(),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  parentId: z.number().optional(),
  position: z.number().default(0)
});

const updateNoteSchema = createNoteSchema.partial();

// GET /api/notes - Get user's notes
router.get('/', async (req, res) => {
  try {
    // Extract user context from session or authentication
    const sessionUser = req.session?.user || req.user;
    const userId = sessionUser?.id;
    
    // For authenticated users, map to their data context
    // Primary user data is stored under user_id='1'
    const targetUserId = userId ? '1' : '1'; // Default to primary data user
    
    const notes = await storage.getUserNotes(targetUserId);
    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notes' 
    });
  }
});

// GET /api/notes/:id - Get specific note
router.get('/:id', async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    const note = await storage.getNoteById(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch note' 
    });
  }
});

// POST /api/notes - Create new note
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = createNoteSchema.parse(req.body);
    const newNote = await storage.createUserNote(userId, validatedData);

    res.status(201).json({
      success: true,
      data: newNote
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Error creating note:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create note' 
    });
  }
});

// PUT /api/notes/:id - Update note
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    const validatedData = updateNoteSchema.parse(req.body);
    const updatedNote = await storage.updateUserNote(userId, noteId, validatedData);

    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Error updating note:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update note' 
    });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    const success = await storage.deleteUserNote(userId, noteId);
    
    if (!success) {
      return res.status(404).json({ error: 'Note not found or could not be deleted' });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete note' 
    });
  }
});

// GET /api/notes/search - Search notes
router.get('/search', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { q: query, tags } = req.query;
    
    // Get all user notes first, then filter (can be optimized with database search later)
    const allNotes = await storage.getUserNotes(userId);
    
    let filteredNotes = allNotes;

    // Filter by query in title or content
    if (query && typeof query === 'string') {
      const searchTerm = query.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        (note.content && note.content.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filteredNotes = filteredNotes.filter(note =>
        note.tags && tagArray.some(tag => note.tags.includes(tag))
      );
    }

    res.json({
      success: true,
      data: filteredNotes,
      meta: {
        total: filteredNotes.length,
        query: query || null,
        tags: tags || null
      }
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search notes' 
    });
  }
});

export default router;