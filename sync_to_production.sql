-- SQL Script to Synchronize Development Data to Production
-- Generated on 2025-09-11
-- WARNING: This will replace all data in the specified tables with development data
-- Please backup your production database before running these commands

-- Step 1: Clear existing data from production tables
DELETE FROM categories;
DELETE FROM intended_generators;
DELETE FROM prompt_styles;
DELETE FROM prompt_types;
DELETE FROM recommended_models;

-- Step 2: Insert Categories data
INSERT INTO categories (id, name, description, user_id, type, is_active, created_at, updated_at) VALUES
('40ab358a-0db8-41c0-bc7f-73141cde77ca', 'Virtual Influencer', '', '40785157', 'user', true, '2025-09-10 22:32:49.69689', '2025-09-10 22:32:49.69689'),
('cat_1', 'Art & Design', 'Visual arts and design prompts', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('cat_2', 'Photography', 'Photography-related prompts', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('cat_3', 'Character Design', 'Character creation and design prompts', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('cat_4', 'Landscape', 'Landscape and scenery prompts', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('cat_5', 'Logo & Branding', 'Logo design and branding prompts', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('cat_6', 'Abstract', 'Abstract art and concepts', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('cat_7', 'Other', 'Miscellaneous prompts', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575');

-- Step 3: Insert Intended Generators data
INSERT INTO intended_generators (id, name, description, user_id, type, is_active, created_at, updated_at) VALUES
('47d18f74-dbcd-4797-b94c-c3cd182099b2', 'Forge', '', '40785157', 'user', true, '2025-09-11 13:56:00.089747', '2025-09-11 13:56:00.089747'),
('9fad887d-2b7e-4db1-926d-f759fe9ee3c0', 'ComfyUI', '', '40785157', 'user', true, '2025-09-11 13:56:11.370045', '2025-09-11 13:56:11.370045'),
('ig_1', 'Midjourney', 'Midjourney AI image generator', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ig_2', 'DALL-E', 'OpenAI DALL-E image generator', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ig_3', 'Stable Diffusion', 'Stable Diffusion image generator', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ig_4', 'Leonardo AI', 'Leonardo AI image generator', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ig_5', 'Adobe Firefly', 'Adobe Firefly creative AI', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ig_6', 'ChatGPT', 'OpenAI ChatGPT text generator', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ig_7', 'Claude', 'Anthropic Claude AI assistant', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ig_8', 'Other', 'Other AI generators', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575');

-- Step 4: Insert Prompt Styles data
INSERT INTO prompt_styles (id, name, description, user_id, type, is_active, created_at, updated_at) VALUES
('d0c7265f-0cef-4caa-9982-c6a0dcd5d52a', 'Pipeline', '', '40785157', 'user', true, '2025-09-10 22:32:59.436359', '2025-09-10 22:32:59.436359'),
('ps_1', 'Detailed', 'Highly detailed and descriptive', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ps_2', 'Simple', 'Simple and straightforward', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ps_3', 'Artistic', 'Artistic and creative style', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ps_4', 'Photorealistic', 'Photorealistic rendering', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ps_5', 'Abstract', 'Abstract and conceptual', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('ps_6', 'Minimalist', 'Minimalist approach', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575');

-- Step 5: Insert Prompt Types data
INSERT INTO prompt_types (id, name, description, user_id, type, is_active, created_at, updated_at) VALUES
('pt_1', 'Text to Image', 'Generate images from text descriptions', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('pt_2', 'Image to Image', 'Transform existing images', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('pt_3', 'Text Generation', 'Generate text content', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('pt_4', 'Code Generation', 'Generate programming code', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('pt_5', 'Creative Writing', 'Creative writing and storytelling', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('pt_6', 'Other', 'Other prompt types', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575');

-- Step 6: Insert Recommended Models data
INSERT INTO recommended_models (id, name, description, user_id, type, is_active, created_at, updated_at) VALUES
('a835181d-96fb-48b3-9428-e8634207047d', 'Flux', '', '40785157', 'user', true, '2025-09-11 13:56:39.069499', '2025-09-11 13:56:39.069499'),
('rm_1', 'GPT-4', 'OpenAI GPT-4 model', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('rm_2', 'Claude-3', 'Anthropic Claude 3 model', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('rm_3', 'SDXL', 'Stable Diffusion XL model', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('rm_4', 'Midjourney v6', 'Midjourney version 6', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('rm_5', 'DALL-E 3', 'OpenAI DALL-E 3', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('rm_6', 'Stable Diffusion', 'Stable Diffusion base model', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575'),
('rm_7', 'Leonardo AI', 'Leonardo AI models', NULL, 'system', true, '2025-09-10 19:15:23.383575', '2025-09-10 19:15:23.383575');

-- End of synchronization script
-- Note: This script assumes the production database has the same table structure as development