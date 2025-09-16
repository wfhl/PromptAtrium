import { Router } from 'express';
import { db } from '../database';

const router = Router();

// ========== Generic CRUD Operations ==========

// Generic GET all items endpoint
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const items = await db.select().from(table);
    res.json(items);
  } catch (error) {
    console.error(`Error fetching ${req.params.table}:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.table}` });
  }
});

// Generic GET single item endpoint
router.get('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const item = await db.select().from(table).where({ id: parseInt(id) }).first();
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error(`Error fetching ${req.params.table} item:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.table} item` });
  }
});

// Generic POST endpoint for creating items
router.post('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const item = req.body;
    
    // Add timestamps
    item.created_at = new Date();
    item.updated_at = new Date();
    
    const [newItem] = await db.insert(item).into(table).returning('*');
    res.status(201).json(newItem);
  } catch (error) {
    console.error(`Error creating ${req.params.table} item:`, error);
    res.status(500).json({ error: `Failed to create ${req.params.table} item` });
  }
});

// Generic PUT endpoint for updating items
router.put('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const updates = req.body;
    
    // Add updated timestamp
    updates.updated_at = new Date();
    
    const [updatedItem] = await db.update(table)
      .set(updates)
      .where({ id: parseInt(id) })
      .returning('*');
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error(`Error updating ${req.params.table} item:`, error);
    res.status(500).json({ error: `Failed to update ${req.params.table} item` });
  }
});

// Generic PATCH endpoint for partial updates
router.patch('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const updates = req.body;
    
    // Add updated timestamp
    updates.updated_at = new Date();
    
    const [updatedItem] = await db.update(table)
      .set(updates)
      .where({ id: parseInt(id) })
      .returning('*');
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error(`Error updating ${req.params.table} item:`, error);
    res.status(500).json({ error: `Failed to update ${req.params.table} item` });
  }
});

// Generic DELETE endpoint
router.delete('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    
    const deleted = await db.delete().from(table).where({ id: parseInt(id) });
    
    if (deleted === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting ${req.params.table} item:`, error);
    res.status(500).json({ error: `Failed to delete ${req.params.table} item` });
  }
});

// Bulk update endpoint
router.put('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const items = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Request body must be an array' });
    }
    
    // Update each item
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        if (item.id) {
          // Update existing item
          item.updated_at = new Date();
          const [updated] = await db.update(table)
            .set(item)
            .where({ id: item.id })
            .returning('*');
          return updated;
        } else {
          // Create new item
          item.created_at = new Date();
          item.updated_at = new Date();
          const [created] = await db.insert(item).into(table).returning('*');
          return created;
        }
      })
    );
    
    res.json(updatedItems);
  } catch (error) {
    console.error(`Error bulk updating ${req.params.table}:`, error);
    res.status(500).json({ error: `Failed to bulk update ${req.params.table}` });
  }
});

// Bulk delete endpoint
router.post('/:table/bulk-delete', async (req, res) => {
  try {
    const { table } = req.params;
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }
    
    await db.delete().from(table).whereIn('id', ids);
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error bulk deleting ${req.params.table}:`, error);
    res.status(500).json({ error: `Failed to bulk delete ${req.params.table}` });
  }
});

// Search endpoint
router.get('/:table/search', async (req, res) => {
  try {
    const { table } = req.params;
    const { q, fields } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchFields = fields ? fields.split(',') : ['name', 'description'];
    const searchQuery = `%${q}%`;
    
    // Build search conditions
    const conditions = searchFields.map(field => 
      db.raw(`${field} ILIKE ?`, searchQuery)
    );
    
    const results = await db.select()
      .from(table)
      .where(function() {
        conditions.forEach((condition, index) => {
          if (index === 0) {
            this.whereRaw(condition);
          } else {
            this.orWhereRaw(condition);
          }
        });
      });
    
    res.json(results);
  } catch (error) {
    console.error(`Error searching ${req.params.table}:`, error);
    res.status(500).json({ error: `Failed to search ${req.params.table}` });
  }
});

export default router;