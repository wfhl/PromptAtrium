-- SQL Script to add NSFW columns to production database
-- Generated on 2025-09-11

-- Add is_nsfw column to prompts table
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT false;

-- Add show_nsfw column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS show_nsfw BOOLEAN DEFAULT true;

-- Note: Default values:
-- is_nsfw defaults to false (existing prompts are not marked as NSFW)
-- show_nsfw defaults to true (users see all content by default)