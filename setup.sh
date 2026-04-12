#!/bin/bash
# SPS Development Setup Script

echo "🚀 SPS - Setup Script"
echo "===================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/en/"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"
echo "✅ npm found: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create .env.local
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your Firebase credentials"
else
    echo "✅ .env.local already exists"
fi

# Create public/icons directory
if [ ! -d "public/icons" ]; then
    echo "📁 Creating icons directory..."
    mkdir -p public/icons
    echo "⚠️  Add your PWA icons to public/icons/"
fi

# Create public/screenshots directory
if [ ! -d "public/screenshots" ]; then
    echo "📁 Creating screenshots directory..."
    mkdir -p public/screenshots
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your Firebase config in src/config.js or .env.local"
echo "2. Add PWA icons to public/icons/ (see PWA_SETUP.md)"
echo "3. Run 'npm run dev' to start development server"
echo ""
echo "For more info, see README.md and PWA_SETUP.md"
