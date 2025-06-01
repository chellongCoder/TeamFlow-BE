<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->



Let me create a README file for this project:

Ran tool

Read file: README.md

Search files...

Read file: prisma/schema.prisma
Now I'll create a comprehensive README file for the Startup Collaboration App project:

Read file: src/core/index.ts

Ran tool



Ran tool
Here's a comprehensive README file for your Startup Collaboration App:

# Startup Collaboration App

A lightweight version of Notion + Slack for startup teams built with NestJS, Prisma, and Supabase.

## Architecture Overview

This project implements a **Feature-based Modular Architecture** with elements of **Clean Architecture** and **Hexagonal Architecture** (Ports & Adapters). This approach ensures a highly maintainable, testable, and scalable codebase.

### Key Architectural Principles

- **Separation of Concerns**: Clear boundaries between business logic and infrastructure
- **Dependency Inversion**: Core business logic remains independent of external frameworks
- **Domain-Driven Design**: Organization around business domains rather than technical concerns
- **Testability**: Easy isolation of components for testing

### Architecture Layers

1. **Core/Domain Layer** - Contains business entities and rules
2. **Use Cases Layer** - Application-specific business logic
3. **Interface Adapters Layer** - Presenters, controllers, and gateways
4. **Infrastructure Layer** - External frameworks, databases, and services

### Technology Stack

- **NestJS**: Progressive Node.js framework with built-in support for TypeScript
- **Prisma**: Type-safe ORM for database access
- **Supabase**: Backend-as-a-Service for authentication, storage and realtime features
- **PostgreSQL**: Relational database (managed by Supabase)
- **TypeScript**: Strongly-typed programming language

## Project Structure

```
📁 startup-collab-app/
├── 📁 src/
│   ├── 📁 core/                  # Core application foundation
│   │   ├── config/               # Environment configuration
│   │   ├── decorators/           # Custom decorators for roles and auth
│   │   ├── guards/               # Authentication guards using Supabase JWT
│   │   ├── interceptors/         # Response transformation and error handling
│   │   └── supabase/             # Supabase client provider
│   │
│   ├── 📁 modules/               # Feature modules
│   │   ├── auth/                 # Authentication and user profiles
│   │   ├── teams/                # Team management
│   │   ├── projects/             # Project management
│   │   ├── tasks/                # Task board functionality
│   │   ├── chat/                 # Real-time messaging
│   │   ├── storage/              # File upload and management
│   │   └── notifications/        # Real-time notifications
│   │
│   ├── 📁 integrations/          # External API integrations
│   │   ├── github/               # GitHub integration for tasks
│   │   └── slack/                # Slack messaging integration
│   │
│   ├── 📁 prisma/                # Database layer
│   │   ├── schema.prisma         # Prisma schema definition
│   │   └── prisma.service.ts     # Prisma client service
│   │
│   ├── app.module.ts             # Main application module
│   └── main.ts                   # Application entry point
│
├── 📁 supabase/                  # Supabase configurations
│   ├── migrations/               # SQL migrations
│   ├── functions/                # Edge functions
│   └── seed/                     # Seed data
│
├── 📁 test/                      # Testing
└── ... (config files)
```

## Core Module

The `core` module provides essential capabilities used across the application:

- **Config**: Environment configuration management using NestJS ConfigModule
- **Decorators**: Custom decorators for roles, public routes, and current user
- **Guards**: JWT authentication and role-based authorization
- **Interceptors**: Standardized response formats and error handling
- **Supabase**: Client provider for Supabase services

## Feature Modules

Each feature module follows a consistent structure:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic and orchestrate data flow
- **DTOs**: Define data transfer objects for validation
- **Entities**: Define domain models
- **Repositories**: Interface with the database through Prisma

## Authentication Flow

The application uses Supabase Auth for secure authentication:

1. User signs up/in via Supabase Auth
2. Supabase returns JWT token
3. Token is included in subsequent API requests
4. JwtAuthGuard validates tokens using Supabase
5. RolesGuard enforces role-based permissions

## Data Storage Strategy

- **Prisma ORM**: Provides type-safe database access
- **Supabase PostgreSQL**: Cloud-hosted database with RLS
- **Row-Level Security**: Database-level access control
- **Migrations**: Managed through Prisma and version-controlled

## Realtime Features

- **Chat**: Implemented using Supabase Realtime subscriptions
- **Notifications**: Realtime updates through database listeners

## Development Workflow

1. Setup local environment with Supabase CLI and Prisma
2. Create database migrations for schema changes
3. Implement business logic in services and controllers
4. Test with Jest (unit tests) and Supertest (e2e tests)
5. Deploy using CI/CD pipeline

## Getting Started

### Prerequisites

- Node.js (>= 14.x)
- npm or yarn
- Supabase account and CLI
- PostgreSQL (local or Docker)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (copy from .env.example)
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

[http://localhost:3000/docs](http://localhost:3000/docs)

### Environment Variables

Critical environment variables:

```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

## Features

The application includes the following key features:

1. **User Authentication**
   - Email/password login
   - OAuth options (Google, GitHub)
   - User profiles

2. **Team & Project Management**
   - Create and join teams
   - Manage projects within teams
   - Role-based access control

3. **Task Board**
   - Kanban-style task management
   - Task assignments and deadlines
   - Priority and status tracking

4. **Realtime Chat**
   - Team and project chat rooms
   - Direct messaging
   - File sharing in conversations

5. **File Storage**
   - Upload and manage files
   - Attach files to tasks and messages
   - Image previews

6. **Notifications**
   - Real-time notifications
   - Email notifications for important events

7. **External Integrations**
   - GitHub issues import
   - Slack messaging

# Chat Module

A comprehensive real-time chat system built with NestJS, WebSockets, and Supabase, featuring end-to-end security and scalability.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Security Features](#security-features)
4. [Implementation Steps](#implementation-steps)
5. [API Documentation](#api-documentation)
6. [Client Integration](#client-integration)
7. [Configuration](#configuration)
8. [Deployment](#deployment)

## Architecture Overview

The chat system follows a layered architecture pattern:
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Client Apps │ │ Mobile Apps │ │ Web Apps │
└─────────────────┘ └─────────────────┘ └─────────────────┘
│ │ │
└───────────────────────┼───────────────────────┘
│
┌─────────────────┐
│ Load Balancer │
└─────────────────┘
│
┌─────────────────┐
│ NestJS Server │
│ (WebSocket) │
└─────────────────┘
│
┌───────────────────────┼───────────────────────┐
│ │ │
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Supabase DB │ │ Redis Cache │ │ File Storage │
│ (PostgreSQL) │ │ (Rate Limiting) │ │ (Messages) │
└─────────────────┘ └─────────────────┘ └─────────────────┘