import { sql } from 'drizzle-orm';
import { db } from './db';

// Script to add database indexes for performance optimization
async function addPerformanceIndexes() {
  console.log('Adding database indexes for performance optimization...');
  
  const indexes = [
    // Foreign key indexes for prompts table
    { 
      name: 'idx_prompts_user_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);',
      description: 'Index on prompts.user_id for user-specific queries'
    },
    { 
      name: 'idx_prompts_project_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);',
      description: 'Index on prompts.project_id for project-specific queries'
    },
    { 
      name: 'idx_prompts_collection_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_collection_id ON prompts(collection_id);',
      description: 'Index on prompts.collection_id for collection-specific queries'
    },
    
    // Filtering indexes for prompts table
    { 
      name: 'idx_prompts_status', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);',
      description: 'Index on prompts.status for status filtering'
    },
    { 
      name: 'idx_prompts_is_public', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON prompts(is_public);',
      description: 'Index on prompts.is_public for public/private filtering'
    },
    { 
      name: 'idx_prompts_is_featured', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_is_featured ON prompts(is_featured);',
      description: 'Index on prompts.is_featured for featured prompts'
    },
    { 
      name: 'idx_prompts_is_nsfw', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_is_nsfw ON prompts(is_nsfw);',
      description: 'Index on prompts.is_nsfw for content filtering'
    },
    { 
      name: 'idx_prompts_created_at', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);',
      description: 'Index on prompts.created_at for sorting by date'
    },
    
    // Composite indexes for common query patterns
    { 
      name: 'idx_prompts_user_public', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_user_public ON prompts(user_id, is_public);',
      description: 'Composite index for user public prompts'
    },
    { 
      name: 'idx_prompts_public_featured', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_public_featured ON prompts(is_public, is_featured);',
      description: 'Composite index for public featured prompts'
    },
    
    // Foreign key indexes for other tables
    { 
      name: 'idx_projects_owner_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);',
      description: 'Index on projects.owner_id for user projects'
    },
    { 
      name: 'idx_user_communities_user_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_user_communities_user_id ON user_communities(user_id);',
      description: 'Index on user_communities.user_id'
    },
    { 
      name: 'idx_user_communities_community_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_user_communities_community_id ON user_communities(community_id);',
      description: 'Index on user_communities.community_id'
    },
    { 
      name: 'idx_prompt_history_user_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON prompt_history(user_id);',
      description: 'Index on prompt_history.user_id'
    },
    { 
      name: 'idx_prompt_likes_user_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompt_likes_user_id ON prompt_likes(user_id);',
      description: 'Index on prompt_likes.user_id'
    },
    { 
      name: 'idx_prompt_likes_prompt_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);',
      description: 'Index on prompt_likes.prompt_id'
    },
    { 
      name: 'idx_prompt_ratings_user_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompt_ratings_user_id ON prompt_ratings(user_id);',
      description: 'Index on prompt_ratings.user_id'
    },
    { 
      name: 'idx_prompt_ratings_prompt_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompt_ratings_prompt_id ON prompt_ratings(prompt_id);',
      description: 'Index on prompt_ratings.prompt_id'
    },
    { 
      name: 'idx_prompt_favorites_user_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompt_favorites_user_id ON prompt_favorites(user_id);',
      description: 'Index on prompt_favorites.user_id'
    },
    { 
      name: 'idx_prompt_favorites_prompt_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompt_favorites_prompt_id ON prompt_favorites(prompt_id);',
      description: 'Index on prompt_favorites.prompt_id'
    },
    { 
      name: 'idx_collections_owner_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id);',
      description: 'Index on collections.owner_id'
    },
    { 
      name: 'idx_collections_community_id', 
      query: 'CREATE INDEX IF NOT EXISTS idx_collections_community_id ON collections(community_id);',
      description: 'Index on collections.community_id'
    },
    
    // Text search indexes for better search performance
    { 
      name: 'idx_prompts_name_gin', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_name_gin ON prompts USING gin(to_tsvector(\'english\', name));',
      description: 'GIN index on prompts.name for full-text search'
    },
    { 
      name: 'idx_prompts_description_gin', 
      query: 'CREATE INDEX IF NOT EXISTS idx_prompts_description_gin ON prompts USING gin(to_tsvector(\'english\', description));',
      description: 'GIN index on prompts.description for full-text search'
    },
  ];
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const index of indexes) {
    try {
      console.log(`Creating index: ${index.name}`);
      await db.execute(sql.raw(index.query));
      console.log(`✅ Created: ${index.description}`);
      successCount++;
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log(`⏭️ Skipped (already exists): ${index.name}`);
        skipCount++;
      } else {
        console.error(`❌ Error creating ${index.name}:`, error.message);
        errorCount++;
      }
    }
  }
  
  console.log('\n========================================');
  console.log('Index Creation Summary:');
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`⏭️ Skipped (existing): ${skipCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log('========================================\n');
  
  return { successCount, skipCount, errorCount };
}

// Run if executed directly
addPerformanceIndexes()
  .then(() => {
    console.log('Database index optimization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error adding indexes:', error);
    process.exit(1);
  });

export { addPerformanceIndexes };