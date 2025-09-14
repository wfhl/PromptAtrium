// Simple in-memory storage interface for notes
// Replace with your preferred database implementation

interface Note {
  id: number;
  title: string;
  content?: string;
  type: string;
  folder: string;
  tags: string[];
  color?: string;
  isPinned: boolean;
  isArchived: boolean;
  parentId?: number;
  position: number;
  userId: string;
  createdAt: Date;
  lastModified: Date;
}

interface Folder {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  userId: string;
  createdAt: Date;
}

interface Tag {
  id: number;
  name: string;
  color?: string;
  textColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  userId: string;
  count?: number;
}

class NotesStorage {
  private notes: Map<number, Note> = new Map();
  private folders: Map<number, Folder> = new Map();
  private tags: Map<number, Tag> = new Map();
  private nextNoteId = 1;
  private nextFolderId = 1;
  private nextTagId = 1;

  // Notes operations
  async getUserNotes(userId: string): Promise<Note[]> {
    const userNotes = Array.from(this.notes.values())
      .filter(note => note.userId === userId)
      .sort((a, b) => {
        // Sort pinned notes first
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        // Then by position
        return a.position - b.position;
      });
    return userNotes;
  }

  async getNoteById(noteId: number): Promise<Note | null> {
    return this.notes.get(noteId) || null;
  }

  async createUserNote(userId: string, noteData: Partial<Note>): Promise<Note> {
    const note: Note = {
      id: this.nextNoteId++,
      userId,
      title: noteData.title || 'Untitled',
      content: noteData.content || '',
      type: noteData.type || 'text',
      folder: noteData.folder || 'Unsorted',
      tags: noteData.tags || [],
      color: noteData.color,
      isPinned: noteData.isPinned || false,
      isArchived: noteData.isArchived || false,
      parentId: noteData.parentId,
      position: noteData.position || 0,
      createdAt: new Date(),
      lastModified: new Date()
    };
    
    this.notes.set(note.id, note);
    return note;
  }

  async updateUserNote(userId: string, noteId: number, updates: Partial<Note>): Promise<Note | null> {
    const note = this.notes.get(noteId);
    if (!note || note.userId !== userId) {
      return null;
    }
    
    const updatedNote = {
      ...note,
      ...updates,
      id: note.id,
      userId: note.userId,
      createdAt: note.createdAt,
      lastModified: new Date()
    };
    
    this.notes.set(noteId, updatedNote);
    return updatedNote;
  }

  async deleteUserNote(userId: string, noteId: number): Promise<boolean> {
    const note = this.notes.get(noteId);
    if (!note || note.userId !== userId) {
      return false;
    }
    
    return this.notes.delete(noteId);
  }

  // Folders operations
  async getAllPromptFolders(): Promise<Folder[]> {
    return Array.from(this.folders.values());
  }

  async createPromptFolder(folderData: Partial<Folder>): Promise<Folder> {
    const folder: Folder = {
      id: this.nextFolderId++,
      name: folderData.name || 'New Folder',
      description: folderData.description,
      color: folderData.color,
      icon: folderData.icon,
      userId: folderData.userId || 'default',
      createdAt: new Date()
    };
    
    this.folders.set(folder.id, folder);
    return folder;
  }

  async updatePromptFolder(folderId: number, updates: Partial<Folder>): Promise<Folder | null> {
    const folder = this.folders.get(folderId);
    if (!folder) {
      return null;
    }
    
    const updatedFolder = {
      ...folder,
      ...updates,
      id: folder.id,
      createdAt: folder.createdAt
    };
    
    this.folders.set(folderId, updatedFolder);
    return updatedFolder;
  }

  async deletePromptFolder(folderId: number): Promise<boolean> {
    return this.folders.delete(folderId);
  }

  // Tags operations
  async getAllTags(userId: string): Promise<Tag[]> {
    return Array.from(this.tags.values())
      .filter(tag => tag.userId === userId);
  }

  async createTag(tagData: Partial<Tag>): Promise<Tag> {
    const tag: Tag = {
      id: this.nextTagId++,
      name: tagData.name || 'New Tag',
      color: tagData.color,
      textColor: tagData.textColor,
      borderColor: tagData.borderColor,
      backgroundColor: tagData.backgroundColor,
      userId: tagData.userId || 'default',
      count: 0
    };
    
    this.tags.set(tag.id, tag);
    return tag;
  }

  async updateTag(tagId: number, updates: Partial<Tag>): Promise<Tag | null> {
    const tag = this.tags.get(tagId);
    if (!tag) {
      return null;
    }
    
    const updatedTag = {
      ...tag,
      ...updates,
      id: tag.id
    };
    
    this.tags.set(tagId, updatedTag);
    return updatedTag;
  }

  async deleteTag(tagId: number): Promise<boolean> {
    return this.tags.delete(tagId);
  }
}

// Export a singleton instance
export const storage = new NotesStorage();

// For database implementations, replace the above with your database queries
// Example for PostgreSQL with Drizzle ORM:
/*
import { db } from './database';
import { notes, folders, tags } from './schema';

export const storage = {
  async getUserNotes(userId: string) {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  },
  // ... implement other methods using your database
};
*/