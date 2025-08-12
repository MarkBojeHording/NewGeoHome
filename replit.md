# Overview

This is a Rust-themed tactical map and raid calculator application built with React, TypeScript, and Node.js. The primary purpose is to provide players with an interactive tactical planning tool featuring an interactive map interface and comprehensive raid cost calculations for different material types. The application appears to be a specialized gaming utility focused on strategic planning and resource management.

## Recent Changes (August 2025)
✓ **Implemented Expanded Reporting System** - Three distinct report types with contextual functionality
✓ **General Map Reports** - Right-click anywhere on map to access "Add Report" in context menu
✓ **Base-Specific Reports** - Click any base and use "Add Report" button for contextual dropdown options  
✓ **Central Report Library** - Comprehensive system for storing and recalling report information
✓ **Enhanced TypeScript Integration** - Fixed all type errors and improved component organization
✓ **Contextual Report Options** - Different dropdown options for friendly vs enemy bases
✓ **Report Modal Component** - Comprehensive form with player management, notes, timestamps, and outcomes

## Current Features

### Primary Map Feature (2376 lines - main tactical planning interface)
- Interactive tactical map with zoom/pan controls
- Base placement system (friendly/enemy bases with different types)
- Rocket calculator with material cost calculations
- Timer system for tracking raid countdowns
- Location action menus and editing capabilities
- **Expanded reporting system with three distinct report types:**
  - **General Reports**: Accessible via right-click context menu anywhere on map
  - **Base Reports**: Contextual reports for specific bases with ownership-based options
  - **Report Library**: Central storage system for information recall
- Grid coordinate system with automatic naming
- Decay calculator for base materials

### Sophisticated BaseModal Component (875 lines - fully restored and optimized)
- Complete rocket calculator with primary/secondary calculations
- Defender quality slider with descriptive feedback
- Advanced ammo calculations (rockets, HV, incendiary, explosive)
- Enemy base types (Main Small/Medium/Large, Flank, Tower, Farm, Decaying)
- Friendly base types (Main, Flank, Farm, Boat, Garage)
- Upkeep tracking system for resource management
- Interactive calculator modal with position tracking
- Grid coordinate auto-generation system
- Heat map integration and advanced panel functionality
- Optimized layout with eliminated dead space and precise spacing controls
- Enhanced enemy modal dimensions (832px width × 1200px height) for scroll-free operation

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: Shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming and PostCSS for processing
- **State Management**: React Query (@tanstack/react-query) for server state with custom query client configuration
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation through @hookform/resolvers

## Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **Development**: tsx for development server with hot reloading
- **Build**: esbuild for production bundling with platform-specific optimizations
- **Storage Interface**: Abstracted storage layer with in-memory implementation (MemStorage)

## Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless driver for PostgreSQL connectivity
- **Session Management**: connect-pg-simple for PostgreSQL-backed session storage

## Authentication and Authorization
- **User Schema**: Basic user model with username/password authentication
- **Session Handling**: Express sessions with PostgreSQL session store
- **Validation**: Zod schemas for input validation and type safety

## External Dependencies
- **Database Service**: Neon Database (serverless PostgreSQL)
- **Development Environment**: Replit-specific tooling and plugins
- **Icon System**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation and formatting
- **Carousel Components**: Embla Carousel for interactive UI elements
- **Class Management**: clsx and class-variance-authority for conditional styling
- **Command Interface**: cmdk for command palette functionality