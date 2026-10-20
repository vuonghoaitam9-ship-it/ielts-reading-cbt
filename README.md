# IELTS Academic Reading CBT — Computer-Delivered Simulator & Gemini 3 Flash AI Studio

Một nền tảng web hiện đại mô phỏng chính xác 100% giao diện thi thực tế IELTS Academic Reading trên máy tính (IDP Inspera CBT), tích hợp trí tuệ nhân tạo **Gemini 3 Flash Preview** (`gemini-3-flash-preview`) giúp:
1. **AI Multimodal OCR**: Tự động đọc và bóc tách bài thi từ file PDF đề thi hoặc ảnh scan/chụp các trang bài đọc & câu hỏi.
2. **AI Answer Key Parser**: Tự động đọc file PDF hoặc ảnh chụp bảng đáp án chuẩn (Answer Key), khớp chính xác từng câu 1–40.
3. **AI 6-Criteria Explanation Engine**: Tự động tạo lời giải sư phạm chi tiết 6 tiêu chuẩn học thuật (bằng chứng nguyên văn, vị trí đoạn văn, phân tích logic, dịch nghĩa & từ đồng nghĩa paraphrase, loại trừ phương án sai, bẫy & mẹo thi cử).
4. **1-Click Full Automation**: Chỉ 1 nút bấm `🚀 AI Đọc Toàn Diện` để xử lý từ File Đề + File PDF Đáp Án thành đề thi số hóa hoàn chỉnh kèm đầy đủ lời giải 6 bước!

---

## 🌟 Tính Năng Nổi Bật

### 1. Phòng Thi Mô Phỏng IELTS CBT Chuẩn IDP Inspera
- **2 khung cuộn độc lập (Split-Screen)**: Bài đọc bên trái, nhóm câu hỏi bên phải, có thanh trượt điều chỉnh độ rộng linh hoạt.
- **Menu nổi Highlight & Note (IDP Style)**: Bôi đen văn bản để mở popup tô vàng (`Alt+H`) hoặc thêm ghi chú (`Alt+N`), click đúp vào vệt highlight để xóa.
- **Định vị câu bằng chứng trực tiếp**: Ở chế độ xem lời giải, chỉ cần bấm **`Định vị bằng chứng`**, bài đọc sẽ tự động cuộn đến đúng câu và tô xanh nổi bật mà không làm mất vệt highlight vàng của học viên.
- **Thanh Palette câu hỏi**: Trực quan hóa câu đã làm, câu đánh dấu xem lại (Review flag), chuyển câu nhanh (`Phím ←` / `Phím →`).
- **Đồng hồ đếm ngược 60 phút**, tính điểm và ước tính Band Score tự động.
- **Đổi giao diện**: Nền trắng tiêu chuẩn, nền Sepia dịu mắt, nền Dark Mode ban đêm, phóng to/thu nhỏ cỡ chữ `Aa`.

### 2. Tích hợp AI Gemini 3 Flash Preview (`gemini-3-flash-preview`)
- **Đọc File Đề Thi (Passages & Câu hỏi)**: Hỗ trợ PDF, DOCX, TXT và ảnh chụp (.jpg, .png, .webp). Tự động nhận diện Passage 1–3, các đoạn A–H, và các dạng bài IELTS (True/False/Not Given, Yes/No/Not Given, Multiple Choice A/B/C/D, Điền từ Gap Fill, Matching Headings/Features).
- **Đọc File PDF Bảng Đáp Án (Answer Key Only)**: Hỗ trợ file PDF chỉ có đáp án hoặc ảnh chụp bảng kết quả. AI tự động trích xuất bảng đáp án chuẩn mà người dùng không cần gõ tay thủ công.
- **Lời Giải 6 Tiêu Chí Học Thuật**:
  1. *Đáp án chuẩn*: Giữ nguyên tuyệt đối từ file PDF đáp án của người dùng.
  2. *Bằng chứng nguyên văn*: Trích dẫn chính xác 100% câu chứa manh mối trong bài đọc.
  3. *Vị trí đoạn văn*: Nêu rõ Passage và nhãn đoạn văn (VD: Paragraph B).
  4. *Phân tích logic từng bước*: Tối thiểu 3 bước tư duy chứng minh đáp án.
  5. *Dịch nghĩa Tiếng Việt & Paraphrase*: Dịch nghĩa câu hỏi, câu dẫn chứng và bảng cặp từ đồng nghĩa.
  6. *Phân tích phương án sai & Bẫy/Mẹo*: Giải thích cặn kẽ vì sao các phương án khác sai cùng mẹo làm bài.
  7. *Xác thực*: VERIFIED (Đã xác minh bằng chứng) hoặc NEEDS_REVIEW (Cần kiểm tra lại nếu có mâu thuẫn).

---

## 🛠️ Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống
- [Node.js](https://nodejs.org/) phiên bản 18 trở lên.
- API Key miễn phí từ [Google AI Studio](https://aistudio.google.com/).

### Các Bước Cài Đặt

1. **Clone repository về máy:**
   ```bash
   git clone https://github.com/<your-username>/ielts-reading-cbt.git
   cd ielts-reading-cbt
   ```

2. **Cài đặt các thư viện cần thiết:**
   ```bash
   npm install
   ```

3. **Cấu hình API Key:**
   Tạo file `.env` từ `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Mở file `.env` và điền Gemini API Key của bạn:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Khởi chạy ứng dụng:**
   ```bash
   npm start
   ```
   Mở trình duyệt truy cập: **`http://localhost:3000`**

*(Lưu ý: Nếu không sử dụng Node.js server, bạn cũng có thể mở trực tiếp file `public/index.html` trong trình duyệt và nhập Gemini API Key ở biểu tượng cài đặt góc trên bên phải).*

---

## 📂 Cấu Trúc Thư Mục

```
ielts-reading-cbt/
├── .env.example          # File mẫu cấu hình biến môi trường
├── .gitignore            # Loại trừ node_modules và secrets (.env)
├── package.json          # Quản lý dependencies (@google/genai, express, cors, dotenv)
├── server.js             # Máy chủ Express & tích hợp Gemini 3 Flash Preview an toàn
├── public/
│   └── index.html        # Ứng dụng Single-Page Application (CBT Simulator, Studio UI, PDF.js)
└── README.md             # Tài liệu hướng dẫn sử dụng
```

---

## 📜 Giấy Phép (License)
Dự án được phát hành dưới giấy phép MIT License. Tự do sử dụng cho mục đích học tập và nghiên cứu.
