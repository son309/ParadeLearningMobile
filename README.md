# ParadeLearningMobile

Frontend React Native cho ứng dụng học động tác / bài tập theo video.


## 1. Công nghệ sử dụng

- React Native
- TypeScript
- React Navigation
- Axios
- Zustand
- Socket.IO Client

---

## 2. Backend server

App hiện đang gọi API từ server đã deploy:

```txt
http://group1.it4788.sukkaito.id.vn/it4788
```

Socket server:

```txt
http://group1.it4788.sukkaito.id.vn
```

File cấu hình server nằm tại:

```txt
src/constants/config.ts
```

Nếu cần đổi server, sửa file `src/constants/config.ts`:

```ts
export const CONFIG = {
  API_BASE_URL: 'http://group1.it4788.sukkaito.id.vn/it4788',
  SOCKET_URL: 'http://group1.it4788.sukkaito.id.vn',
};
```

---

## 3. Yêu cầu môi trường

Máy cần cài:

- Node.js
- npm
- Git
- JDK 17
- Android Studio
- Android SDK
- Android SDK Platform Tools
- Điện thoại Android thật hoặc Android Emulator

Kiểm tra môi trường:

```bash
node -v
npm -v
git --version
java -version
adb version
```

Nếu dùng điện thoại Android thật, cần bật:

```txt
Developer Options -> USB Debugging
```

---

## 4. Cài đặt project

Clone repo:

```bash
git clone https://github.com/son309/ParadeLearningMobile.git
cd ParadeLearningMobile
```

Chuyển sang branch đang phát triển:

```bash
git checkout feature/auth-navigation-socket
```

Cài dependencies:

```bash
npm install
```

---

## 5. Chạy app trên Android

### Bước 1: Chạy Metro server

Mở terminal thứ nhất:

```bash
npm start
```

Giữ terminal này chạy, không tắt.

---

### Bước 2: Kết nối điện thoại

Mở terminal thứ hai:

```bash
adb devices
```

Nếu thấy dạng:

```txt
xxxxxxxx    device
```

là máy đã nhận điện thoại.

Nếu thấy:

```txt
unauthorized
```

hãy nhìn điện thoại và bấm **Allow USB debugging**.

---

### Bước 3: Reverse port cho điện thoại thật

Nếu chạy bằng điện thoại Android thật, cần chạy:

```bash
adb reverse tcp:8081 tcp:8081
```

---

### Bước 4: Build và mở app

Ở terminal thứ hai:

```bash
npm run android -- --no-packager
```

Nếu không dùng `--no-packager`, có thể chạy:

```bash
npm run android
```

---

## 6. Chạy lại app sau khi đã cài trên điện thoại

Nếu app đã được cài trên điện thoại rồi, những lần sau thường chỉ cần:

Terminal 1:

```bash
npm start
```

Terminal 2:

```bash
adb reverse tcp:8081 tcp:8081
```

Sau đó mở app trực tiếp trên điện thoại.

Nếu app không tự reload, mở Dev Menu rồi chọn **Reload**, hoặc chạy:

```bash
adb shell input keyevent 82
```

---

## 7. Reset cache khi lỗi

Nếu app trắng màn hình, không reload, hoặc lỗi bundle:

```bash
npm start -- --reset-cache
```

Nếu cần xóa dữ liệu app trên điện thoại:

```bash
adb shell pm clear com.paradelearningmobile
```

Sau đó chạy lại:

```bash
adb reverse tcp:8081 tcp:8081
npm run android -- --no-packager
```

