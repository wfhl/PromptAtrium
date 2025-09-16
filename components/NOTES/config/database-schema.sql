-- Notes Application Database Schema
-- Compatible with PostgreSQL, MySQL, and SQLite (with minor adjustments)

-- Users table (optional - if you need user management)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    auth_provider VARCHAR(50) DEFAULT 'local',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, markdown, code, todo, html
    folder VARCHAR(255) DEFAULT 'Unsorted',
    tags JSON DEFAULT '[]', -- Store as JSON array of strings
    color VARCHAR(7), -- Hex color code
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    parent_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete support
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_notes_user_id (user_id),
    INDEX idx_notes_folder (folder),
    INDEX idx_notes_is_pinned (is_pinned),
    INDEX idx_notes_is_archived (is_archived),
    INDEX idx_notes_created_at (created_at),
    INDEX idx_notes_deleted_at (deleted_at)
);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50), -- Icon name/identifier
    parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY unique_user_folder (user_id, name),
    
    -- Indexes
    INDEX idx_folders_user_id (user_id),
    INDEX idx_folders_parent_id (parent_id)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7), -- Primary color
    text_color VARCHAR(7), -- Text color
    border_color VARCHAR(7), -- Border color
    background_color VARCHAR(7), -- Background color
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY unique_user_tag (user_id, name),
    
    -- Indexes
    INDEX idx_tags_user_id (user_id),
    INDEX idx_tags_name (name)
);

-- Note attachments table (optional - for file attachments)
CREATE TABLE IF NOT EXISTS note_attachments (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size INTEGER,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_attachments_note_id (note_id)
);

-- Note versions table (optional - for version history)
CREATE TABLE IF NOT EXISTS note_versions (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    version_number INTEGER NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY unique_note_version (note_id, version_number),
    
    -- Indexes
    INDEX idx_versions_note_id (note_id)
);

-- Note shares table (optional - for sharing features)
CREATE TABLE IF NOT EXISTS note_shares (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL,
    shared_by VARCHAR(255) NOT NULL,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    permissions VARCHAR(50) DEFAULT 'read', -- read, write
    password_hash VARCHAR(255), -- Optional password protection
    expires_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_shares_note_id (note_id),
    INDEX idx_shares_token (share_token),
    INDEX idx_shares_expires_at (expires_at)
);

-- User preferences table (optional)
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(255) PRIMARY KEY,
    theme VARCHAR(20) DEFAULT 'light',
    default_note_type VARCHAR(50) DEFAULT 'text',
    default_folder VARCHAR(255) DEFAULT 'Unsorted',
    view_mode VARCHAR(20) DEFAULT 'masonry',
    sort_order VARCHAR(50) DEFAULT 'last_modified_desc',
    editor_settings JSON,
    keyboard_shortcuts JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log table (optional - for tracking changes)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- created, updated, deleted, shared, etc.
    entity_type VARCHAR(50) NOT NULL, -- note, folder, tag
    entity_id INTEGER NOT NULL,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_audit_user_id (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created_at (created_at)
);

-- Full-text search index (PostgreSQL specific)
-- For PostgreSQL, create a text search column and index
ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_notes_search 
ON notes USING gin(search_vector);

-- Update search vector when note changes
CREATE OR REPLACE FUNCTION update_note_search_vector() 
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_note_search 
BEFORE INSERT OR UPDATE ON notes
FOR EACH ROW 
EXECUTE FUNCTION update_note_search_vector();

-- Create default folders for new users
CREATE OR REPLACE FUNCTION create_default_folders()
RETURNS trigger AS $$
BEGIN
    INSERT INTO folders (user_id, name, icon, is_default, position)
    VALUES 
        (NEW.id, 'Personal', 'user', TRUE, 1),
        (NEW.id, 'Work', 'briefcase', TRUE, 2),
        (NEW.id, 'Archive', 'archive', TRUE, 999);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_defaults
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_folders();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notes_timestamp
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_folders_timestamp
BEFORE UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tags_timestamp
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Sample data (optional - remove in production)
-- INSERT INTO users (id, email, username) VALUES 
--     ('demo-user', 'demo@example.com', 'demo');

-- INSERT INTO folders (user_id, name, icon, color) VALUES 
--     ('demo-user', 'Ideas', 'lightbulb', '#fbbf24'),
--     ('demo-user', 'Projects', 'folder', '#3b82f6');

-- INSERT INTO tags (user_id, name, color, text_color, background_color) VALUES 
--     ('demo-user', 'important', '#ef4444', '#ffffff', '#fef2f2'),
--     ('demo-user', 'todo', '#f59e0b', '#ffffff', '#fef3c7'),
--     ('demo-user', 'completed', '#10b981', '#ffffff', '#ecfdf5');

-- INSERT INTO notes (user_id, title, content, type, folder, tags) VALUES 
--     ('demo-user', 'Welcome to Notes!', 'This is your first note. Start organizing your thoughts!', 'text', 'Personal', '["important"]'),
--     ('demo-user', 'Shopping List', '○ Milk\n○ Bread\n○ Eggs\n○ Coffee', 'todo', 'Personal', '["todo"]');