#!/bin/bash

# Quick deployment setup script for Mac/Linux
# Usage: bash QUICK_DEPLOY.sh

echo "🚀 Mental Health App - Quick Deployment Setup"
echo ""

# Step 1: Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Install from https://git-scm.com"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "✅ Git and Node.js found"
echo ""

# Step 2: Setup environment files
echo "📝 Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
    echo "   → Edit with your Supabase keys and API credentials"
else
    echo "✅ backend/.env already exists"
fi

if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local"
    echo "   → Edit with your API URLs"
else
    echo "✅ .env.local already exists"
fi

echo ""

# Step 3: Install dependencies
echo "📦 Installing dependencies..."

cd backend
echo "Installing backend dependencies..."
npm install --legacy-peer-deps

cd ..
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

echo ""
echo "✅ Dependencies installed"
echo ""

# Step 4: Initialize git
if [ ! -d ".git" ]; then
    echo "🔗 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Mental Health Support app"
    echo "✅ Git initialized"
    echo ""
    echo "⚠️  Next: Push to GitHub"
    echo "   Create a repo at https://github.com/new"
    echo "   Then run:"
    echo "   git remote add origin https://github.com/yourusername/repo-name.git"
    echo "   git push -u origin main"
else
    echo "✅ Git repository already initialized"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Edit backend/.env with your Supabase credentials"
echo "2. Edit .env.local with your API URL"
echo "3. Test locally: npm run dev (frontend) and cd backend && npm run dev (backend)"
echo "4. Push to GitHub"
echo "5. Follow RENDER_SETUP.md and VERCEL_SETUP.md"
echo ""
