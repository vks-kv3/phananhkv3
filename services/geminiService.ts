
// Fix: Removed unused Type and incorrect ReportType import
import { GoogleGenAI } from "@google/genai";
import { Report } from "../types";

// Fix: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeReport = async (report: Partial<Report>) => {
  const prompt = `
    Dưới đây là một đơn phản ánh từ người dân gửi đến cơ quan Viện kiểm sát. 
    Hãy thực hiện:
    1. Tóm tắt ngắn gọn nội dung vụ việc (dưới 100 chữ).
    2. Phân loại mức độ nghiêm trọng (Thấp, Trung bình, Cao).
    3. Gợi ý điều luật hoặc lĩnh vực pháp lý liên quan (nếu có thể).

    Tiêu đề: ${report.title}
    Loại bảo vệ: ${report.targetType}
    Người phản ánh: ${report.citizenName}
    Đối tượng bị phản ánh: ${report.targetName}
    Địa chỉ đối tượng bị phản ánh: ${report.targetAddress}
    Mô tả chi tiết: ${report.description}
    Thời gian tạo: ${report.createdAt}
    Địa chỉ người phản ánh: ${report.address}
  `;

  try {
    const response = await ai.models.generateContent({
      // Using gemini-3-flash-preview for summarization and classification
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    // Fix: Access .text property directly, do not call as a method
    return response.text;
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
        systemInstruction: "Bạn là chuyên gia tư vấn pháp luật tại Việt Nam, hỗ trợ người dân thực hiện các thủ tục tố giác tội phạm và gửi phản ánh đến Viện kiểm sát. Hãy trả lời một cách trang trọng, chuyên nghiệp và chính xác dựa trên quy định pháp luật Việt Nam. Lưu ý ghi chú rằng thông tin chỉ mang tính chất tham khảo.",
      }
    });
    // Fix: Access .text property directly
    return response.text;
  } catch (error) {
    console.error("AI Chat error:", error);
    return "Rất tiếc, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.";
  }
};
