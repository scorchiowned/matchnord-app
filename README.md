# MatchNord Tournament Software

A comprehensive tournament management system consisting of two main applications:

## Architecture

- **matchnord-extranet**: Backend API and admin interface for tournament management
- **matchnord-app**: Public frontend application for viewing tournaments and live scores
- **PostgreSQL**: Database for storing tournament data

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual Development Setup

```bash
# Start database
docker-compose up -d postgres

# Start extranet (Terminal 1)
cd matchnord-extranet
npm install
npm run dev

# Start public app (Terminal 2)
cd matchnord-app
npm install
npm run dev
```

## Services

- **PostgreSQL**: http://localhost:5434
- **MatchNord Extranet**: http://localhost:3000
- **MatchNord App**: http://localhost:3001

## Documentation

- [Docker Setup Guide](./DOCKER_SETUP.md)
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Project Structure

```
tournament_software/
├── matchnord-extranet/     # Backend API and admin interface
├── matchnord-app/          # Public frontend application
├── docker-compose.yml      # Docker orchestration
├── DOCKER_SETUP.md         # Docker setup documentation
└── README.md              # This file
```