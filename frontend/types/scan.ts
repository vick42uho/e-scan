export interface ScannerDevice {
  id: string;
  name: string;
}

export interface DecodedBarcode {
  text: string;
  format: string;
}

export interface ScannedPage {
  id: string;
  dataUrl: string;
  blob: Blob;
  fileName: string;
  barcodes: DecodedBarcode[];
}

export interface DocumentCategoryOption {
  id: number;
  code: string;
  name_th: string;
  name_en: string;
  category_type: string;
}

export interface CreateCategoryPayload {
  name_th: string;
  name_en?: string;
  code?: string;
  category_type?: string;
}

export interface PatientLookupResult {
  found: boolean;
  hn?: string;
  name_th?: string;
  name_en?: string;
  gender?: string;
  dob?: string;
  age?: string;
  en?: string;
  visit_date?: string;
  visit_time?: string;
  encounter_type?: 'OPD' | 'IPD' | 'O+I';
  department_name?: string;
  doctor_name?: string;
  message?: string;
}

export interface EncounterOption {
  en: string;
  visit_date: string;
  visit_time?: string;
  encounter_type: string;
  doctor_name?: string;
  department_name?: string;
}

export type ExtractionMode = 'auto' | 'barcode' | 'pdf_text' | 'ocr';

export interface ExtractedMetadata {
  hn?: string;
  en?: string;
  name?: string;
  name_th?: string;
  name_en?: string;
  age?: string;
  dob?: string;
  visit_date?: string;
  visit_time?: string;
  title?: string;
  category_id?: number;
  category_code?: string;
  category_name?: string;
  document_code?: string;
  doctor_name?: string;
  encounter_type?: 'OPD' | 'IPD' | 'O+I';
  raw_barcodes?: DecodedBarcode[];
}

export interface ExtractionResponse {
  status: string;
  mode_used: string;
  confidence: number;
  data: ExtractedMetadata;
  raw_text_snippet?: string;
}

export interface ScanFormData {
  hn: string;
  patient_name?: string;
  age?: string;
  dob?: string;
  en: string;
  visit_date?: string;
  visit_time?: string;
  title: string;
  category_id: number;
  document_code: string;
  doctor_code: string;
  doctor_name: string;
  encounter_type: 'OPD' | 'IPD' | 'O+I';
  is_doctor_document: boolean;
  is_confidential?: boolean;
}

export interface UploadResult {
  status: string;
  document_id?: string;
  title?: string;
  total_pages?: number;
  message?: string;
}
