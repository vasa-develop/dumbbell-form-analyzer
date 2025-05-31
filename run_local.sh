#!/bin/bash


echo "🏋️  Starting Dumbbell Curl Form Analyzer (Local Benchmark Version)"
echo "=================================================="

if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry not found. Please install Poetry first:"
    echo "   curl -sSL https://install.python-poetry.org | python3 -"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first"
    exit 1
fi

echo "✅ Dependencies check passed"
echo ""

echo "📦 Installing backend dependencies..."
cd backend
if ! poetry install; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
if ! npm install; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo ""
echo "🚀 Starting servers..."
echo ""
echo "Backend will start at: http://localhost:8000"
echo "Frontend will start at: http://localhost:5173"
echo ""
echo "⚠️  Keep this terminal open and start the frontend in a new terminal:"
echo "   cd frontend && npm run dev"
echo ""
echo "📱 Then open http://localhost:5173 in your browser"
echo ""

echo "🔧 Starting backend server..."
cd backend
poetry run fastapi dev app/main.py
