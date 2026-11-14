
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  setDoc,
  getDoc,
  getDocFromServer,
  Bytes
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Report, ReportStatus, Attachment, TrackingRecord, EncryptedReportDoc, EncryptionConfig } from '../types';

const COLLECTION_NAME = 'reports';
const TRACKING_COLLECTION = 'tracking';
const ENCRYPTION_CONFIG = ['config', 'encryption'] as const;

// Đổi kiểu Bytes của Firestore sang Uint8Array cho khối dữ liệu mã hóa
const fromFirestore = (data: any): Report | EncryptedReportDoc => {
  if (data?.enc?.data instanceof Bytes) {
    return { ...data, enc: { ...data.enc, data: data.enc.data.toUint8Array() } };
  }
  return data;
};

// Khóa công khai dùng để mã hóa đơn (null nếu chưa bật mã hóa)
export const getEncryptionConfig = async (): Promise<EncryptionConfig | null> => {
  const snap = await getDoc(doc(db, ...ENCRYPTION_CONFIG));
  return snap.exists() ? (snap.data() as EncryptionConfig) : null;
};

// Chỉ quản trị viên: lưu khóa công khai để bật mã hóa (quy tắc chỉ cho tạo 1 lần)
export const setEncryptionConfig = async (config: EncryptionConfig): Promise<void> => {
  await setDoc(doc(db, ...ENCRYPTION_CONFIG), config);
};

export const saveEncryptedReport = async (report: EncryptedReportDoc): Promise<void> => {
  try {
    await setDoc(doc(db, COLLECTION_NAME, report.id), {
      ...report,
      enc: { ...report.enc, data: Bytes.fromUint8Array(report.enc.data) },
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${report.id}`);
  }
};

// Bảng chữ không có ký tự dễ nhầm (0/O, 1/I/L) để người dân đọc, chép lại dễ dàng
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// Sinh mã tra cứu dạng KV3-XXXX-XXXX (khoảng 850 tỷ tổ hợp, không đoán được)
export const generateTrackingCode = (): string => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `KV3-${chars.slice(0, 4)}-${chars.slice(4)}`;
};

// Chuẩn hoá mã người dân nhập: bỏ khoảng trắng, viết hoa, tự thêm dấu gạch
export const normalizeTrackingCode = (input: string): string => {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^KV3/, '');
  if (raw.length !== 8) return input.trim().toUpperCase();
  return `KV3-${raw.slice(0, 4)}-${raw.slice(4)}`;
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection as required
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export const saveReport = async (report: Report): Promise<void> => {
  try {
    // We use setDoc with report.id as the document ID
    await setDoc(doc(db, COLLECTION_NAME, report.id), report);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${report.id}`);
  }
};

// Tạo bản ghi tra cứu công khai. Lỗi ở bước này KHÔNG làm hỏng việc gửi đơn
// (ví dụ khi quy tắc Firestore mới chưa được triển khai) — chỉ trả về false.
export const createTrackingRecord = async (report: Report): Promise<boolean> => {
  if (!report.trackingCode) return false;
  const record: TrackingRecord = {
    code: report.trackingCode,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.createdAt,
  };
  try {
    await setDoc(doc(db, TRACKING_COLLECTION, report.trackingCode), record);
    return true;
  } catch (error) {
    console.error('Không tạo được mã tra cứu:', error);
    return false;
  }
};

export const getTrackingRecord = async (code: string): Promise<TrackingRecord | null> => {
  const snap = await getDoc(doc(db, TRACKING_COLLECTION, normalizeTrackingCode(code)));
  return snap.exists() ? (snap.data() as TrackingRecord) : null;
};

export const getAllReports = async (): Promise<Report[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Report);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const subscribeToReports = (callback: (reports: (Report | EncryptedReportDoc)[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(d => fromFirestore(d.data()));
    callback(reports);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const updateReportStatus = async (
  id: string, 
  status: ReportStatus, 
  resolutionResponse?: string,
  resolutionAttachments?: Attachment[],
  trackingCode?: string
): Promise<void> => {
  try {
    const reportRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { status };
    
    if (resolutionResponse !== undefined) {
      updateData.resolutionResponse = resolutionResponse;
    }
    if (resolutionAttachments !== undefined) {
      updateData.resolutionAttachments = resolutionAttachments;
    }
    
    await updateDoc(reportRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }

  // Đồng bộ trạng thái sang bản ghi tra cứu công khai (không chặn nếu lỗi)
  if (trackingCode) {
    try {
      const trackingUpdate: Partial<TrackingRecord> = { status, updatedAt: new Date().toISOString() };
      if (resolutionResponse !== undefined) trackingUpdate.resolutionResponse = resolutionResponse;
      await updateDoc(doc(db, TRACKING_COLLECTION, trackingCode), trackingUpdate);
    } catch (error) {
      console.error('Không cập nhật được bản ghi tra cứu:', error);
    }
  }
};
