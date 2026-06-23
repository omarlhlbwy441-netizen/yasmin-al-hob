# 🌸 ياسمين دارك تكنولوجي (Yasmin Dark Tech)

منصة بناء المشاريع البرمجية بالذكاء الاصطناعي - 500+ وكيل برمجي متوازي

## 🎨 التصميم
- **الألوان**: أخضر غامق (Emerald 900) + فضي معدني
- **الواجهات**: زجاجية (Glassmorphism) بخلفيات رخامية
- **الأزرار**: كريستالية عائمة (Floating Crystal)
- **الشعار**: وحش هيكل عظمي (Dark Tech Skeleton)

## 🏗️ الهيكل
```
yasmin-dark-tech/
├── apps/
│   ├── api/          # FastAPI Backend + 7 Agents
│   └── web/          # Next.js Frontend
├── docker/           # Docker configs
└── scripts/          # Setup scripts
```

## 🚀 التشغيل
```bash
# Docker (موصى)
docker-compose up --build

# أو محلياً
cd apps/api && uvicorn main:app --reload
cd apps/web && npm run dev
```

## 📄 API
| Endpoint | الوصف |
|----------|-------|
| `/api/health` | فحص الحالة |
| `/api/auth/*` | المصادقة |
| `/api/projects/*` | المشاريع |
| `/api/agents/*` | الوكلاء |
| `/ws` | WebSocket |

## 🐳 Docker
```bash
docker build -f docker/Dockerfile.api -t yasmin-api .
docker build -f docker/Dockerfile.web -t yasmin-web .
```
