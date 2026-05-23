# MyTamagotchi

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Mục lục

- [Mô tả](#-mô-tả)
- [Tech stack](#-tech-stack)
- [Tính năng](#-tính-năng)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Tác giả](#-tác-giả)

## Mô tả

**MyTamagotchi** là một trò chơi ảo thú cưng chạy trực tiếp trên trình duyệt, giúp người chơi đăng nhập, tạo một con pet và chăm sóc nó hàng ngày. Người dùng có thể tương tác với pet thông qua các hành động như chơi, cho ăn, tắm, ngủ và sử dụng vật phẩm trong cửa hàng.

Dự án được triển khai trực tiếp trên GitHub Pages và sử dụng Firebase để quản lý đăng nhập, dữ liệu người dùng và dữ liệu pet.

[![Live Demo](https://img.shields.io/badge/Live-Demo-2ea44f?style=for-the-badge)](https://katoridao.github.io/MyTamagotchi/)

## Tech stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- Firebase Authentication
- Firebase Firestore
- GitHub Pages

## Tính năng

- Đăng nhập, đăng ký, khôi phục mật khẩu
- Ghi nhớ thông tin đăng nhập bằng Local Storage
- Tạo pet với tên, loài và màu sắc
- Chăm sóc pet qua các hành động:
  - Chơi
  - Tắm rửa
  - Cho ăn
  - Chăm sóc
  - Ngủ
- Hệ thống chỉ số thú cưng (sức khỏe, năng lượng, đói, sạch sẽ, hạnh phúc)
- Cửa hàng vật phẩm và cơ chế dùng vật phẩm
- Hiển thị thông tin pet và thao tác xóa/đăng xuất
- Tự động lưu trạng thái lên Firebase

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/katoridao/MyTamagotchi.git
cd MyTamagotchi
```

### 2. Cấu hình Firebase

Dự án hiện đang dùng Firebase SDK trực tiếp trong các file JavaScript. Nếu bạn muốn chạy bản sao riêng, hãy:

1. Tạo project mới trên [Firebase Console](https://console.firebase.google.com/)
2. Bật **Authentication** và **Firestore Database**
3. Cập nhật cấu hình Firebase trong các file:
   - `scripts/index.js`
   - `scripts/creation.js`
   - `scripts/game.js`

### 3. Chạy local

Vì đây là ứng dụng web tĩnh, bạn có thể mở `index.html` trực tiếp hoặc dùng một local server đơn giản như:

```bash
npx serve .
```

Sau đó truy cập `http://localhost:3000`.

## Sử dụng

1. Mở ứng dụng từ GitHub Pages hoặc local server.
2. Đăng nhập hoặc đăng ký tài khoản.
3. Tạo pet đầu tiên cho tài khoản của bạn.
4. Chăm sóc pet bằng các nút hành động trên trang game.
5. Mua vật phẩm từ cửa hàng và sử dụng chúng để hỗ trợ pet.

## Cấu trúc thư mục

```text
MyTamagotchi/
├── css/                 # Stylesheets
├── html/                # Các trang HTML
│   ├── creation.html
│   └── game.html
├── img/                 # Hình ảnh pet
├── scripts/             # Logic JavaScript
│   ├── creation.js
│   ├── game.js
│   └── index.js
├── firebase.json        # Cấu hình hosting Firebase
├── index.html           # Trang đăng nhập
└── README.md            # Tài liệu dự án
```

## Tác giả

- Đào Hoàng Anh
- GitHub: @katoridao
