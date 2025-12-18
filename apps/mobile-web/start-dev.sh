#!/bin/bash
# Start mobile web app with correct Node version

cd "$(dirname "$0")"

echo "📦 Using Node 18.20.8..."
export PATH="$HOME/.nvm/versions/node/v18.20.8/bin:$PATH"

node --version
echo "🚀 Starting mobile web app..."
npm run dev

