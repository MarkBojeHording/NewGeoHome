# Overview

This is a Rust-themed tactical map and raid calculator application built with React, TypeScript, and Node.js. The primary purpose is to provide players with an interactive tactical planning tool featuring an interactive map interface and comprehensive raid cost calculations for different material types. The application appears to be a specialized gaming utility focused on strategic planning and resource management.

## Recent Changes (August 2025)
✓ **Fixed critical "Write report" functionality** - Resolved `setModalType is not defined` error that completely broke report creation
✓ **Restored ActionMenu functionality** - Properly threaded `onOpenReport` props through LocationMarker and SelectedLocationPanel components  
✓ **Enhanced report system reliability** - Report modal now opens correctly from both map markers and selected location panel
✓ **Created BaseReportModal system** - Added separate base report functionality for friendly bases via ActionMenu
✓ **Maintained system separation** - Right-click "Report" creates map icons using existing BaseModal, base reports are separate data-only reports
✓ **Replaced ActionReportModal with general report format** - Base reports now use the same layout as general reports (report type, time, players, notes) but without icon creation
✓ **Maintained existing functionality** - Zero changes to existing code, only additions and bug fixes as requested
✓ **Completed base reports system** - Reports tab shows real database data with base name matching
✓ **Fixed ActionReportModal persistence bug** - Modal now resets form data for each new report instead of retaining previous data
✓ **Implemented proper data saving** - ActionReportModal saves reports to database with React Query integration
✓ **Resolved base matching logic** - Reports now properly match to bases using base names (M7, A1, etc.)
✓ **Multiple report creation confirmed working** - Users can create unlimited reports per base with proper form reset

## Current Features

### Primary Map Feature (2376 lines - main tactical planning interface)
- Interactive tactical map with zoom/pan controls
- Base placement system (friendly/enemy bases with different types)
- Rocket calculator with material cost calculations
- Timer system for tracking raid countdowns
- Location action menus and editing capabilities
- Report tracking system for raid outcomes
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
IMPORTANT: Only implement exactly what is requested. Do not create mock/fake data or add unrequested features. Ask questions if unclear.

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