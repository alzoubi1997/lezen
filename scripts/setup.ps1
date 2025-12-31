# PowerShell setup script for Windows

Write-Host "Setting up NT2 Lezen Training App..." -ForegroundColor Green

# Generate Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init

# Seed database
Write-Host "Seeding database..." -ForegroundColor Yellow
npm run db:seed

Write-Host "Setup complete!" -ForegroundColor Green

