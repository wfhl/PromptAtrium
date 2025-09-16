-- Database Schema for Database Pages Package

-- ========================================
-- Aesthetics Table
-- ========================================
CREATE TABLE IF NOT EXISTS aesthetics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  era VARCHAR(100),
  categories TEXT[], -- Array of categories
  tags TEXT[], -- Array of tags
  visual_elements TEXT[], -- Array of visual elements
  color_palette TEXT[], -- Array of colors
  mood_keywords TEXT[], -- Array of mood keywords
  inspiration_sources TEXT[], -- Array of inspiration sources
  related_aesthetics TEXT[], -- Array of related aesthetics
  media_examples JSONB, -- JSON data for media examples
  image_urls TEXT[], -- Array of image URLs
  popularity INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  submitted_by VARCHAR(255),
  user_votes INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searches
CREATE INDEX idx_aesthetics_name ON aesthetics(name);
CREATE INDEX idx_aesthetics_categories ON aesthetics USING GIN(categories);
CREATE INDEX idx_aesthetics_tags ON aesthetics USING GIN(tags);

-- ========================================
-- Checkpoint Models Table
-- ========================================
CREATE TABLE IF NOT EXISTS checkpoint_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  sampler VARCHAR(100),
  scheduler VARCHAR(100),
  steps VARCHAR(50),
  cfg_scale VARCHAR(50),
  recommended_vae VARCHAR(255),
  negative_prompts TEXT,
  prompting_suggestions TEXT,
  civitai_url VARCHAR(500),
  resources TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searches
CREATE INDEX idx_checkpoint_models_name ON checkpoint_models(name);
CREATE INDEX idx_checkpoint_models_type ON checkpoint_models(type);

-- ========================================
-- Collaboration Hubs Table
-- ========================================
CREATE TABLE IF NOT EXISTS collaboration_hubs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  handle VARCHAR(100), -- "@" field
  type VARCHAR(100),
  owner VARCHAR(255),
  status VARCHAR(100),
  requirements TEXT,
  quality_requirements TEXT,
  notes TEXT,
  within_elite VARCHAR(10) DEFAULT 'No',
  elite VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searches
CREATE INDEX idx_collaboration_hubs_name ON collaboration_hubs(name);
CREATE INDEX idx_collaboration_hubs_type ON collaboration_hubs(type);
CREATE INDEX idx_collaboration_hubs_status ON collaboration_hubs(status);

-- ========================================
-- Prompt Components Table
-- ========================================
CREATE TABLE IF NOT EXISTS prompt_components (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  value VARCHAR(500) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searches
CREATE INDEX idx_prompt_components_category ON prompt_components(category);
CREATE INDEX idx_prompt_components_order ON prompt_components(order_index);

-- ========================================
-- Favorites Table
-- ========================================
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  item_type VARCHAR(100) NOT NULL,
  item_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_type, item_id)
);

-- Index for faster queries
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_type ON favorites(item_type);
CREATE INDEX idx_favorites_item ON favorites(item_id);

-- ========================================
-- Users Table (Optional - if needed)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Audit Log Table (Optional - for tracking changes)
-- ========================================
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  table_name VARCHAR(100),
  item_id INTEGER,
  action VARCHAR(50), -- CREATE, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Functions and Triggers
-- ========================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables to auto-update updated_at
CREATE TRIGGER update_aesthetics_updated_at BEFORE UPDATE ON aesthetics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkpoint_models_updated_at BEFORE UPDATE ON checkpoint_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_hubs_updated_at BEFORE UPDATE ON collaboration_hubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_components_updated_at BEFORE UPDATE ON prompt_components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Sample Data (Optional)
-- ========================================

-- Sample aesthetics
INSERT INTO aesthetics (name, description, era, categories, tags, visual_elements, color_palette, mood_keywords)
VALUES 
  ('Cyberpunk', 'Futuristic dystopian aesthetic with neon lights and high tech', '1980s-Present', 
   ARRAY['Futuristic', 'Urban'], ARRAY['neon', 'tech', 'dystopian'],
   ARRAY['Neon lights', 'Holograms', 'Cybernetic implants'],
   ARRAY['Neon pink', 'Electric blue', 'Black'],
   ARRAY['Dark', 'Gritty', 'Futuristic']),
  
  ('Cottagecore', 'Rural and domestic aesthetic celebrating simple living', '2010s-Present',
   ARRAY['Rural', 'Vintage'], ARRAY['nature', 'cozy', 'pastoral'],
   ARRAY['Flowers', 'Cottage', 'Gardens'],
   ARRAY['Soft greens', 'Cream', 'Brown'],
   ARRAY['Peaceful', 'Nostalgic', 'Warm']);

-- Sample checkpoint models
INSERT INTO checkpoint_models (name, type, sampler, steps, cfg_scale, recommended_vae)
VALUES
  ('Stable Diffusion XL', 'SDXL', 'DPM++ 2M Karras', '30', '7.5', 'sdxl_vae.safetensors'),
  ('Realistic Vision', 'SD 1.5', 'Euler a', '25', '7', 'vae-ft-mse-840000-ema-pruned.ckpt');

-- Sample collaboration hubs
INSERT INTO collaboration_hubs (name, handle, type, owner, status, requirements)
VALUES
  ('AI Art Collective', 'aiartcollective', 'Art Group', 'John Doe', 'Active', 'Portfolio submission required'),
  ('Prompt Engineers Hub', 'prompteng', 'Technical', 'Jane Smith', 'Open', 'Basic knowledge of prompting');

-- Sample prompt components
INSERT INTO prompt_components (category, value, description, is_default, order_index)
VALUES
  ('style', 'photorealistic', 'Creates realistic photo-like images', true, 1),
  ('style', 'anime', 'Japanese animation style', false, 2),
  ('lighting', 'golden hour', 'Warm sunset lighting', true, 1),
  ('lighting', 'studio lighting', 'Professional photography lighting', false, 2);