# PromptAtrium

## Overview

PromptAtrium is a multi-user web application that serves as a central hub for managing, sharing, and refining AI prompts. It combines the structure of a library with the communal energy of a creative platform, allowing users to store, discover, rate, and collaborate on AI prompts. The application supports personal and shared prompt libraries, advanced metadata management, community features like ratings and favorites, project/collection organization, and comprehensive NSFW content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Comprehensive shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation through @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with role-based access control
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Development**: Hot module replacement with Vite in development mode

### Database Architecture
- **Database**: PostgreSQL (Neon) managed by Replit
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema**: Centralized schema in `/shared/schema.ts` with relations for users, prompts, projects, collections, ratings, and favorites
- **Migrations**: Drizzle Kit for schema migrations with PostgreSQL dialect
- **Connection**: Neon serverless driver with WebSocket support for development

### Project Structure
- **Monorepo**: Single repository with separate client, server, and shared directories
- **Client**: React application in `/client` with component-based architecture
- **Server**: Express API server in `/server` with modular route handling
- **Shared**: Common types, schemas, and utilities in `/shared` for type safety across frontend and backend
- **Build**: Separate build processes for client (Vite) and server (esbuild)

### Authentication & Authorization
- **Provider**: Replit Auth (built-in) with OpenID Connect discovery
- **Strategy**: Passport.js OpenID Client strategy for authentication flow
- **Session**: Secure HTTP-only cookies with PostgreSQL session store
- **Authorization**: Role-based access control with user, moderator, and admin roles
- **Security**: CSRF protection, secure cookie settings, and environment-based configuration

### API Design
- **Structure**: RESTful endpoints with consistent error handling
- **Routes**: Organized by resource type (auth, prompts, projects, collections)
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error middleware with structured error responses
- **Logging**: Request/response logging with timing and JSON response capture

### NSFW Content Management
- **Database Schema**: Prompts have `is_nsfw` boolean field (default false), Users have `show_nsfw` preference (default true)
- **Content Filtering**: Backend automatically filters NSFW prompts based on user preferences across all endpoints
- **User Controls**: Toggle in profile settings to show/hide NSFW content, checkbox in prompt creation/edit forms
- **Bulk Import**: CSV import supports NSFW field for marking content during bulk operations
- **Default Behavior**: Users see all content by default, must opt-out of NSFW content visibility

### AI-Powered Features
- **AI Provider**: Google Gemini (migrated from OpenAI for better quotas and vision capabilities)
- **Models Used**: Gemini 1.5 Pro for complex analysis and vision tasks, Gemini 1.5 Flash for quick metadata generation
- **Image Extraction**: Extract prompts from uploaded images with three modes (content only, content + name, all fields)
- **Auto-Fill**: Generate metadata from existing prompt content (name only or comprehensive metadata)
- **Field Analysis**: Intelligent CSV/JSON field mapping for bulk imports using AI analysis

## External Dependencies

### Development Tools
- **Replit Integration**: Vite plugins for Replit development environment and error overlays
- **TypeScript**: Full TypeScript support with strict configuration
- **Build Tools**: Vite for frontend, esbuild for backend production builds
- **Development Server**: Integrated Vite dev server with Express middleware

### UI Framework
- **shadcn/ui**: Complete component library with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant styling utilities

### Backend Services
- **Neon Database**: Serverless PostgreSQL with WebSocket support
- **Replit Auth**: Integrated authentication service with OpenID Connect
- **Session Storage**: PostgreSQL-backed session management
- **WebSocket**: ws library for Neon database connections

### Runtime Dependencies
- **Express.js**: Web application framework with middleware support
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **Drizzle ORM**: Type-safe database operations with PostgreSQL support
- **TanStack Query**: Client-side data fetching and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for TypeScript