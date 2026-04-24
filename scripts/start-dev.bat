@echo off
REM Hybrid Encryption - Local Development Startup Script for Windows
REM Usage: start-dev.bat

echo.
echo 🚀 Hybrid Encryption - Local Development Setup
echo ═══════════════════════════════════════════════
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not in PATH.
    echo    Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is installed
echo.

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker Compose is not installed.
        pause
        exit /b 1
    )
)

echo 📦 Starting MongoDB container...
docker-compose up -d mongodb

if errorlevel 1 (
    echo ❌ Failed to start MongoDB container
    pause
    exit /b 1
)

echo ⏳ Waiting for MongoDB to be ready...
timeout /t 5 /nobreak

echo ✅ MongoDB is running on localhost:27017
echo.

REM Check if backend .env exists
if exist "backend\.env" (
    echo 🌱 Initializing database with sample data...
    cd backend
    node ..\scripts\init-db.js
    if errorlevel 1 (
        echo ⚠️  Database initialization warning (continuing anyway)
    )
    cd ..
    echo.
) else if exist "backend\.env.local" (
    echo 🌱 Initializing database with sample data...
    cd backend
    node ..\scripts\init-db.js
    if errorlevel 1 (
        echo ⚠️  Database initialization warning (continuing anyway)
    )
    cd ..
    echo.
) else (
    echo ⚠️  No .env file found in backend\
    echo    Please copy .env.local to .env or create .env with:
    echo    MONGODB_URI=mongodb://localhost:27017/hybrid-encryption
    echo.
)

echo ═══════════════════════════════════════════════
echo ✨ Setup complete! You can now:
echo.
echo 1️⃣  In Terminal 1 - Start Backend:
echo    cd backend ^&^& npm run dev
echo.
echo 2️⃣  In Terminal 2 - Start Frontend:
echo    cd frontend ^&^& npm run dev
echo.
echo 3️⃣  Open in Browser:
echo    http://localhost:5173
echo.
echo 4️⃣  MongoDB runs on:
echo    mongodb://localhost:27017
echo.
echo 📌 To stop MongoDB later:
echo    docker-compose down
echo.
echo 📌 To view MongoDB logs:
echo    docker-compose logs -f mongodb
echo.
echo Press any key to close this window...
pause >nul
