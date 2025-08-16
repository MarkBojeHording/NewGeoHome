# Overview

This project is a Rust-themed tactical map and raid calculator application designed for strategic planning and resource management in the game Rust. It provides players with an interactive map interface, comprehensive raid cost calculations for various material types, and tools for tracking bases, reports, and player activity. The application aims to be a specialized gaming utility to enhance strategic gameplay and resource management.

# User Preferences

Preferred communication style: Simple, everyday language.
IMPORTANT: Only implement exactly what is requested. Do not create mock/fake data or add unrequested features. Ask questions if unclear.

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
- **Reporting System**: Allows creation and display of various reports (e.g., PvP Encounter, Raid Activity), linked to bases via unique IDs. Reports support manual coordinate editing and automatic cascade deletion with base removal.
- **Player Management System**: A comprehensive modal for tracking players with search, online/offline status, and session history. Includes a premium player system with dual creation methods. Player activity is visualized through a heatmap based on session data.
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