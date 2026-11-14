
export enum ReportStatus {
  PENDING = 'Chờ tiếp nhận',
  PROCESSING = 'Đang xử lý',
  RESOLVED = 'Đã giải quyết'
}

export enum ReportTargetType {
  VULNERABLE = 'Bảo vệ nhóm dễ bị tổn thương',
  PUBLIC_INTEREST = 'Bảo vệ nhóm lợi ích công'
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64 string
}

export const VULNERABLE_GROUPS = [
  'Trẻ em theo quy định của Luật Trẻ em',
  'Người cao tuổi theo quy định của Luật Người cao tuổi',
  'Người khuyết tật theo quy định của Luật Người khuyết tật',
  'Phụ nữ đang mang thai hoặc đang nuôi con dưới 36 tháng tuổi',
  'Người có khó khăn trong nhận thức, làm chủ hành vi và người mất năng lực hành vi dân sự theo quy định của Bộ luật Dân sự',
  'Người dân tộc thiểu số cư trú tại vùng có điều kiện kinh tế - xã hội đặc biệt khó khăn theo quy định của pháp luật'
];

export const PUBLIC_INTEREST_GROUPS = [
  'Đầu tư công',
  'Đất đai, tài nguyên, tài sản công khác',
  'Môi trường, hệ sinh thái',
  'Di sản văn hóa',
  'An toàn thực phẩm, dược phẩm',
  'Bảo vệ quyền lợi người tiêu dùng'
];

export interface Report {
  id: string;
  targetType: ReportTargetType;
  reporterRole?: 'Bản thân' | 'Người thân';
  subCategory: string;
  citizenName: string;
  birthYear: string;
  address: string;
  phoneNumber: string;
  email?: string;
  targetName: string; // Tên cơ quan, tổ chức, cá nhân bị phản ánh
  targetAddress: string; // Địa chỉ đối tượng bị phản ánh
  title: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  aiSummary?: string;
  attachments?: Attachment[];
  resolutionResponse?: string; // Nội dung trả lời giải quyết từ VKS
  resolutionAttachments?: Attachment[]; // Tài liệu đính kèm trả lời giải quyết
  trackingCode?: string; // Mã tra cứu cấp cho người dân sau khi gửi đơn
}

// Bản ghi công khai để người dân tra cứu tiến độ bằng mã số.
// Chỉ chứa trạng thái và nội dung trả lời, KHÔNG chứa thông tin cá nhân.
export interface TrackingRecord {
  code: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  resolutionResponse?: string;
}
