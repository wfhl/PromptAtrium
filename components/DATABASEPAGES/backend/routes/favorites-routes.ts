import { Router } from 'express';
import { db } from '../database';

const router = Router();

// Get all favorites for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await db.select()
      .from('favorites')
      .where({ user_id: userId });
    
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get favorites by type for a user
router.get('/type/:itemType', async (req, res) => {
  try {
    const { itemType } = req.params;
    const userId = req.headers['x-user-id'] || 'dev-user';
    
    const favorites = await db.select()
      .from('favorites')
      .where({ 
        user_id: userId,
        item_type: itemType 
      });
    
    // Get the actual items
    const itemIds = favorites.map(f => f.item_id);
    if (itemIds.length > 0) {
      const items = await db.select()
        .from(itemType)
        .whereIn('id', itemIds);
      
      res.json(items);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching favorites by type:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Check if an item is favorited
router.get('/check/:itemType/:itemId', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const userId = req.headers['x-user-id'] || 'dev-user';
    
    const favorite = await db.select()
      .from('favorites')
      .where({
        user_id: userId,
        item_type: itemType,
        item_id: parseInt(itemId)
      })
      .first();
    
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
});

// Add a favorite
router.post('/add', async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    const userId = req.headers['x-user-id'] || 'dev-user';
    
    // Check if already favorited
    const existing = await db.select()
      .from('favorites')
      .where({
        user_id: userId,
        item_type: itemType,
        item_id: itemId
      })
      .first();
    
    if (existing) {
      return res.json({ message: 'Already favorited' });
    }
    
    // Add favorite
    const [favorite] = await db.insert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      created_at: new Date()
    })
    .into('favorites')
    .returning('*');
    
    res.json(favorite);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove a favorite
router.delete('/remove', async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    const userId = req.headers['x-user-id'] || 'dev-user';
    
    const deleted = await db.delete()
      .from('favorites')
      .where({
        user_id: userId,
        item_type: itemType,
        item_id: itemId
      });
    
    if (deleted === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    res.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// Toggle favorite status
router.post('/toggle', async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    const userId = req.headers['x-user-id'] || 'dev-user';
    
    // Check if exists
    const existing = await db.select()
      .from('favorites')
      .where({
        user_id: userId,
        item_type: itemType,
        item_id: itemId
      })
      .first();
    
    if (existing) {
      // Remove if exists
      await db.delete()
        .from('favorites')
        .where({
          user_id: userId,
          item_type: itemType,
          item_id: itemId
        });
      
      res.json({ isFavorite: false });
    } else {
      // Add if doesn't exist
      await db.insert({
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        created_at: new Date()
      })
      .into('favorites');
      
      res.json({ isFavorite: true });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

export default router;