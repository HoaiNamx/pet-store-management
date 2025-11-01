# Pet Store Management - Deployment Guide

Hướng dẫn triển khai ứng dụng lên Production sử dụng Render (Backend), Supabase (Database), và Netlify (Frontend).

---

## 📋 Tổng quan kiến trúc

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Netlify    │─────▶│    Render    │─────▶│  Supabase    │
│  (Frontend)  │      │  (Backend)   │      │ (PostgreSQL) │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 🗄️ Bước 1: Setup Database (Supabase)

### 1.1. Tạo project trên Supabase
1. Truy cập https://supabase.com
2. Đăng nhập và tạo project mới
3. Chọn region: **Southeast Asia (Singapore)**
4. Đợi database khởi tạo (2-3 phút)

### 1.2. Lấy Database URL
1. Vào **Settings** → **Database**
2. Tìm **Connection string** → **URI**
3. Copy URL có dạng:
   ```
   postgresql://postgres.[ref]:[password]@aws-x-ap-southeast-x.pooler.supabase.com:5432/postgres
   ```

### 1.3. Chạy Seed (Tạo bảng và dữ liệu mẫu)
Backend có endpoint `/api/seed` để tự động tạo tables và sample data.

**Sau khi deploy backend lên Render**, gọi:
```bash
curl -X POST https://your-backend-url.onrender.com/api/seed \
  -H "x-admin-key: your-admin-key"
```

✅ **Database đã setup xong!**

---

## 🔧 Bước 2: Deploy Backend (Render)

### 2.1. Chuẩn bị
- File `render.yaml` đã có sẵn ở root project
- Backend sử dụng Node.js + Express + PostgreSQL

### 2.2. Deploy lên Render

#### Option A: Tự động deploy từ GitHub (Khuyến nghị)
1. Truy cập https://render.com
2. Đăng nhập và click **New** → **Blueprint**
3. Connect GitHub repository
4. Render sẽ tự động detect `render.yaml`
5. Click **Apply**

#### Option B: Manual deploy
1. Truy cập https://render.com
2. Click **New** → **Web Service**
3. Connect GitHub repository
4. Chọn branch: `main` hoặc `master`
5. Cấu hình:
   - **Name**: `pet-store-backend`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Root Directory**: Để trống
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

### 2.3. Cấu hình Environment Variables
Vào **Environment** tab và thêm:

```env
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://your-app.netlify.app
ADMIN_KEY=admin-secret-key-2024
```

⚠️ **Quan trọng:**
- `DATABASE_URL`: Copy từ Supabase (Bước 1.2)
- `FRONTEND_URL`: Sẽ cập nhật sau khi deploy Frontend
- `ADMIN_KEY`: Dùng để bảo vệ endpoint `/api/seed`

### 2.4. Deploy và Test
1. Click **Create Web Service**
2. Đợi deploy (5-10 phút lần đầu)
3. Test backend:
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```

   Kết quả mong đợi:
   ```json
   {
     "status": "healthy",
     "database": {
       "status": "connected",
       "type": "PostgreSQL"
     }
   }
   ```

### 2.5. Chạy Seed
```bash
curl -X POST https://your-backend.onrender.com/api/seed \
  -H "x-admin-key: admin-secret-key-2024"
```

✅ **Backend đã deploy xong!**

---

## 🎨 Bước 3: Deploy Frontend (Netlify)

### 3.1. Chuẩn bị
- File `netlify.toml` đã có sẵn ở root project
- Frontend sử dụng React (Create React App)

### 3.2. Deploy lên Netlify

#### Cách 1: Deploy từ GitHub (Khuyến nghị)
1. Truy cập https://app.netlify.com
2. Đăng nhập và click **Add new site** → **Import an existing project**
3. Choose **GitHub** và select repository
4. Cấu hình:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
5. Click **Deploy site**

#### Cách 2: Deploy thủ công
```bash
cd frontend
npm run build
npx netlify-cli deploy --prod
```

### 3.3. Cấu hình Environment Variables
1. Vào **Site settings** → **Environment variables**
2. Thêm:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```

### 3.4. Redeploy với Environment Variable
1. Vào **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

### 3.5. Test Frontend
1. Truy cập URL Netlify (VD: `https://your-app.netlify.app`)
2. Kiểm tra:
   - Login hoạt động
   - Danh sách sản phẩm hiển thị
   - Tạo sản phẩm mới
   - Reports hiển thị

✅ **Frontend đã deploy xong!**

---

## 🔄 Bước 4: Cập nhật CORS (Quan trọng!)

Sau khi có URL Frontend từ Netlify, cần cập nhật CORS cho Backend:

1. Vào Render Dashboard → Backend Service
2. Vào **Environment** tab
3. Cập nhật `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-app.netlify.app
   ```
4. Backend sẽ tự động redeploy

---

## 📝 Checklist hoàn thành

- [ ] Database Supabase đã tạo
- [ ] Backend deploy lên Render thành công
- [ ] Backend `/api/health` trả về status healthy
- [ ] Đã chạy seed endpoint thành công
- [ ] Frontend deploy lên Netlify thành công
- [ ] Environment variables đã cấu hình đầy đủ
- [ ] CORS đã cập nhật với URL Netlify
- [ ] Test đăng nhập trên production
- [ ] Test CRUD sản phẩm trên production
- [ ] Test báo cáo trên production

---

## 🚀 Auto Deployment

### Backend (Render)
- Mỗi lần push code lên branch `main`
- Render tự động detect và deploy
- Thời gian deploy: ~5-10 phút

### Frontend (Netlify)
- Mỗi lần push code lên branch `main`
- Netlify tự động build và deploy
- Thời gian deploy: ~2-3 phút

---

## 🔍 Troubleshooting

### Backend không connect được Database
```bash
# Kiểm tra DATABASE_URL
curl https://your-backend.onrender.com/api/health

# Nếu lỗi, kiểm tra:
# 1. DATABASE_URL có đúng không
# 2. Supabase database có running không
# 3. IP whitelist trên Supabase (nên để 0.0.0.0/0)
```

### Frontend không gọi được API
```bash
# Kiểm tra CORS
# 1. FRONTEND_URL trên Render có đúng không
# 2. Open browser console xem lỗi CORS
# 3. Kiểm tra REACT_APP_API_URL trên Netlify
```

### Render Free Plan sleep sau 15 phút
- Backend sẽ sleep nếu không có request
- Lần đầu tiên sẽ mất ~30s để wake up
- Giải pháp: Upgrade lên paid plan hoặc dùng uptime monitor

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Render logs: **Logs** tab
2. Netlify logs: **Deploys** → Click vào deploy → **Deploy log**
3. Browser console: F12 → Console tab

---

## 🎉 Hoàn thành!

Ứng dụng đã được deploy thành công lên Production!

- **Frontend**: https://your-app.netlify.app
- **Backend**: https://your-backend.onrender.com
- **Database**: Supabase PostgreSQL

Enjoy! 🚀
