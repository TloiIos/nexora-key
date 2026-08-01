# Hướng dẫn tích hợp "APIBANK" — tự động xác nhận thanh toán chuyển khoản

## Vì sao web tĩnh (GitHub Pages) không tự làm được việc này?

GitHub Pages chỉ phục vụ file tĩnh (HTML/CSS/JS), không chạy được code chờ nhận webhook 24/7.
Muốn tự động biết "khách đã chuyển khoản chưa" thì bắt buộc phải có **1 server nhỏ luôn chạy**
để nhận thông báo (webhook) mỗi khi có tiền vào tài khoản. Server này tách biệt với trang GitHub Pages,
và có thể host miễn phí ở Render, Railway, hoặc Cloudflare Workers.

## Kiến trúc tổng quan

```
Khách chuyển khoản
       │
       ▼
Ngân hàng / Ví (ghi nhận giao dịch)
       │  (đối tác chính thức)
       ▼
Cổng trung gian: SePay / Casso / PayOS / VietQR
       │  gửi webhook (POST kèm nội dung chuyển khoản)
       ▼
Server nhỏ của bạn (Node.js, luôn online)
       │  đọc "nội dung CK", tìm ra mã đơn hàng
       ▼
Đánh dấu đơn hàng "Đã thanh toán" (lưu DB/Google Sheet/Telegram)
```

## Các bên cung cấp API chính chủ, uy tín (không cần đăng nhập internet banking)

| Dịch vụ | Đặc điểm | Phù hợp |
|---|---|---|
| **SePay** | Miễn phí gói cơ bản, hỗ trợ nhiều ngân hàng, dễ tích hợp | Shop nhỏ, mới bắt đầu |
| **Casso** | Đi đầu ở VN, tài liệu rõ ràng | Shop vừa và nhỏ |
| **VietQR (VietQR.io)** | Sinh mã QR động kèm số tiền + nội dung | Kết hợp cùng SePay/Casso để tạo QR đẹp |
| **payOS** | Có thêm tính năng đối soát, chi tiền tự động | Shop có doanh thu ổn định, cần báo cáo |

Cách làm chung: đăng ký tài khoản ở 1 trong các dịch vụ trên → liên kết tài khoản ngân hàng của bạn
qua cổng chính thức của họ (họ xin quyền theo đúng quy trình ngân hàng cho phép, **không cần bạn đưa
mật khẩu/OTP internet banking cho bên thứ ba**) → họ cấp cho bạn 1 "Webhook URL" để khai báo, hoặc gửi
webhook đến URL server của bạn.

## Bước 1 — Sinh mã đơn hàng duy nhất

Mỗi đơn hàng cần 1 mã ngắn để khách ghi vào nội dung chuyển khoản, ví dụ `DH0F3A2`.
Hiện tại ở trang bán hàng, khi khách bấm "Đặt mua qua Zalo", nội dung đơn được copy sẵn — bạn có thể
sửa `checkout()` trong `js/shop.js` để tự sinh thêm mã đơn hàng và yêu cầu khách ghi mã này vào nội dung
chuyển khoản.

## Bước 2 — Server nhận webhook (ví dụ với SePay, Node.js/Express)

```js
// server.js — chạy trên Render/Railway (không phải GitHub Pages)
const express = require("express");
const app = express();
app.use(express.json());

// SePay sẽ POST tới URL này mỗi khi có giao dịch mới về tài khoản đã liên kết
app.post("/webhook/sepay", (req, res) => {
  const tx = req.body; // { content, transferAmount, gateway, referenceCode, ... }

  // 1. Xác thực request thực sự đến từ SePay (dùng Authorization header/API key họ cấp)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Apikey ${process.env.SEPAY_API_KEY}`) {
    return res.status(401).json({ success: false });
  }

  // 2. Tìm mã đơn hàng trong nội dung chuyển khoản
  const match = tx.content.match(/DH[0-9A-Z]{5,}/);
  if (!match) return res.json({ success: true }); // không liên quan đơn nào, bỏ qua

  const orderCode = match[0];

  // 3. Đối chiếu số tiền rồi đánh dấu đơn hàng đã thanh toán
  // (ở đây bạn cần 1 nơi lưu đơn hàng thật — Google Sheet, Airtable, hoặc DB như Supabase)
  markOrderAsPaid(orderCode, tx.transferAmount);

  res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
```

Lưu ý quan trọng trong đoạn trên:
- **Luôn xác thực webhook** bằng API key/secret mà nhà cung cấp cấp cho bạn — nếu không, ai cũng có thể
  giả mạo request báo "đã thanh toán" để nhận acc miễn phí.
- **Đối chiếu đúng số tiền**, không chỉ đúng mã đơn — tránh trường hợp khách chuyển thiếu vẫn được coi
  là đã thanh toán đủ.

## Bước 3 — Nơi lưu trạng thái đơn hàng

Vì trang bán hàng hiện tại là web tĩnh, không có database, bạn có 3 lựa chọn dễ làm nhất khi lên bước này:
- **Google Sheets** (qua Google Apps Script hoặc API) — dễ nhất cho shop nhỏ, admin xem được luôn
- **Supabase / Firebase** (free tier) — nếu muốn chuyên nghiệp hơn, có bảng đơn hàng thật
- **Gửi thẳng qua Telegram Bot** — đơn giản nhất: mỗi khi có thanh toán khớp, server gửi tin nhắn vào
  nhóm Telegram của shop để admin tự tay gửi acc, không cần giao diện quản lý riêng

## Bước 4 — Hiển thị QR động ở trang thanh toán (tuỳ chọn nâng cao)

Dùng VietQR để sinh ảnh QR có sẵn số tiền + nội dung (mã đơn hàng), khách quét là điền sẵn hết,
giảm sai sót khi họ tự gõ nội dung chuyển khoản:

```
https://img.vietqr.io/image/<NGAN_HANG>-<SO_TK>-compact2.png?amount=<SO_TIEN>&addInfo=<MA_DON_HANG>
```

## Tóm tắt việc cần làm

1. Đăng ký tài khoản SePay hoặc Casso (miễn phí gói cơ bản), liên kết ngân hàng qua cổng chính thức của họ.
2. Deploy 1 server nhỏ (Render/Railway, miễn phí) chạy đoạn code nhận webhook ở trên.
3. Chọn nơi lưu đơn hàng (Google Sheet là dễ nhất để bắt đầu).
4. Cập nhật `js/shop.js` để sinh mã đơn hàng và hiển thị mã đó cho khách khi chuyển khoản.

Nếu bạn muốn, mình có thể viết luôn server mẫu hoàn chỉnh (kèm Google Sheet) để bạn chỉ việc điền API key
và deploy — báo mình dùng SePay hay Casso, và bạn có sẵn tài khoản Google Sheet chưa nhé.
