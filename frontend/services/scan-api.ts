import { fetchApi, API_BASE_URL } from './api-client';
import { 
  DocumentCategoryOption, 
  CreateCategoryPayload,
  PatientLookupResult,
  EncounterOption, 
  ScanFormData, 
  UploadResult 
} from '@/types/scan';

export async function getCategories(): Promise<DocumentCategoryOption[]> {
  return fetchApi<DocumentCategoryOption[]>('/scan/categories');
}

export async function createCategory(payload: CreateCategoryPayload): Promise<DocumentCategoryOption> {
  const res = await fetch(`${API_BASE_URL}/scan/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'ไม่สามารถสร้างหมวดหมู่เอกสารได้');
  }

  return res.json();
}

export async function lookupPatientOrEncounter(query: string): Promise<PatientLookupResult> {
  const params = new URLSearchParams({ query });
  const res = await fetch(`${API_BASE_URL}/scan/patient-lookup?${params.toString()}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'เกิดข้อผิดพลาดในการค้นหาข้อมูล');
  }

  return res.json();
}

export async function getEncounters(hn: string): Promise<EncounterOption[]> {
  return fetchApi<EncounterOption[]>(`/scan/encounters/${hn}`);
}

export async function uploadDocument(file: Blob, fileName: string, formData: ScanFormData): Promise<UploadResult> {
  const data = new FormData();
  data.append('file', file, fileName);
  
  Object.entries(formData).forEach(([key, value]) => {
    data.append(key, String(value));
  });
  
  // Placeholder scan_by values
  data.append('scan_by_id', 'SYSTEM');
  data.append('scan_by_name', 'ระบบทดสอบ');
  data.append('scan_by_role', 'Staff');

  const res = await fetch(`${API_BASE_URL}/scan/upload`, {
    method: 'POST',
    body: data,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || errorData.message || `เกิดข้อผิดพลาดในการบันทึกเอกสาร (HTTP ${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export async function uploadAdditionalPage(documentId: string, file: Blob, fileName: string, pageLabel?: string): Promise<UploadResult> {
  const data = new FormData();
  data.append('file', file, fileName);
  if (pageLabel) {
    data.append('page_label', pageLabel);
  }

  const res = await fetch(`${API_BASE_URL}/scan/upload-page/${documentId}`, {
    method: 'POST',
    body: data,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || errorData.message || `เกิดข้อผิดพลาดในการเพิ่มหน้าเอกสาร (HTTP ${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export async function extractMetadata(
  file: Blob,
  fileName: string,
  mode: string = 'auto'
): Promise<import('@/types/scan').ExtractionResponse> {
  const data = new FormData();
  data.append('file', file, fileName);
  data.append('mode', mode);

  const res = await fetch(`${API_BASE_URL}/scan/extract-metadata`, {
    method: 'POST',
    body: data,
  });

  if (!res.ok) {
    throw new Error('Metadata extraction failed');
  }

  return res.json();
}

export async function detectBarcodesViaApi(file: Blob, fileName?: string): Promise<{ text: string; format: string }[]> {
  try {
    const data = new FormData();
    data.append('file', file, fileName || 'document');

    const res = await fetch(`${API_BASE_URL}/scan/detect-barcode`, {
      method: 'POST',
      body: data,
    });

    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.error('API barcode detection error:', err);
    return [];
  }
}



