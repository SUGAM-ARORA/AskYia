# 🚀 Quick Start Guide

## One-Command Startup

### Windows:
```bash
start.bat
```

### Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

## What This Does

1. ✅ Checks Docker is running
2. 🛑 Stops any existing containers
3. 🔨 Builds all containers (Frontend, Backend, PostgreSQL, ChromaDB)
4. 🚀 Starts all services
5. 🌱 Initializes database with default users

## Access URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8001 |
| **API Docs** | http://localhost:8001/docs |
| **PostgreSQL** | localhost:5432 |
| **ChromaDB** | http://localhost:8000 |

## 👤 Default Login Credentials

### Admin User
- **Email:** admin@askyia.com
- **Password:** admin123

### Test User
- **Email:** test@askyia.com
- **Password:** test123

## 🎯 First Steps

1. **Open Frontend:** http://localhost:5173
2. **Login** with admin credentials
3. **Create a Stack:** Click "+ New Stack"
4. **Build Workflow:** Drag nodes from sidebar
5. **Configure Nodes:** Click ⚙️ on each node
6. **Connect Nodes:** Drag from handle to handle
7. **Chat:** Click 💬 to test your workflow

## 📝 Useful Commands

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View frontend logs only
docker-compose logs -f frontend

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Remove all data (including database)
docker-compose down -v
```

## 🔧 Configuration

### Add Your API Keys

Edit `backend/.env`:
```env
OPENAI_API_KEY=your-key-here
SERPAPI_API_KEY=your-key-here
```

Then restart:
```bash
docker-compose restart backend
```

## 🐛 Troubleshooting

### Docker Not Running
```bash
# Make sure Docker Desktop is running
docker --version
```

### Port Already in Use
Edit `docker-compose.yml` to change ports:
```yaml
ports:
  - "5174:5173"  # Change 5173 to 5174
```

### Reset Everything
```bash
docker-compose down -v
docker system prune -a
./start.sh
```

## 📚 Documentation

- [Complete README](README.md) - Full documentation
- [Frontend Guide](frontend/QUICKSTART.md) - Detailed UI guide
- [Sample Workflows](frontend/SAMPLE_WORKFLOWS.md) - Example workflows
- [API Docs](http://localhost:8001/docs) - Interactive API docs (when running)

## 🎨 Features

### Frontend
- ✅ Visual workflow builder
- ✅ 5 node types (Input, LLM, Knowledge Base, Web Search, Output)
- ✅ Inline node configuration
- ✅ Chat interface
- ✅ Stack management

### Backend
- ✅ FastAPI REST API
- ✅ PostgreSQL database
- ✅ JWT authentication
- ✅ OpenAI integration
- ✅ Document processing
- ✅ Vector storage (ChromaDB)

## 🚀 Next Steps

1. **Add API Keys** in backend/.env
2. **Create Your First Stack**
3. **Build a Workflow**
4. **Test with Chat**
5. **Deploy to Production** (see full README)

---

Need help? Check the [Full Documentation](README.md) or [Create an Issue](https://github.com/SUGAM-ARORA/AskYia/issues)
