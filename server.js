require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Cho phép payload lớn để nhận nhiều ảnh scan/chụp đề thi độ phân giải cao
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Khởi tạo Gemini SDK an toàn ở phía Server
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_actual_gemini_api_key_here') {
    throw new Error('Chưa cấu hình GEMINI_API_KEY hợp lệ trong file .env ở phía máy chủ.');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * API 1: BƯỚC 1 — AI MULTIMODAL OCR & LAYOUT EXTRACTION
 * Nhận danh sách ảnh (theo thứ tự đã sắp xếp/xoay) và/hoặc văn bản thô,
 * trả về cấu trúc JSON bài thi IELTS Reading nguyên bản tuyệt đối.
 */
app.post('/api/ocr-extract', async (req, res) => {
  try {
    const { images = [], rawText = '', testTitle = 'IELTS Academic Reading Test' } = req.body;
    const ai = getAIClient();

    const systemInstruction = `
Bạn là chuyên gia số hóa đề thi IELTS Academic Reading chính xác tuyệt đối (Zero-Hallucination OCR & Layout Parser).
NHIỆM VỤ:
1. Đọc toàn bộ các trang ảnh và/hoặc văn bản theo đúng thứ tự người dùng tải lên để ghép thành bài thi IELTS Reading hoàn chỉnh.
2. GIỮ NGUYÊN VĂN BẢN GỐC (Verbatim 100%): Giữ nguyên tiêu đề, phụ đề, nhãn đoạn văn (A, B, C...), số thứ tự câu hỏi, giới hạn từ (VD: "ONE WORD ONLY", "NO MORE THAN TWO WORDS AND/OR A NUMBER"), các phương án A/B/C/D, bảng biểu và sơ đồ. Tuyệt đối KHÔNG tự ý viết lại, tóm tắt hay lược bỏ bất kỳ câu nào.
3. XỬ LÝ CHỖ MỜ / KHÔNG RÕ RÀNG: Nếu có chữ bị mờ, mất góc hoặc không chắc chắn 100%, bạn PHẢI giữ vị trí đó bằng ký hiệu [[UNCLEAR: chữ_đoán_tạm]] và liệt kê vào mảng "unclearFlags" để người dùng xác nhận. Tuyệt đối không tự đoán mò âm thầm.
4. PHÂN LOẠI DẠNG CÂU HỎI CHUẨN IELTS:
   - "tfng": TRUE / FALSE / NOT GIVEN
   - "ynng": YES / NO / NOT GIVEN
   - "mcq": Trắc nghiệm A / B / C / D
   - "gap_fill": Điền từ vào chỗ trống (Note / Summary / Table / Sentence / Diagram completion) - dùng ký hiệu "____" tại vị trí cần điền trong prompt.
   - "matching": Nối thông tin (Matching Headings / Matching Features / Matching Paragraph Information A-H)

Hãy trả về duy nhất một chuỗi JSON hợp lệ theo đúng cấu trúc sau (không bọc trong markdown code block):
{
  "title": "Tên bài thi",
  "unclearFlags": [
    { "location": "Passage 1 - Đoạn B hoặc Câu 5", "snippet": "[[UNCLEAR: ...]]", "reason": "Ảnh bị mờ/lóa sáng" }
  ],
  "passages": [
    {
      "id": "p1",
      "number": 1,
      "title": "Tiêu đề Passage 1",
      "subtitle": "Phụ đề nếu có",
      "paragraphs": [
        { "label": "A", "text": "Nội dung nguyên văn đoạn A..." },
        { "label": "B", "text": "Nội dung nguyên văn đoạn B..." }
      ],
      "questionGroups": [
        {
          "id": "g1",
          "rangeLabel": "Questions 1–5",
          "instruction": "Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE or NOT GIVEN.",
          "wordLimit": "",
          "type": "tfng",
          "sharedOptions": ["TRUE", "FALSE", "NOT GIVEN"],
          "questions": [
            {
              "qNum": 1,
              "type": "tfng",
              "prompt": "Nội dung nguyên văn câu hỏi số 1...",
              "options": ["TRUE", "FALSE", "NOT GIVEN"]
            }
          ]
        }
      ]
    }
  ]
}`;

    const contents = [];

    // Đính kèm từng ảnh theo đúng thứ tự người dùng đã sắp xếp
    images.forEach((imgDataUrl, idx) => {
      const match = imgDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
        contents.push(`Trang ảnh thứ #${idx + 1}`);
      }
    });

    if (rawText && rawText.trim()) {
      contents.push(`Văn bản bổ sung do người dùng cung cấp:\n${rawText}`);
    }

    contents.push(`Hãy trích xuất toàn bộ nội dung đề thi "${testTitle}" thành định dạng JSON chuẩn.`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const parsed = JSON.parse(response.text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('OCR Extract Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi gọi AI OCR trích xuất đề thi.'
    });
  }
});

/**
 * API 2: BƯỚC 4 — AI TẠO LỜI GIẢI CHI TIẾT (6 TIÊU CHÍ SƯ PHẠM)
 * Đối chiếu chặt chẽ với đáp án chuẩn do người dùng nhập.
 */
app.post('/api/generate-explanations', async (req, res) => {
  try {
    const { testData, officialAnswers } = req.body;
    const ai = getAIClient();

    const systemInstruction = `
Bạn là Chuyên gia học thuật IELTS Reading 9.0.
NHIỆM VỤ QUAN TRỌNG:
Người dùng cung cấp đề thi IELTS Reading ("testData") và BỘ ĐÁP ÁN CHUẨN ("officialAnswers").
1. TUYỆT ĐỐI TÔN TRỌNG ĐÁP ÁN CHUẨN: Không tự ý sửa đổi đáp án chuẩn của người dùng.
2. Với TỪNG CÂU HỎI, hãy phân tích và trả về đầy đủ 6 mục bắt buộc:
   - "officialAnswer": Đáp án chuẩn do người dùng cung cấp.
   - "evidenceQuote": Trích dẫn NGUYÊN VĂN (chính xác từng chữ) câu hoặc cụm từ trong bài đọc làm bằng chứng.
   - "paragraphRef": Nhãn đoạn văn chứa bằng chứng (VD: "Passage 1 - Đoạn B").
   - "logicalSteps": Giải thích logic từng bước vì sao bằng chứng đó dẫn tới đáp án chuẩn.
   - "vietnameseTranslationAndSynonyms": Diễn giải tiếng Việt dễ hiểu + chỉ rõ cặp từ đồng nghĩa / Paraphrase giữa Câu hỏi và Bài đọc (VD: "rapidly" = "at a breakneck pace").
   - "whyOthersWrong": Nếu là trắc nghiệm (MCQ / Matching / TFNG), giải thích rõ vì sao các lựa chọn còn lại sai hoặc Not Given.
   - "trapAndTip": Nêu bẫy thường gặp (Distractor) ở câu này và mẹo làm dạng bài đó.
   - "verificationStatus": Ghi "VERIFIED" nếu tìm thấy bằng chứng rõ ràng khớp với đáp án chuẩn. Nếu KHÔNG tìm thấy bằng chứng rõ ràng hoặc đáp án chuẩn có vẻ mâu thuẫn với bài đọc, BẮT BUỘC ghi "NEEDS_REVIEW" (Cần kiểm tra lại) và nêu rõ nhận định của AI trong phần "aiNote", tuyệt đối không bịa lời giải ép buộc.

Trả về JSON theo cấu trúc:
{
  "explanations": {
    "1": {
      "qNum": 1,
      "officialAnswer": "...",
      "verificationStatus": "VERIFIED",
      "aiNote": "Đáp án khớp hoàn toàn với bằng chứng trong văn bản.",
      "paragraphRef": "Passage 1 - Paragraph A",
      "evidenceQuote": "Câu trích dẫn nguyên văn từ bài đọc...",
      "logicalSteps": "Bước 1... Bước 2... Bước 3...",
      "vietnameseTranslationAndSynonyms": "Dịch nghĩa + Bảng từ đồng nghĩa...",
      "whyOthersWrong": "Giải thích các lựa chọn sai...",
      "trapAndTip": "Bẫy thường gặp và mẹo..."
    }
  }
}`;

    const prompt = `
ĐỀ THI IELTS READING:
${JSON.stringify(testData)}

ĐÁP ÁN CHUẨN DO NGƯỜI DÙNG CUNG CẤP:
${JSON.stringify(officialAnswers)}

Hãy tạo lời giải chi tiết cho toàn bộ các câu hỏi theo đúng 6 tiêu chí quy định.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.15
      }
    });

    const parsed = JSON.parse(response.text);
    res.json({ success: true, explanations: parsed.explanations || {} });
  } catch (error) {
    console.error('Explanation Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi tạo lời giải chi tiết bằng AI.'
    });
  }
});

/**
 * API 3: AI ĐỌC & TRÍCH XUẤT FILE PDF/ẢNH ĐÁP ÁN (ANSWER KEY ONLY)
 * Nhận file PDF/ảnh chỉ có đáp án, trả về object { "1": "TRUE", "2": "FALSE", ... }
 */
app.post('/api/extract-answers', async (req, res) => {
  try {
    const { answerImages = [], rawAnswerText = '' } = req.body;
    const ai = getAIClient();

    const systemInstruction = `
Bạn là chuyên gia số hóa bảng đáp án IELTS (IELTS Answer Key Extractor) cực kỳ chính xác.
NHIỆM VỤ:
1. Đọc toàn bộ các trang ảnh hoặc văn bản từ file PDF/ảnh đáp án do người dùng cung cấp.
2. Trích xuất chính xác cặp [Số thứ tự câu hỏi: Đáp án chuẩn].
3. Chuẩn hóa:
   - True/False/Not Given -> "TRUE", "FALSE", "NOT GIVEN"
   - Yes/No/Not Given -> "YES", "NO", "NOT GIVEN"
   - Trắc nghiệm -> "A", "B", "C", "D"
   - Điền từ -> Giữ nguyên từ đáp án (nếu có các đáp án thay thế như "colour / color" hoặc dấu ngoặc, hãy giữ nguyên hoặc ưu tiên từ chuẩn).
4. Sắp xếp thứ tự các câu theo số thứ tự tăng dần từ 1 đến hết.

Trả về duy nhất định dạng JSON (không có markdown):
{
  "officialAnswers": {
    "1": "FALSE",
    "2": "TRUE",
    "3": "NOT GIVEN",
    "4": "light"
  },
  "totalDetected": 4,
  "notes": "Đã trích xuất thành công 4 đáp án."
}`;

    const contents = [];

    answerImages.forEach((imgDataUrl, idx) => {
      const match = imgDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
        contents.push(`Trang tài liệu đáp án #${idx + 1}`);
      }
    });

    if (rawAnswerText && rawAnswerText.trim()) {
      contents.push(`Văn bản bảng đáp án bổ sung:\n${rawAnswerText}`);
    }

    contents.push('Hãy trích xuất toàn bộ đáp án chuẩn từ tài liệu trên thành JSON chuẩn.');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const parsed = JSON.parse(response.text);
    res.json({
      success: true,
      officialAnswers: parsed.officialAnswers || {},
      totalDetected: parsed.totalDetected || Object.keys(parsed.officialAnswers || {}).length,
      notes: parsed.notes || ''
    });
  } catch (error) {
    console.error('Answer Extract Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi trích xuất đáp án từ file PDF/ảnh đáp án.'
    });
  }
});

// Kiểm tra trạng thái cấu hình Server API Key
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'your_actual_gemini_api_key_here'
  );
  res.json({ ok: true, aiConfigured: hasKey });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 IELTS Reading CBT Studio đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔒 Chế độ bảo mật API Key phía Server: ĐÃ BẬT`);
  console.log(`====================================================`);
});