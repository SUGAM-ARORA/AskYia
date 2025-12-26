# 🎉 Backend + Docker Setup Complete!

## ✅ What's Been Done

### 1. Backend Setup
- ✅ Created database seed script with default users
- ✅ Added environment configuration files
- ✅ Updated backend Dockerfile for development
- ✅ Fixed authentication flow

### 2. Docker Compose
- ✅ Created complete docker-compose.yml
- ✅ Services: PostgreSQL, ChromaDB, Backend, Frontend
- ✅ Automatic database initialization
- ✅ Health checks for all services
- ✅ Persistent volumes

### 3. Startup Scripts
- ✅ `start.bat` - Windows one-click startup
- ✅ `start.sh` - Linux/Mac one-click startup
- ✅ Automatic service orchestration

### 4. Frontend Integration
- ✅ Updated API service to connect to backend
- ✅ JWT token management with localStorage
- ✅ Automatic token injection in requests
- ✅ Environment variable configuration

## 🚀 How to Start Everything

### Option 1: Docker Compose (Recommended)

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

This will start ALL services in Docker containers:
- PostgreSQL database
- ChromaDB vector store
- Backend API
- Frontend app

### Option 2: Local Development (No Docker)

**Note:** You'll need to have PostgreSQL and ChromaDB running separately.

**Windows:**
```bash
start-local.bat
```

**Linux/Mac:**
```bash
chmod +x start-local.sh
./start-local.sh
```

## 🌐 Access the Application

After running the startup script:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React UI |
| **Backend API** | http://localhost:8001 | FastAPI server |
| **API Docs** | http://localhost:8001/docs | Swagger UI |
| **PostgreSQL** | localhost:5432 | Database |
| **ChromaDB** | http://localhost:8000 | Vector DB |

## 👤 Login Credentials

The database is automatically seeded with these users:

### Admin Account
```
Email:    admin@askyia.com
Password: admin123
```

### Test Account
```
Email:    test@askyia.com
Password: test123
```

## 📝 Step-by-Step Usage

1. **Start Services**
   ```bash
   ./start.bat  # or ./start.sh
   ```

2. **Wait for Services** (~30 seconds)
   - Watch the terminal output
   - Wait for "✅ All services started!"

3. **Open Frontend**
   - Go to http://localhost:5173
   - You should see the login page

4. **Login**
   - Email: `admin@askyia.com`
   - Password: `admin123`
   - Click "Sign in"

5. **Create a Stack**
   - Click "+ New Stack"
   - Name: "My First Stack"
   - Description: "Testing workflow"
   - Click "Create"

6. **Build Workflow**
   - Click "Edit Stack ↗" on your new stack
   - Drag nodes from left sidebar
   - Connect nodes by dragging handles
   - Configure each node (click ⚙️)

7. **Test with Chat**
   - Click the 💬 button (bottom right)
   - Type a message
   - See the response

## 🔧 Configuration

### Add Your API Keys

Before using LLM features, add your API keys:

1. **Edit backend/.env:**
   ```env
   OPENAI_API_KEY=sk-your-key-here
   SERPAPI_API_KEY=your-serp-key-here
   ```

2. **Restart backend:**
   ```bash
   docker-compose restart backend
   ```

## 🐛 Troubleshooting

### "Docker is not running"
- Start Docker Desktop
- Wait for it to fully start
- Run the script again

### "Port 5173 already in use"
- Stop any existing Vite servers
- Or edit `docker-compose.yml` to use different ports

### "Cannot connect to backend"
- Check backend logs: `docker-compose logs -f backend`
- Verify backend is running: http://localhost:8001
- Check backend health: http://localhost:8001/

### "Login fails"
- Check backend logs for errors
- Verify database is running: `docker-compose ps postgres`
- Try reseeding: 
  ```bash
  docker-compose exec backend python seed_db.py
  ```

### Reset Everything
```bash
docker-compose down -v
docker system prune -a
./start.bat
```

## 📊 Service Management

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Stop Services
```bash
docker-compose down
```

### Remove All Data
```bash
docker-compose down -v
```

## 🎯 What to Do Next

### 1. Test the Full Flow
- ✅ Login works
- ✅ Create stacks
- ✅ Build workflows
- ✅ Chat interface

### 2. Add API Keys
- OpenAI for LLM
- SERP API for web search

### 3. Build Real Workflows
- PDF Q&A
- Web search assistant
- Multi-source research

### 4. Customize
- Add more node types
- Custom prompts
- Different LLM models

## 📚 Documentation

- [Quick Start](QUICKSTART.md) - Getting started guide
- [Frontend Guide](frontend/QUICKSTART.md) - UI walkthrough
- [Sample Workflows](frontend/SAMPLE_WORKFLOWS.md) - Example workflows
- [Full README](README.md) - Complete documentation

## 🔑 Key Files Created

### Backend
- `backend/.env` - Environment variables
- `backend/seed_db.py` - Database seeding script
- `backend/Dockerfile` - Backend container config

### Frontend
- `frontend/.env` - Frontend environment
- `frontend/Dockerfile` - Frontend container config

### Root
- `docker-compose.yml` - Service orchestration
- `start.bat` - Windows startup script
- `start.sh` - Linux/Mac startup script
- `start-local.bat` - Local dev (Windows)
- `start-local.sh` - Local dev (Linux/Mac)

## ✨ Features Now Available

### Authentication
- ✅ JWT-based login
- ✅ Token stored in localStorage
- ✅ Automatic token injection
- ✅ Auto-logout on 401

### Backend
- ✅ PostgreSQL database
- ✅ User management
- ✅ Default users seeded
- ✅ CORS configured
- ✅ Health checks

### Frontend
- ✅ Dashboard with stacks
- ✅ Visual workflow builder
- ✅ Node configuration
- ✅ Chat interface
- ✅ Real backend integration

### Infrastructure
- ✅ Docker containerization
- ✅ Service orchestration
- ✅ Automatic initialization
- ✅ Volume persistence
- ✅ Network isolation

## 🎊 You're All Set!

Your full-stack application is ready to use!

1. **Run:** `./start.bat` (or `./start.sh`)
2. **Login:** http://localhost:5173
3. **Build:** Create workflows
4. **Chat:** Test with AI

---

**Need help?** Check the troubleshooting section above or create an issue on GitHub.

**Happy building!** 🚀✨
