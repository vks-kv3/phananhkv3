
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
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Report, ReportStatus, Attachment } from '../types';

const COLLECTION_NAME = 'reports';

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

export const subscribeToReports = (callback: (reports: Report[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => doc.data() as Report);
    callback(reports);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const updateReportStatus = async (
  id: string, 
  status: ReportStatus, 
  resolutionResponse?: string,
  resolutionAttachments?: Attachment[]
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
};
