-- Initialize the database with any custom settings
-- This file runs when the PostgreSQL container starts for the first time

-- Enable some useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Set timezone to UTC
SET timezone = 'UTC';
