# Blockchain Order Tracking - Frontend

Frontend application cho hệ thống truy vết đơn hàng trên Blockchain, được xây dựng với React.

## 🚀 Tính Năng

- ✅ Kết nối ví MetaMask
- ✅ Tạo đơn hàng mới trên Blockchain
- ✅ Tra cứu thông tin đơn hàng
- ✅ Xem lịch sử cập nhật đơn hàng
- ✅ Cập nhật trạng thái đơn hàng
- ✅ Giao diện responsive, hiện đại

## 📋 Yêu Cầu

- Node.js >= 14.0.0
- npm hoặc yarn
- MetaMask extension
- Sepolia Testnet ETH (để test)

## 🛠️ Cài Đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd frontend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

Cập nhật các giá trị:

```env
REACT_APP_CONTRACT_ADDRESS=0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
REACT_APP_CHAIN_ID=11155111
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

### 4. Copy Contract ABI

Copy file ABI từ backend (nếu có):

```bash
# Copy OrderTracking.json vào src/contracts/
cp ../blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json src/contracts/
```

### 5. Chạy ứng dụng

```bash
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## 📁 Cấu Trúc Thư Mục

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/          # React components
│   │   ├── ConnectWallet/
│   │   ├── CreateOrder/
│   │   ├── OrderDetail/
│   │   ├── OrderList/
│   │   ├── OrderHistory/
│   │   └── TransactionStatus/
│   ├── hooks/              # Custom React hooks
│   │   ├── useContract.js
│   │   ├── useAccount.js
│   │   └── useOrder.js
│   ├── services/           # API services
│   │   ├── contractService.js
│   │   └── apiService.js
│   ├── utils/              # Utility functions
│   │   ├── constants.js
│   │   ├── web3Utils.js
│   │   └── helpers.js
│   ├── contracts/          # Contract ABIs
│   │   └── OrderTracking.json
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx
│   │   ├── CreateOrderPage.jsx
│   │   └── TrackingPage.jsx
│   ├── styles/             # CSS files
│   │   └── globals.css
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── package.json
└── README.md
```

## 🔧 Scripts

- `npm start` - Chạy development server
- `npm run build` - Build production
- `npm test` - Chạy tests
- `npm run eject` - Eject từ Create React App

## 🎨 Components

### ConnectWallet
Component kết nối và quản lý ví MetaMask.

### CreateOrder
Form tạo đơn hàng mới với validation.

### OrderDetail
Hiển thị chi tiết đơn hàng từ blockchain.

### OrderHistory
Timeline hiển thị lịch sử cập nhật đơn hàng.

### OrderList
Danh sách đơn hàng dạng table.

### TransactionStatus
Hiển thị trạng thái transaction và link Etherscan.

## 🔗 Hooks

### useContract
Hook quản lý kết nối với smart contract.

### useAccount
Hook quản lý thông tin tài khoản MetaMask.

### useOrder
Hook tương tác với các function của contract (create, get, update).

## 🌐 Pages

### Dashboard (/)
Trang chủ hiển thị thống kê và đơn hàng gần đây.

### CreateOrderPage (/create)
Trang tạo đơn hàng mới.

### TrackingPage (/tracking)
Trang tra cứu và xem chi tiết đơn hàng.

## 🔐 MetaMask Setup

1. Cài đặt MetaMask extension
2. Tạo/Import ví
3. Chuyển sang Sepolia Testnet
4. Lấy test ETH từ faucet:
   - https://sepoliafaucet.com/
   - https://sepolia-faucet.pk910.de/

## 🎯 Sử Dụng

### 1. Kết nối ví

- Click "Kết nối MetaMask" ở trang chủ
- Chọn tài khoản trong MetaMask
- Chấp nhận kết nối

### 2. Tạo đơn hàng

- Vào trang "Tạo Đơn Hàng"
- Nhập mã đơn hàng (hoặc tự động tạo)
- Nhập metadata hash
- Click "Tạo Đơn Hàng"
- Xác nhận transaction trong MetaMask

### 3. Tra cứu đơn hàng

- Vào trang "Tra Cứu"
- Nhập mã đơn hàng
- Xem chi tiết và lịch sử

## 🚨 Lưu Ý

- Cần có test ETH trên Sepolia để thực hiện giao dịch
- Gas fee dao động, kiểm tra trước khi gửi transaction
- Mỗi đơn hàng cần mã duy nhất
- Data trên blockchain không thể xóa

## 📱 Responsive Design

Ứng dụng hỗ trợ:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1280px+)

## 🛡️ Security

- Không lưu private key trong code
- Sử dụng environment variables
- Validate tất cả input
- XSS protection

## 🐛 Troubleshooting

### MetaMask không kết nối được

- Kiểm tra extension đã cài đặt
- Reload trang
- Kiểm tra network đã chọn đúng

### Transaction failed

- Kiểm tra balance đủ gas
- Kiểm tra network congestion
- Tăng gas limit

### Contract call failed

- Kiểm tra contract address
- Kiểm tra ABI file
- Kiểm tra network

## 📄 License

MIT License

## 👥 Contributors

- Blockchain Development Team

## 📞 Support

Nếu có vấn đề, vui lòng tạo issue trên GitHub.
