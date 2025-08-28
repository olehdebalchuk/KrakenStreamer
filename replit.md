# Overview

This is a real-time cryptocurrency market data dashboard built with React and Express. The application displays live market data from the Kraken cryptocurrency exchange, featuring price tickers, order books, recent trades, and market overviews. The frontend provides an interactive dashboard with real-time updates, while the backend serves as an API gateway to the Kraken public API with data caching and WebSocket support.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming and design tokens

## Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for market data with rate limiting
- **Real-time Communication**: WebSocket server for live market data updates
- **Data Storage**: In-memory storage with interface for future database integration

## Data Storage Solutions
- **Current**: Memory-based storage using Maps for fast data access
- **Schema Management**: Drizzle ORM configured for PostgreSQL (future database integration)
- **Data Validation**: Zod schemas for runtime type validation and API response parsing

## API Architecture
- **External Integration**: Kraken public API for cryptocurrency market data
- **Rate Limiting**: Built-in request throttling (1 request per second) to respect API limits
- **Caching Strategy**: In-memory caching of ticker data, order books, and trade history
- **WebSocket Support**: Real-time data broadcasting to connected clients

## Authentication and Authorization
Currently implements no authentication - all endpoints are publicly accessible. The architecture supports future implementation through middleware patterns.

## Development and Build
- **Development**: Vite dev server with HMR and TypeScript checking
- **Production Build**: Vite for frontend bundling, esbuild for backend compilation
- **Path Aliases**: Configured for clean imports (@/ for client, @shared/ for shared schemas)

# External Dependencies

## Core Technologies
- **React 18**: Frontend framework with concurrent features
- **Express.js**: Backend web application framework
- **TypeScript**: Type safety across the entire stack
- **Vite**: Frontend build tool and development server

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components for accessibility
- **Shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library for consistent iconography

## Data Management
- **TanStack Query**: Server state management and caching
- **Zod**: Runtime schema validation
- **Drizzle ORM**: Type-safe database toolkit (configured for future use)

## External APIs
- **Kraken API**: Public REST API for cryptocurrency market data
- **WebSocket**: Native WebSocket for real-time data streaming

## Development Tools
- **Replit Integration**: Development environment optimizations
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **ESBuild**: Fast JavaScript bundler for production builds

## Database
- **Neon Database**: Serverless PostgreSQL (configured but not actively used)
- **Connection Pooling**: connect-pg-simple for session management (configured for future use)