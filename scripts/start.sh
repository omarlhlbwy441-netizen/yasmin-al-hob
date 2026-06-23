#!/bin/bash
echo "🌸 تشغيل ياسمين دارك تكنولوجي..."
docker-compose up --build -d
echo "✅ الخدمات تعمل:"
echo "   🌐 Web:    http://localhost:3000"
echo "   🔌 API:    http://localhost:8000"
echo "   📊 Prometheus: http://localhost:9090"
echo "   🗄️  DB:     localhost:5432"
echo "   💾 Redis:  localhost:6379"
