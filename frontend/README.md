# Pet Store Management - Frontend

Frontend application cho Hệ thống Quản lý Cửa hàng Thú cưng.

## Công nghệ sử dụng

- React 18+
- Material-UI (MUI) v5
- React Router v6
- Axios
- Recharts (biểu đồ)

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env` với nội dung:

```
REACT_APP_API_URL=https://pet-store-backend-e795.onrender.com/api
```

Hoặc cho local development:

```
REACT_APP_API_URL=http://localhost:5001/api
```

## Chạy ứng dụng

```bash
npm start
```

Ứng dụng sẽ chạy tại: http://localhost:3000

## Build cho production

```bash
npm run build
```

## Cấu trúc thư mục

```
src/
├── components/         # Các component tái sử dụng
│   ├── common/        # Common components (Loading, ErrorAlert, etc.)
│   └── layout/        # Layout components (MainLayout)
├── pages/             # Các trang chính
│   ├── auth/          # Đăng nhập, đăng ký
│   ├── dashboard/     # Dashboard
│   ├── products/      # Quản lý sản phẩm
│   ├── inventory/     # Quản lý tồn kho
│   ├── sales/         # Quản lý bán hàng
│   ├── customers/     # Quản lý khách hàng
│   └── reports/       # Báo cáo
├── services/          # API services
├── contexts/          # React Context (Auth)
├── utils/             # Utility functions
├── config/            # Configuration files
└── App.js             # Main app component
```

## Tính năng

- ✅ Đăng nhập/Đăng xuất
- ✅ Dashboard với thống kê tổng quan
- ✅ Quản lý sản phẩm (CRUD)
- ✅ Quản lý tồn kho
- ✅ Nhập hàng
- ✅ Quản lý bán hàng (tạo đơn, xem danh sách, hủy đơn)
- ✅ Quản lý khách hàng (CRUD)
- ✅ Báo cáo và phân tích
  - Doanh thu theo thời gian
  - Doanh thu theo khách hàng/sản phẩm
  - Sản phẩm bán chạy/chậm
  - Lợi nhuận sản phẩm
  - Báo cáo tồn kho

## Đăng nhập demo

Username: `admin`
Password: `admin123`

(Tài khoản này cần được tạo trong backend)
