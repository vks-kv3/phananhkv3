
// Fix: Removed unused Type and incorrect ReportType import
import { GoogleGenAI } from "@google/genai";
import { Report } from "../types";

// Fix: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Firestore chỉ cho phép aiSummary dưới 2000 ký tự — cắt bớt để không làm hỏng việc lưu đơn
const AI_SUMMARY_MAX = 1950;

const clip = (text: string, max: number) =>
  text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';

// Lấy danh sách nguồn (văn bản pháp luật) mà Google Search đã dùng để trả lời
const extractSources = (response: any): { title: string; uri: string }[] => {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const seen = new Set<string>();
  const sources: { title: string; uri: string }[] = [];
  for (const c of chunks) {
    const uri = c?.web?.uri;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    sources.push({ title: c.web.title || uri, uri });
  }
  return sources;
};

export const analyzeReport = async (report: Partial<Report>) => {
  // Không gửi họ tên, số điện thoại, địa chỉ người phản ánh cho AI
  // (tuân thủ Luật Bảo vệ dữ liệu cá nhân) — AI chỉ cần nội dung vụ việc.
  const prompt = `
    Dưới đây là một đơn phản ánh từ người dân gửi đến Viện kiểm sát nhân dân.
    Hãy thực hiện, trình bày ngắn gọn, tổng cộng KHÔNG QUÁ 250 chữ:
    1. TÓM TẮT: nội dung vụ việc (dưới 80 chữ).
    2. MỨC ĐỘ: Thấp / Trung bình / Cao, kèm lý do một câu.
    3. CĂN CỨ PHÁP LÝ: tối đa 3 điều luật liên quan, ghi rõ số điều, tên và số hiệu văn bản
       (ví dụ: "Điều 187 Bộ luật Tố tụng dân sự 2015"). Dùng công cụ tìm kiếm để kiểm tra
       văn bản còn hiệu lực. Không bịa số điều; nếu không chắc thì ghi "cần cán bộ xác minh".

    Mục tiêu bảo vệ: ${report.targetType}
    Lĩnh vực: ${report.subCategory}
    Tiêu đề: ${report.title}
    Đối tượng bị phản ánh: ${report.targetName}
    Mô tả chi tiết: ${report.description}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.2,
        tools: [{ googleSearch: {} }],
      }
    });
    const text = (response.text || '').trim();
    const sources = extractSources(response).slice(0, 3);
    const sourceBlock = sources.length
      ? '\n\nNguồn tham khảo:\n' + sources.map(s => `- ${clip(s.title, 80)}: ${s.uri}`).join('\n')
      : '';
    // Ưu tiên giữ phần nguồn; cắt bớt phần phân tích nếu quá dài
    const body = clip(text, Math.max(200, AI_SUMMARY_MAX - sourceBlock.length));
    return clip(body + sourceBlock, AI_SUMMARY_MAX) || "Không thể thực hiện phân tích tự động lúc này.";
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "Không thể thực hiện phân tích tự động lúc này.";
  }
};

export const getLegalGuidance = async (history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  try {
    const response = await ai.models.generateContent({
      // Fix: Use gemini-3-pro-preview for complex legal reasoning tasks
      model: 'gemini-3-pro-preview',
      // Fix: Correctly map history to Content array instead of flattening parts
      contents: history.map(h => ({ role: h.role, parts: h.parts })),
      config: {
        systemInstruction: "Bạn là chuyên gia tư vấn pháp luật tại Việt Nam, hỗ trợ người dân thực hiện các thủ tục tố giác tội phạm và gửi phản ánh đến Viện kiểm sát. Hãy trả lời một cách trang trọng, chuyên nghiệp và chính xác dựa trên quy định pháp luật Việt Nam. Khi viện dẫn, ghi rõ số điều và số hiệu văn bản, dùng công cụ tìm kiếm để kiểm tra văn bản còn hiệu lực, không bịa số điều. Lưu ý ghi chú rằng thông tin chỉ mang tính chất tham khảo.",
        tools: [{ googleSearch: {} }],
      }
    });
    // Fix: Access .text property directly
    return response.text;
  } catch (error) {
    console.error("AI Chat error:", error);
    return "Rất tiếc, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.";
  }
};
