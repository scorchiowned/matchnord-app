# Docker Setup for MatchNord Tournament Software

This document describes how to run the complete MatchNord ecosystem using Docker Compose.

## Architecture

The system consists of three main services:

1. **PostgreSQL Database** (Port 5434)

   - Main database for tournament data
   - Test database (Port 5433) for testing

2. **MatchNord Extranet** (Port 3000)

   - Backend API and admin interface
   - Tournament management system
   - Team registration and management

3. **MatchNord App** (Port 3001)
   - Public frontend application
   - Tournament viewing and live scores
   - Mobile-optimized interface

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 3000, 3001, 5434 available

### Running the Complete Stack

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

### Individual Service Management

```bash
# Start only the database
docker-compose up -d postgres

# Start only the extranet
docker-compose up -d matchnord-extranet

# Start only the public app
docker-compose up -d matchnord-app

# Rebuild and restart a specific service
docker-compose up -d --build matchnord-extranet
```

## Service Details

### PostgreSQL Database

- **Port**: 5434 (main), 5433 (test)
- **Database**: tournament_app
- **User**: postgres
- **Password**: postgres
- **Health Check**: Built-in PostgreSQL health check

### MatchNord Extranet

- **Port**: 3000
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Environment Variables**:
  - `DATABASE_URL`: Automatically configured
  - `NEXTAUTH_URL`: http://localhost:3000
  - `NEXTAUTH_SECRET`: your-secret-key-here (change in production)

### MatchNord App

- **Port**: 3001
- **URL**: http://localhost:3001
- **Health Check**: http://localhost:3001
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: http://localhost:3000

## Development Workflow

### First Time Setup

1. **Start the database**:

   ```bash
   docker-compose up -d postgres
   ```

2. **Run database migrations** (from matchnord-extranet directory):

   ```bash
   cd matchnord-extranet
   npm run prisma:migrate
   npm run prisma:seed
   ```

3. **Start all services**:
   ```bash
   docker-compose up -d
   ```

### Development with Hot Reload

For development with hot reload, run the services locally:

```bash
# Terminal 1: Database
docker-compose up -d postgres

# Terminal 2: Extranet (from matchnord-extranet directory)
cd matchnord-extranet
npm run dev

# Terminal 3: Public App (from matchnord-app directory)
cd matchnord-app
npm run dev
```

### Building for Production

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build matchnord-extranet
```

## Environment Configuration

### Production Environment Variables

Create `.env.production` files in each project directory:

**matchnord-extranet/.env.production**:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/tournament_app
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key
```

**matchnord-app/.env.production**:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, and 5434 are available
2. **Database connection issues**: Wait for PostgreSQL to be healthy before starting other services
3. **Build failures**: Check Docker logs with `docker-compose logs [service-name]`

### Health Checks

```bash
# Check service health
docker-compose ps

# Check specific service logs
docker-compose logs matchnord-extranet
docker-compose logs matchnord-app

# Test health endpoints
curl http://localhost:3000/api/health
curl http://localhost:3001
```

### Database Management

```bash
# Access database shell
docker-compose exec postgres psql -U postgres -d tournament_app

# Reset database
docker-compose down -v
docker-compose up -d postgres
# Then run migrations again
```

## Monitoring

### Service Status

```bash
# View all services
docker-compose ps

# View resource usage
docker stats
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f matchnord-extranet
docker-compose logs -f matchnord-app
```

## Security Notes

- Change default passwords in production
- Use proper secrets management
- Configure proper CORS settings
- Use HTTPS in production
- Regularly update base images

## Performance Tuning

- Adjust memory limits in docker-compose.yml if needed
- Use multi-stage builds for smaller images
- Consider using Docker volumes for better performance
- Monitor resource usage with `docker stats`

