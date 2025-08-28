# Overview

This project is a Rust-themed tactical map and raid calculator application designed for strategic planning and resource management in the game Rust. It provides players with an interactive map interface, comprehensive raid cost calculations for various material types, and tools for tracking bases, reports, and player activity. The application aims to be a specialized gaming utility to enhance strategic gameplay and resource management.

## Recent Changes (January 2025)
- **Fixed Toolbar Positioning**: Successfully implemented fixed toolbar system with main button toolbar positioned at absolute top of browser viewport (top-0) using CSS fixed positioning with inline style overrides
- **Removed Duplicate Toolbars**: Eliminated moving duplicate toolbar sections that were interfering with map zoom/pan operations
- **Simplified Interface**: Removed [TACTICAL OPERATIONS] branding text for cleaner interface focusing on essential functionality
- **Zoom/Pan Improvements**: Enhanced mouse-cursor-relative zooming with proper pan adjustment and smooth transitions
- **Fixed Base Reports System**: Resolved enemy base report tab display with simplified report previews list and functional "Create New Report" button
- **Enhanced Cache Invalidation**: Fixed report creation workflow to properly invalidate base-specific report queries for immediate display
- **Removed Report Outcomes**: Cleaned up base report previews by removing outcome displays since base reports don't use outcomes
- **Fixed Player Tagging**: Resolved modalType scoping issue in PlayerSearchSelector component for proper player status indicators
- **Restored Base Owner Display**: Fixed base modal initialization to properly display existing base owners from database
- **Implemented Gene Progress System**: Successfully integrated popup-to-main window communication system using postMessage API to sync gene data from calculator popup to progression modal. Features automatic real-time updates and manual sync capability. Displays identical gene information as calculator's "Best 🧬" field with proper gene quality colors and progress percentages.
- **RESOLVED Report Modal ID System Bug**: Fixed critical report ID display issue where reports were showing database sequence numbers (19, 20, 21) instead of proper alphanumeric report IDs (R12ABC3, ROJH1GT). System now properly links map markers to database reports using dual ID system - database integer IDs for API operations and alphanumeric IDs for user display. Report modals now correctly show "Update Report" for existing reports with proper alphanumeric identifiers.
- **RESOLVED Report Update Duplication Bug**: Fixed issue where updating existing reports created duplicate map markers instead of updating in-place. System now correctly uses database reportId for API calls while preserving display functionality.
- **Enhanced Report Player Tagging**: Implemented separate enemy and friendly player storage using comma-separated strings like base owners. Added enemy_players and friendly_players database columns for organized player tracking in reports.
- **FIXED Report Preview Link Consistency**: Resolved critical user feedback issue where report preview links opened ActionReportModal with confusing "Edit Base Report" title instead of using the same modal system as map markers. Report preview links now trigger identical onOpenReport function as map report markers for consistent user experience throughout the application.

# User Preferences

Preferred communication style: Simple, everyday language.
IMPORTANT: Only implement exactly what is requested. Do not create mock/fake data or add unrequested features. Ask questions if unclear.
CRITICAL RULE: When user says "do not change" something, that command must be followed exactly - no modifications whatsoever to that code/component/functionality.

## Development Rules (Updated)
- **Layout Constraints**: Avoid flex containers for modals and containers as they are hard to modify locations of
- **Scope Control**: Do not make extra changes outside the scope of what is being asked. If an extra task or feature seems like a good idea, ask first
- **Targeted Changes**: Avoid making changes to other modals or modules other than the ones being targeted for change. If changes affect multiple components, inform user first
- **Space Efficiency**: Avoid extra containers and dead space when making modals, screens or similar. Minimize margins and unnecessary spacing
- **No Wrapper Containers**: Never create wrapper containers as they cause confusion in development

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Framework**: Shadcn/ui components built on Radix UI for consistent design.
- **Styling**: Tailwind CSS with CSS variables and PostCSS.
- **State Management**: React Query for server state.
- **Routing**: Wouter for client-side routing.
- **Form Management**: React Hook Form with Zod validation.

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Development**: tsx for hot reloading.
- **Build**: esbuild for production bundling.
- **Storage Interface**: Abstracted storage layer with in-memory implementation.

## Data Storage Solutions
- **Database**: PostgreSQL via Drizzle ORM.
- **Schema Management**: Drizzle Kit for migrations.
- **Connection**: Neon Database serverless driver.
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions.

## Authentication and Authorization
- **User Schema**: Basic username/password authentication.
- **Session Handling**: Express sessions with PostgreSQL session store.
- **Validation**: Zod schemas for input validation.

## Core Features
- **Interactive Tactical Map**: Features zoom/pan, base placement (friendly/enemy), rocket calculator, timers, location action menus, and report tracking. Includes a 26x26 grid system (A0-Z25) aligned with an authentic Rust game map.
- **Base Management**: Comprehensive BaseModal for detailed base information, including rocket and ammo calculations, upkeep tracking, base types, and heat map integration for activity visualization. Supports duplicate base naming (e.g., A1, A1(2)).
- **Centralized Reporting System**: Unified report architecture supporting 3 types (general, base, action) with consistent data model. Reports use proper array-based player and base tagging, replacing old comma-separated strings. Features unified ReportPreview component for consistent display across BaseModal and PlayerModal.
- **Player Management System**: A comprehensive modal for tracking players with search, online/offline status, and session history. Includes a premium player system with dual creation methods. Player activity is visualized through a heatmap based on session data. Now features player-specific report filtering using centralized API.
- **Base Grouping & Visualization**: Implements player-based and proximity-based grouping of bases, displaying colored rings and connection lines between main and subordinate bases.
- **User Interface Enhancements**: Features a consistent design with Shadcn/ui, optimized layouts, and visual indicators for various functionalities (e.g., player count circles, content indicators).

# External Dependencies

- **Database Service**: Neon Database (serverless PostgreSQL)
- **Player Data API**: superinfotest.replit.app (for real-time player tracking)
- **Icon System**: Lucide React
- **Date Handling**: date-fns
- **Carousel Components**: Embla Carousel
- **Class Management**: clsx and class-variance-authority
- **Command Interface**: cmdk