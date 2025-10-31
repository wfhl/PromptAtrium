# PromptAtrium - AI Prompt Management Platform

## Overview
A comprehensive platform for managing, sharing, and generating AI prompts. Features include a prompt library, community sharing, collections management, and advanced prompt generation tools.

## Recent Updates (October 31, 2025)

### Community Sharing System Fixes
- **Fixed Infinite Loop in Dropdown**: Removed conflicting event handlers (onSelect with preventDefault) in community dropdown checkboxes
- **Fixed Community Tab Visibility**: Community tabs now always show for logged-in users for consistency
- **Fixed Community Display Issue**: Updated CommunityVisibilitySelector to properly fetch and display user's communities
- **Database Fix**: Created prompt_community_sharing table for multi-community prompt sharing
- **API Integration**: Connected visibility updates to properly update both prompt visibility and community sharing

## Recent Updates (October 26, 2025)

### My Activity Tab - Prompt Links Fix
- **Fixed Prompt Name Links**: Made prompt names in the My Activity tab clickable and linked to their respective prompt detail pages at `/prompt/{id}`
- **Consistent Navigation**: Aligned prompt link behavior with user and collection links for consistent user experience
- **Visual Feedback**: Added hover effects to prompt links (underline on hover) for better interactivity

## Recent Updates (October 26, 2025)

### Sub-Community System Implementation
- **Hierarchical Community Structure**: Implemented parent-child relationships for communities with materialized path pattern
- **Sub-Community Admin Roles**: Added new role type with delegated administration capabilities
- **Advanced Permission System**: Created comprehensive RBAC middleware for sub-community access control
- **Invitation System**: Sub-community specific invites with role assignment and usage tracking
- **Content Isolation**: Prompts can be shared with three visibility levels (public, members_only, admins_only)
- **Frontend Management**: Complete UI for browsing, managing, and administering sub-communities
- **Admin Dashboard**: Dedicated dashboard for sub-community administrators with member management
- **Data Migration**: Safe migration system for existing communities to adopt hierarchy structure
- **Test Coverage**: 100% test pass rate on permission and access control scenarios
- **User Documentation**: Comprehensive guide at /docs/sub-communities explaining features for both members and administrators

## Recent Updates (October 19, 2025)

### Custom Character Preset Cross-Device Persistence Fix
- **Fixed API Endpoint Mismatch**: Corrected character preset endpoints in frontend components from `/api/character-presets` to `/api/system-data/character-presets`
- **Affected Components**: Updated QuickPromptPlay.tsx, QuickPrompt.tsx, and CompactCharacterSaveDialog.tsx to use correct endpoints
- **Authentication Integration**: Character presets now properly save with userId for authenticated users, enabling cross-device persistence
- **Consistent Data Access**: Users' custom character presets will now appear across all their devices when logged in

## Recent Updates (September 23, 2025)

### Quick Prompt Component Enhancements
- **Image Analysis Improvements**: Fixed image analysis section to collapse/expand properly without clearing data
- **New Template Options**: Added two special template options to the Enhanced Template dropdown:
  - "Image Vision Analysis Only" - Returns only the image vision analysis results
  - "Social Media Post Caption" - Generates social media captions with tone selection
- **Tone Selector**: When "Social Media Post Caption" is selected, a tone dropdown appears with options like Professional, Casual, Funny, Inspirational, etc.
- **Improved UX**: Image analysis now persists when uploading new images, only collapsing the view rather than clearing the data

## Recent Updates (September 19, 2025)

### Quick Prompt Generator Integration
- Added Quick Prompt Generator tool at `/tools/quick-prompter`
- Integrated components from the QUICKPROMPT package
- Features include:
  - Template-based prompt generation (Photography, Artistic, Cinematic, etc.)
  - Character preset selection with custom input
  - Random scenario generation
  - Prompt enhancement with professional details
  - Social media caption generation
  - Copy to clipboard functionality
  - Save to library with auto-populated metadata

### Quick Prompt Save Enhancements
- **Auto-fill AI Metadata**: Save button now automatically triggers AI-powered name generation
- **Template Information Storage**: Template data is saved with prompts in the promptStyle field
- **Seamless Save Flow**: ShareToLibraryModal automatically generates metadata when opened from quick prompt
- **Fixed API Endpoints**: Corrected API endpoints from /api/saved-prompts to /api/prompts
- **Metadata Generation Endpoint**: Added `/api/generate-prompt-metadata` endpoint for AI-powered metadata generation

## Project Structure

### Frontend (`client/`)
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query v5
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Authentication**: Replit Auth with OIDC

### Backend (`server/`)
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: Google Cloud Storage for images
- **Authentication**: Passport with OIDC strategy

### Key Features

#### 1. Prompt Management
- Create, edit, and organize prompts
- Rich metadata (categories, tags, models)
- Version history and forking
- Public/private visibility controls

#### 2. Community Features
- Public prompt sharing
- Like and favorite system
- User profiles with statistics
- Activity feed

#### 3. Collections
- Organize prompts into collections
- Public/private collections
- Collaborative collections

#### 4. Tools
- **Aspect Ratio Calculator**: Calculate and convert aspect ratios
- **Metadata Analyzer**: Analyze image metadata
- **Quick Prompt Generator**: Advanced prompt generation with templates

#### 5. Admin Features
- User management
- Community management
- System statistics
- Developer tools

## User Preferences
- Dark mode preferred for UI
- Emphasis on visual design with card-based layouts
- Toast notifications for user feedback
- Mobile-responsive design

## Technical Decisions

### Database Schema
- Users table with profile information
- Prompts table with rich metadata
- Collections for organization
- Activity tracking for engagement
- Communities for group collaboration

### API Structure
- RESTful endpoints under `/api`
- Authentication required for user-specific operations
- Public endpoints for community content
- Rate limiting and security measures

### File Storage
- Images stored in Google Cloud Storage
- Public/private bucket separation
- Direct serving with access control

## Development Guidelines

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Async/await for asynchronous operations
- Comprehensive error handling

### Testing
- End-to-end testing with Playwright
- Component testing for critical features
- API endpoint testing

### Security
- Input validation with Zod
- SQL injection prevention with Drizzle ORM
- XSS protection
- CORS configuration
- Rate limiting

## Deployment

The application is configured for deployment on Replit with:
- Automatic HTTPS
- Environment variable management
- PostgreSQL database
- Object storage integration
- Custom domain support

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REPL_ID`: Replit instance identifier
- `REPLIT_DB_URL`: Replit database URL
- Object storage credentials (auto-configured)

## Quick Start

1. The application runs on port 5000
2. Access at `https://[your-repl-name].replit.app`
3. Login with Replit Auth
4. Start creating and sharing prompts!

## Recent Changes

- **September 19, 2025**: Integrated Quick Prompt Generator from QUICKPROMPT package
- Added comprehensive prompt generation tools
- Mock data implementation for templates and character presets
- Full test coverage for Quick Prompter functionality

## Known Issues

- Toast notifications occasionally have timing issues in tests (visual confirmation works)
- Some object storage URLs show fallback warnings in development (non-critical)

## Future Enhancements

- Real-time collaboration on prompts
- AI-powered prompt suggestions
- Advanced search and filtering
- Export/import functionality
- API access for developers
- Mobile app companion