#!/bin/bash

echo "Setting up NT2 Lezen Training App..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "Seeding database..."
npm run db:seed

echo "Setup complete!"

