# Development Guide

## Quick Start with Docker

### 1. Start the Database

```bash
npm run db:up
```

### 2. Set up the Environment

```bash
cp env.example .env.local
# Edit .env.local and add your NEXTAUTH_SECRET
```

### 3. Initialize the Database

```bash
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

### 4. Start Development

```bash
npm run dev
```

## Database Management

### Daily Commands

- `npm run db:up` - Start PostgreSQL (run this when you start working)
- `npm run db:down` - Stop PostgreSQL (optional, when you're done)

### Development Commands

- `npm run db:logs` - View database logs
- `npm run db:reset` - Reset database completely (⚠️ destroys all data)

### Testing

- `npm run test:db:up` - Start test database
- `npm run test:db:down` - Stop test database

## Database Details

### Connection Info

- **Host**: localhost
- **Port**: 5434 (to avoid conflicts with system PostgreSQL)
- **Database**: tournament_app
- **Username**: postgres
- **Password**: postgres

### Test Database

- **Host**: localhost
- **Port**: 5433
- **Database**: tournament_app_test
- **Username**: postgres
- **Password**: postgres

### Connecting with psql

```bash
# Main database
psql -h localhost -p 5434 -U postgres -d tournament_app

# Test database (when running)
psql -h localhost -p 5433 -U postgres -d tournament_app_test
```

### Connecting with GUI Tools

You can connect using tools like:

- pgAdmin
- DBeaver
- TablePlus
- DataGrip

Use the connection details above.

## Docker Volumes

Data is persisted in Docker volumes:

- `tournament_software_postgres_data` - Main database data
- `tournament_software_postgres_test_data` - Test database data

To completely remove all data:

```bash
npm run db:down
docker volume rm tournament_software_postgres_data tournament_software_postgres_test_data
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error, either:

1. Stop your local PostgreSQL service
2. Or change the port in `docker-compose.yml` and update `DATABASE_URL` in `.env.local`

### Database Connection Issues

1. Ensure Docker is running
2. Check if the container is up: `docker ps`
3. View logs: `npm run db:logs`
4. Restart: `npm run db:reset`

### Performance Issues

The Docker PostgreSQL is configured for development. For production-like testing, consider:

- Increasing shared_buffers
- Adjusting work_mem
- Tuning other PostgreSQL settings in `docker-compose.yml`
