#!/bin/bash
set -e
echo "🌸 إعداد ياسمين دارك تكنولوجي..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker مطلوب"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose مطلوب"; exit 1; }
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  أنشئ .env وعدل القيم"
fi
docker volume create postgres_data 2>/dev/null || true
echo "✅ الإعداد اكتمل!"
echo "🚀 شغل: docker-compose up --build"
