# GAMEVAULT — Chợ bán acc game (GitHub Pages)

📌 Muốn tự động xác nhận thanh toán chuyển khoản (đối soát ngân hàng)? Xem
`apibank-huongdan/HUONG-DAN-APIBANK.md` — hướng dẫn dùng API chính chủ (SePay/Casso/PayOS),
**không dùng** các dịch vụ "giải captcha" đăng nhập lén internet banking vì vi phạm điều khoản ngân hàng.


Web bán hàng phong cách công nghệ cao cấp, dark mode, có animation (gradient nền động, hiệu ứng cuộn, viền gradient xoay khi hover...), 2 cổng **giao diện tách biệt hoàn toàn**:
- **`index.html`** — trang bán hàng cho khách: dark/glass, gradient tím-xanh, badge VIP, hiệu ứng cuộn xuất hiện
- **`admin.html`** — trang quản trị: dashboard sidebar riêng, tông xanh ngọc (emerald), có thẻ thống kê (tổng sản phẩm, sắp hết hàng, tổng giá trị kho, số sản phẩm VIP)

Không cần server, không cần database — dữ liệu sản phẩm nằm trong file `data/products.json`.

## Về hình ảnh sản phẩm
Vì Claude không có công cụ tạo ảnh AI, ảnh sản phẩm mẫu đang dùng nguồn ảnh placeholder ổn định (picsum.photos, ngẫu nhiên theo seed) để trang không bị vỡ link. Đây chỉ là ảnh minh hoạ tạm — vào **trang admin → sửa từng sản phẩm → dán link ảnh thật** (ảnh chụp sản phẩm thật, hoặc ảnh stock có quyền sử dụng) trước khi đưa web lên chính thức.

## Cấu trúc thư mục
```
shop/
├── index.html            ← trang bán hàng (dark/gradient)
├── admin.html             ← trang quản trị (dashboard riêng)
├── css/style.css           (giao diện trang bán)
├── css/admin.css            (giao diện trang quản trị — tách riêng, không dùng chung)
├── js/shop.js               (đổi số Zalo ở đây)
├── js/admin.js                (đổi mật khẩu admin ở đây)
└── data/products.json      ← dữ liệu sản phẩm
```

## Cách hoạt động (quan trọng, đọc kỹ)
Vì GitHub Pages chỉ host web tĩnh (không chạy server), trang admin **không thể tự động lưu** sản phẩm mới lên server. Quy trình thực tế:

1. Vào `admin.html`, đăng nhập, thêm/sửa/xoá sản phẩm — mọi thay đổi được lưu tạm trong trình duyệt (localStorage) của bạn.
2. Bấm **"Tải file products.json"** để xuất file mới.
3. Lên GitHub, thay file `data/products.json` cũ bằng file vừa tải (commit trực tiếp trên web GitHub hoặc `git push` từ máy).
4. Sau vài giây, GitHub Pages cập nhật, trang bán hàng (`index.html`) sẽ hiển thị sản phẩm mới cho **mọi khách truy cập**.

Nói cách khác: trang admin là công cụ soạn dữ liệu, còn việc "xuất bản" là bước bạn tự thay file trên GitHub. Đây là giới hạn chung của mọi web tĩnh không có backend.

⚠️ **Về bảo mật:** mật khẩu admin nằm ngay trong mã nguồn `js/admin.js`, mà mã nguồn này công khai trên GitHub. Nó chỉ ngăn người xem thường tình cờ vào trang admin, **không bảo vệ được dữ liệu thật sự** (vì `products.json` vốn đã công khai). Nếu sau này cần đăng nhập an toàn + lưu trực tiếp không qua bước tải/thay file, bạn sẽ cần một backend thật (ví dụ Firebase, Supabase, hoặc một server Node.js) — lúc đó nói mình, mình làm bản nâng cấp.

## Đưa lên GitHub Pages
1. Tạo repo mới trên GitHub, ví dụ `tiem-nho-shop`.
2. Upload toàn bộ nội dung thư mục `shop/` vào repo (kéo thả trên web GitHub hoặc dùng git).
3. Vào **Settings → Pages** trong repo.
4. Ở mục **Branch**, chọn `main` và thư mục `/ (root)`, bấm **Save**.
5. Đợi 1–2 phút, GitHub sẽ cho bạn một link dạng:
   `https://<ten-tai-khoan>.github.io/tiem-nho-shop/`
6. Trang bán hàng ở `.../` (tức `index.html`), trang admin ở `.../admin.html`.

## Trước khi public, nhớ đổi:
- `js/admin.js` → đổi `ADMIN_PASSWORD`
- `js/shop.js` → đổi `zaloPhone` thành số Zalo thật của bạn, đổi `shopName` nếu muốn tên khác "NEXORA"
- `data/products.json` → thay ảnh placeholder bằng ảnh sản phẩm thật, sửa tên/giá/mô tả (dùng admin để chỉnh rồi tải xuống)

## Chạy thử ở máy (trước khi đưa lên GitHub)
Không thể mở `index.html` trực tiếp bằng cách double-click (fetch JSON sẽ bị chặn bởi trình duyệt). Cần chạy qua local server, ví dụ:
```bash
cd shop
python3 -m http.server 8000
```
Rồi mở `http://localhost:8000` trên trình duyệt.
