# 🌸 Yasmin AI Builder

**Build apps, websites, games, and systems with parallel AI agents.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 20+](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

## 🚀 Features

- 🤖 **Parallel AI Agents** — Frontend, Backend, DevOps, Designer, QA agents working together
- 🌐 **12 Languages** — Full i18n with RTL support (Arabic, Persian, Urdu)
- 📱 **PWA** — Install as app, works offline with background sync
- 💬 **Realtime Chat** — Socket.io chat between agents and users
- 🔔 **Push Notifications** — FCM v1 + OneSignal + Web Push
- 📧 **Email Service** — SendGrid + Resend + SMTP with failover
- 🔍 **Elasticsearch** — Full-text search across all data
- 🔐 **Enterprise Security** — SSO, RBAC, Rate Limiting, CSP, Encryption at rest
- 🤖 **ChatGPT Plugin** — Official OpenAI plugin integration
- 📊 **Analytics Dashboard** — Real-time metrics with Grafana
- 🐳 **Docker Ready** — One command to run everything

## 📁 Project Structure

```
yasmin/
├── backend/          # FastAPI + Python services
├── frontend/         # React PWA
├── docker/           # Docker Compose + configs
├── docs/             # Documentation
└── README.md
```

## 🛠️ Quick Start

### Prerequisites
- Docker & Docker Compose
- Or: Python 3.11+, Node 20+, Redis, PostgreSQL

### With Docker (Recommended)

```bash
# 1. Clone
git clone https://github.com/yourusername/yasmin.git
cd yasmin

# 2. Configure
cp docker/.env.example docker/.env
# Edit docker/.env with your API keys

# 3. Run everything
docker-compose -f docker/docker-compose.yml up -d

# 4. Access
# Frontend:  http://localhost:3000
# API Docs:  http://localhost:8000/docs
# Grafana:   http://localhost:3001
# Prometheus: http://localhost:9090
```

### Without Docker

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm start
```

## 🌍 Supported Languages

| Language | Code | RTL |
|----------|------|-----|
| العربية | ar | ✅ |
| English | en | ❌ |
| Français | fr | ❌ |
| Español | es | ❌ |
| Deutsch | de | ❌ |
| Türkçe | tr | ❌ |
| فارسی | fa | ✅ |
| اردو | ur | ✅ |
| 中文 | zh | ❌ |
| 日本語 | ja | ❌ |
| 한국어 | ko | ❌ |
| Русский | ru | ❌ |

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](docs/CONTRIBUTING.md).

## 📄 License

MIT License — see [LICENSE](LICENSE) file.

## 💜 Built with love by the Yasmin team
