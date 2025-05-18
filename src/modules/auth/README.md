# Authentication Module

This module handles user authentication, registration, and profile management using Supabase Auth as the backend provider.

## Features

- User registration (signup)
- User login
- JWT authentication
- User profile retrieval

## Architecture

The Auth module follows a standard NestJS modular structure:
- **Controllers**: Handle HTTP requests
- **Services**: Contain business logic
- **DTOs**: Validate request data
- **Interfaces**: Define custom types
- **Strategies**: Implement Passport.js authentication strategies

## Authentication Flow

1. User registers or logs in through the API
2. Credentials are validated and a JWT token is returned
3. Subsequent requests include the JWT token in the Authorization header
4. The JwtAuthGuard validates tokens on protected routes

## Routes

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Authenticate and get a token
- `GET /auth/me` - Get current user profile (protected)

## Configuration

The module uses environment variables for configuration:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `SUPABASE_JWT_SECRET` - Your Supabase JWT secret for token validation

## Dependencies

- @nestjs/passport
- passport-jwt
- @supabase/supabase-js (via SupabaseModule)
- class-validator for DTO validation 