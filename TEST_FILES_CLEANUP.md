# 🗑️ Hướng Dẫn: File Test Có Thể Xóa

## 📊 Danh Sách File Test

| File | Loại | Có Thể Xóa? | Lý Do |
|------|------|-----------|-------|
| `test-email.js` | Test email | ⚠️ **GIỮ** | Dùng debug email, check credentials |
| `test-order.js` | Test order | ⚠️ **GIỮ** | Dùng test order flow |
| `create-test-order.js` | Test order | ✅ **CÓ THỂ XÓA** | Trùng với test-order.js |
| `quick-test.js` | Test nhanh | ✅ **CÓ THỂ XÓA** | Không dùng, có thể xóa |
| `blockchain/test/OrderTracking.test.js` | Unit test | ⚠️ **GIỮ** | Test smart contract, quan trọng |
| `blockchain/scripts/test-sepolia-simple.js` | Test blockchain | ✅ **CÓ THỂ XÓA** | Test cơ bản, có thể xóa |
| `blockchain/scripts/test-sepolia-order.js` | Test blockchain | ⚠️ **GIỮ** | Test order creation trên testnet |

---

## 🎯 Khuyến Cáo

### Giữ (Cần Dùng)
```
✅ test-email.js          - Kiểm tra email config OK không
✅ test-order.js          - Test order flow end-to-end
✅ blockchain/test/OrderTracking.test.js  - Unit test smart contract
✅ blockchain/scripts/test-sepolia-order.js - Test trên testnet
```

### Có Thể Xóa (Không Cần)
```
❌ create-test-order.js   - Trùng test-order.js, redundant
❌ quick-test.js          - Generic test, không cần
❌ blockchain/scripts/test-sepolia-simple.js - Test cơ bản, thay bằng test-sepolia-order.js
```

---

## 📝 Mô Tả Chi Tiết

### 🟢 GIỮ: test-email.js
```bash
node test-email.js your-email@gmail.com
```
- **Dùng để**: Kiểm tra email config (Gmail + App Password)
- **Khi nào cần**: Sau khi deploy, muốn verify email hoạt động
- **Output**: Gửi 3 test emails (creation, status update, delivery)

### 🟢 GIỮ: test-order.js
```bash
node test-order.js
```
- **Dùng để**: Test full order flow
- **Khi nào cần**: Debug order creation, verify blockchain + API + email
- **Output**: Tạo test order, kiểm tra txHash, email

### 🔴 CÓ XÓA: create-test-order.js
- **Lý do xóa**: Content giống test-order.js, không cần 2 file
- **Giải pháp**: Xóa file này, dùng test-order.js thay

### 🔴 CÓ XÓA: quick-test.js
- **Lý do xóa**: Test nhanh generic, không có mục đích cụ thể
- **Giải pháp**: Xóa file này

### 🟢 GIỮ: blockchain/test/OrderTracking.test.js
```bash
cd blockchain
npx hardhat test
```
- **Dùng để**: Unit test smart contract functions
- **Khi nào cần**: Trước khi deploy contract update
- **Output**: Test case status, gas usage

### 🔴 CÓ XÓA: blockchain/scripts/test-sepolia-simple.js
- **Lý do xóa**: Test cơ bản, thay bằng test-sepolia-order.js
- **Giải pháp**: Xóa file này

### 🟢 GIỮ: blockchain/scripts/test-sepolia-order.js
```bash
cd blockchain
npx hardhat run scripts/test-sepolia-order.js
```
- **Dùng để**: Test order creation trên Sepolia testnet
- **Khi nào cần**: Verify contract hoạt động đúng trên testnet
- **Output**: txHash, order ID, status

---

## 🗑️ Xóa File An Toàn

### Cách 1: Dùng Terminal (PowerShell)

```powershell
# Xóa từng file
Remove-Item .\create-test-order.js -Force
Remove-Item .\quick-test.js -Force
Remove-Item .\blockchain\scripts\test-sepolia-simple.js -Force
```

### Cách 2: Xóa qua Git

```bash
git rm create-test-order.js quick-test.js blockchain/scripts/test-sepolia-simple.js
git commit -m "chore: remove redundant test files"
git push
```

### Cách 3: Visual Studio Code
- Chuột phải file → Delete

---

## 📋 Checklist: Xóa File Test

- [ ] Xóa `create-test-order.js`
- [ ] Xóa `quick-test.js`
- [ ] Xóa `blockchain/scripts/test-sepolia-simple.js`
- [ ] Commit: `git add -A && git commit -m "chore: remove redundant test files"`
- [ ] Push: `git push`
- [ ] Verify: `git log --oneline` (kiểm tra commit)

---

## ⚡ Quick Summary

**Bỏ 3 file:**
```
❌ create-test-order.js
❌ quick-test.js
❌ blockchain/scripts/test-sepolia-simple.js
```

**Giữ 4 file:**
```
✅ test-email.js
✅ test-order.js
✅ blockchain/test/OrderTracking.test.js
✅ blockchain/scripts/test-sepolia-order.js
```

---

## 🔒 Production Setup

Nếu muốn production (xóa hết test files):

```powershell
# Xóa ALL test files
Remove-Item test-*.js -Force
Remove-Item create-*.js -Force
Remove-Item quick-*.js -Force
Remove-Item blockchain/test/*.js -Force
Remove-Item blockchain/scripts/test-*.js -Force
```

**Nhưng khuyến cáo: Giữ lại để debug sau này!**
