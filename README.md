# Hybrid Encryption File Transfer System

Full-stack web application for secure file transfer using hybrid encryption.

- 🔒 **Asymmetric**: RSA-OAEP (2048-bit keys)
- 🔐 **Symmetric**: AES-256-GCM (random session key per file)
- 💾 **Key Manager**: Store & manage encrypted keys locally
- 📊 **Transfer History**: Track all encrypt/decrypt operations
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive**: Works on desktop and mobile devices

---

## 🚀 HƯỚNG DẪN CHẠY LOCAL

### ⚡ **CÁCH NHANH NHẤT (5 phút)**

#### Với Docker:
```powershell
# 1. Copy .env
Copy-Item backend\.env.local -Destination backend\.env -Force

# 2. Start MongoDB
docker-compose up -d mongodb
Start-Sleep -Seconds 5

# 3. Initialize database
cd backend
npm install
npm run init-db

# 4. Start backend (Terminal 1)
npm run dev

# 5. In new terminal - start frontend
cd ..\frontend
npm install
npm run dev

# 6. Open browser: http://localhost:5173
```

#### Không dùng MongoDB (chỉ test Encrypt/Decrypt):
```powershell
# 1. Copy .env
Copy-Item backend\.env.local -Destination backend\.env -Force

# 2. Start backend (Terminal 1)
cd backend
npm install
npm run dev

# 3. In new terminal - start frontend
cd frontend
npm install
npm run dev

# 4. Open browser: http://localhost:5173
# Lưu ý: Key Manager và History có thể không hoạt động đầy đủ nếu không có MongoDB
```

---

### 📋 **HƯỚNG DẪN CHI TIẾT**

#### **BƯỚC 1: Kiểm tra Node.js**

```powershell
# Check version
node --version    # v16.0.0 trở lên
npm --version     # v7.0.0 trở lên

# Nếu chưa cài: https://nodejs.org/
# Windows: Cần restart PowerShell sau cài
```

#### **BƯỚC 2: Chọn Database Option**

##### **Option A: Docker (Recommended - Dễ nhất)**

**Chuẩn bị:**
- Cài Docker Desktop: https://www.docker.com/products/docker-desktop
- Khởi động Docker Desktop

**Chạy MongoDB:**
```powershell
cd C:\Users\Admin\Documents\HCMUS\DAAN\PersionalProject

# Copy .env file
Copy-Item backend\.env.local -Destination backend\.env -Force

# Start MongoDB (background)
docker-compose up -d mongodb

# Chờ 5 giây
Start-Sleep -Seconds 5

# Kiểm tra MongoDB chạy
docker ps
# Nên thấy: hybrid-encryption-mongodb   STATUS Up...
```

##### **Option B: Tạm thời Skip Database**

Nếu không muốn cài Docker, backend vẫn chạy nhưng Key Manager + History không lưu dữ liệu:

```powershell
# Copy .env file
Copy-Item backend\.env.local -Destination backend\.env -Force

# Backend chạy mà không cần MongoDB
# Encrypt/Decrypt vẫn hoạt động bình thường
```

##### **Option C: Cài MongoDB Local**

**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Chạy installer
3. MongoDB tự động chạy

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install mongodb
sudo systemctl start mongodb
```

---

#### **BƯỚC 3: Backend Setup**

```powershell
# 1. Vào thư mục backend
cd backend

# 2. Copy .env (nếu chưa)
Copy-Item .env.local .env -Force

# 3. Cài dependencies
npm install
# Sẽ mất 1-2 phút

# 4. Kiểm tra .env file
cat .env
# Nên có:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/hybrid-encryption
# FRONTEND_ORIGIN=http://localhost:5173
```

---

#### **BƯỚC 4: Initialize Database (nếu có MongoDB)**

```powershell
# Vẫn ở folder backend

npm run init-db

# Kết quả mong đợi:
# ✅ Connected to MongoDB successfully
# ✅ Collections cleared
# ✅ Indexes created
# ✅ Created sample key 1
# ✅ Created sample key 2
# ✅ Created 5 sample log records
# ✅ Created 5 sample file records
# 
# 📊 Database Statistics:
# 🔐 Stored Keys: 2
# 📋 Log Records: 5
# 📁 File Records: 5
# ✨ Database initialized successfully!
```

---

#### **BƯỚC 5: Chạy Backend**

```powershell
# Vẫn ở folder backend

npm run dev

# Nên thấy:
# [nodemon] watching...
# Hybrid encryption API listening on port 5000
# Connected to MongoDB
```

**✅ Backend running!** - Giữ terminal này mở

---

#### **BƯỚC 6: Chạy Frontend (Terminal mới)**

```powershell
# Mở PowerShell window mới

# 1. Vào frontend
cd C:\Users\Admin\Documents\HCMUS\DAAN\PersionalProject\frontend

# 2. Cài dependencies
npm install

# 3. Start dev server
npm run dev

# Nên thấy:
# ➜  Local:   http://localhost:5173/
```

**✅ Frontend running!** - Browser sẽ mở tự động

---

#### **BƯỚC 7: Test Application**

**Encrypt/Decrypt:**
1. Click "Generate Key Pair"
2. Select file để encrypt
3. Click "Encrypt Now" → `.hybrid` file downloads
4. Upload `.hybrid` file ở Decrypt tab
5. Click "Decrypt Now" → original file restored

**Key Manager Tab** (nếu có MongoDB):
- Xem keys đã save
- Save key mới
- Quản lý metadata

**History Tab** (nếu có MongoDB):
- Xem transfer history
- Statistics & trends
- Filter by action/status

**Dark Mode:**
- Click 🌙 button ở top-right
- Theme persists

---

### 🧪 **Verification Checklist**

```powershell
# 1. Check MongoDB (nếu dùng)
docker ps
# Nên thấy: hybrid-encryption-mongodb STATUS Up

# 2. Check Backend API
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"..."}

# 3. Check Frontend
# Browser: http://localhost:5173
# Nên load page with 4 tabs

# 4. Test encryption
# Upload file → encrypt → decrypt
# Original file should be recovered
```

---

### 🛠️ **Troubleshooting**

#### Backend không start:
```powershell
# Kiểm tra .env
cat backend\.env

# Kiểm tra port 5000
netstat -ano | findstr :5000

# Kill process nếu cần
taskkill /PID <PID> /F

# Hoặc change PORT trong .env
```

#### Frontend không load:
```powershell
# Kiểm tra backend chạy
curl http://localhost:5000/api/health

# Clear browser cache: Ctrl+Shift+Delete
# Hard refresh: Ctrl+Shift+R
```

#### MongoDB connection error:
```powershell
# Kiểm tra Docker
docker ps

# Restart MongoDB
docker-compose restart mongodb

# Check logs
docker-compose logs mongodb

# Full reset
docker-compose down -v
docker-compose up -d mongodb
```

#### Port already in use:
```powershell
# Frontend: Vite sẽ tự động dùng port tiếp theo (5174, 5175...)
# Backend: Change PORT trong .env
```

#### CORS errors:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:**
- Kiểm tra backend .env: `FRONTEND_ORIGIN=http://localhost:5173`
- Restart backend

---

### 📊 **Database Commands**

```powershell
# Connect đến MongoDB
mongosh mongodb://localhost:27017/hybrid-encryption

# Trong mongo shell:
> show collections
> db.storedkeys.find().pretty()
> db.logrecords.find().pretty()
> db.storedkeys.count()
> exit()
```

---

### 🎯 **Khi Xong**

```powershell
# Backend: Ctrl+C
# Frontend: Ctrl+C
# MongoDB: docker-compose down
```

---

### 🚀 **Lần Tiếp Theo - Quick Restart**

```powershell
# 1. Start MongoDB
docker-compose up -d mongodb
Start-Sleep -Seconds 3

# 2. Start backend
cd backend && npm run dev

# 3. In new terminal - start frontend
cd frontend && npm run dev

# 4. Browser: http://localhost:5173
```

---

### ❌ **Lỗi Phổ Biến**

| Lỗi | Fix |
|-----|-----|
| `Cannot find module 'dotenv'` | `npm install` |
| `ECONNREFUSED 127.0.0.1:5000` | Check backend terminal, restart backend |
| `CORS error` | Kiểm tra FRONTEND_ORIGIN trong .env, restart backend |
| `MongoDB connection refused` | `docker-compose up -d mongodb` |
| `Port 5173 already in use` | Vite sẽ dùng port tiếp theo tự động |
| `Docker not found` | Cài Docker Desktop từ https://docker.com |

---

### 💡 **Tips**

1. Keep terminals organized (VS Code Integrated Terminals)
2. Auto-reload: Backend (nodemon) + Frontend (Vite)
3. Persistent data: MongoDB data lưu trong volumes
4. Reset data: `npm run init-db` bất kỳ lúc nào
5. Export data: `node scripts/db-tools.js export`

---

## 🔑 Features

### Core Encryption
- POST /api/keys/generate - Generate RSA key pair
- POST /api/encrypt - Encrypt file with public key
- POST /api/decrypt - Decrypt file with private key

### Key Management (NEW)
- POST /api/keymanager/save - Store keys encrypted
- GET /api/keymanager/keys - List saved keys
- DELETE /api/keymanager/keys/:id - Remove key
- POST /api/keymanager/keys/:id/private - Retrieve private key

### History & Analytics (NEW)
- GET /api/history/logs - View transfer logs
- GET /api/history/stats - Get statistics by period
- DELETE /api/history/logs - Clear old logs

## 📦 Example .hybrid Payload Format

```json
{
  "version": 1,
  "algorithm": {
    "asymmetric": "RSA-OAEP-SHA256",
    "symmetric": "AES-256-GCM"
  },
  "encrypted_key": "<base64>",
  "iv": "<base64>",
  "ciphertext": "<base64>",
  "tag": "<base64>",
  "original_name": "document.pdf",
  "mime_type": "application/pdf"
}
```

## 🛠️ Manual Setup (Without Docker)

### Prerequisites
- Node.js v16+
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
# Create .env file with:
# MONGODB_URI=mongodb://localhost:27017/hybrid-encryption
# PORT=5000
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
# Optionally create .env with:
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

## 🔒 Security Notes

- ✅ Private keys never persisted by backend
- ✅ Session keys generated per file and never stored
- ✅ AES-GCM authentication tag verified during decryption
- ✅ Password-protected key storage (PBKDF2 + AES-256)
- ✅ Key fingerprinting for identification
- ✅ Safe error messages on decryption failure

## 🎨 New UI Features

- 🔐 **4 Main Tabs**: Encrypt | Decrypt | Key Manager | History
- 🌙 **Dark Mode**: Click toggle in header
- 📚 **Session Keys**: Recently used keys cached locally
- 📊 **Statistics Dashboard**: 
  - Success/failure counts
  - Data transferred
  - Processing time
  - Filterable by period
- 📱 **Responsive Design**: Mobile-friendly interface

## 📊 Database Status

 MongoDB instance required for:
 - Storing key pairs
 - Logging transfer history
 - File metadata

 For setup instructions, see the **HƯỚNG DẪN CHI TIẾT** section above.

 ## 🚦 Health Checks

 ```bash
 # Check if backend is running
 curl http://localhost:5000/api/health

 # Connect to MongoDB
 mongosh mongodb://localhost:27017/hybrid-encryption
 ```

## 📖 Framework & Dependencies

### Backend
- Express.js - Web server
- Mongoose - MongoDB ODM
- Multer - File uploads
- Crypto - Node.js crypto module

### Frontend
- React - UI framework
- Vite - Build tool
- Playwright - E2E testing

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- Batch file encryption
- File sharing via temporary links
- QR code key sharing
- User authentication
- Rate limiting
- API documentation (Swagger)

## 📝 License

MIT - See LICENSE file

## 🆘 Troubleshooting

**MongoDB not starting:**
```bash
docker-compose logs mongodb
docker-compose restart mongodb
```

**Port already in use:**
- Backend: Change PORT in .env
- Frontend: Vite will use next available port

**Clear all data:**
```bash
docker-compose down -v
docker-compose up -d mongodb
npm run init-db
```
