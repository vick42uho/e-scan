// @ts-ignore - Ignore module not found if zxing-wasm is missing
import { readBarcodesFromImageData } from 'zxing-wasm/reader';
import { DecodedBarcode } from '@/types/scan';

import { detectBarcodesViaApi } from '@/services/scan-api';

export async function decodeBarcodesFromBlob(blob: Blob, fileName?: string): Promise<DecodedBarcode[]> {
  const isPdf = blob.type === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');
  
  if (isPdf) {
    return detectBarcodesViaApi(blob, fileName);
  }

  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const results = await readBarcodesFromImageData(imageData, {
      tryHarder: true,
      maxNumberOfSymbols: 5,
      formats: ['QRCode', 'Code128', 'Code39', 'EAN13', 'DataMatrix']
    });
    
    return results.map((r: any) => ({ text: r.text, format: r.format }));
  } catch (error) {
    // Fallback to backend API
    return detectBarcodesViaApi(blob, fileName);
  }
}

export async function decodeHeaderBarcode(blob: Blob): Promise<DecodedBarcode | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height * 0.25; // Top 25%
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(bitmap, 0, 0, bitmap.width, canvas.height, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const results = await readBarcodesFromImageData(imageData, {
      tryHarder: true,
      maxNumberOfSymbols: 1,
    });
    
    if (results.length > 0) {
      return { text: results[0].text, format: results[0].format };
    }
    return null;
  } catch (error) {
    console.error("Header barcode decoding error:", error);
    return null;
  }
}

export interface ParsedBarcodeMetadata {
  hn?: string;
  en?: string;
  doctype?: string;
  dob?: string;
  age?: string;
  visit_date?: string;
  visit_time?: string;
  category_id?: number;
  category_code?: string;
  category_name?: string;
  title?: string;
  patient_name?: string;
  doctor_name?: string;
  document_code?: string;
  encounter_type?: 'OPD' | 'IPD' | 'O+I';
}

/**
 * Parses pipe-separated or key-value barcode payloads:
 * e.g. "HN=00000001|VN=OP26070000001|Doctype=OPD-NOTE|DOB=2006-01-08 17:00:00.000"
 * Also matches Doctype against document_categories by code, category_type, or names.
 */
export function parseBarcodePayload(
  text: string,
  categories: any[] = []
): ParsedBarcodeMetadata | null {
  if (!text || !text.trim()) return null;
  const raw = text.trim();
  const result: ParsedBarcodeMetadata = {};

  // Check if it's Key=Value or Key:Value format
  if (raw.includes('=') || raw.includes(':') || raw.includes('|')) {
    const parts = raw.split(/[|\n;]+/).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      let key = '';
      let val = '';
      if (part.includes('=')) {
        const idx = part.indexOf('=');
        key = part.substring(0, idx).trim().toUpperCase();
        val = part.substring(idx + 1).trim();
      } else if (part.includes(':')) {
        const idx = part.indexOf(':');
        key = part.substring(0, idx).trim().toUpperCase();
        val = part.substring(idx + 1).trim();
      }

      if (!key || !val) continue;

      if (['HN', 'H.N.', 'PID', 'HOSPITAL_NO'].includes(key)) {
        result.hn = val;
      } else if (['VN', 'EN', 'V.N.', 'E.N.', 'VISIT', 'ENCOUNTER'].includes(key)) {
        result.en = val;
        if (val.toUpperCase().startsWith('OP') || val.toUpperCase().startsWith('VN')) {
          result.encounter_type = 'OPD';
        } else if (val.toUpperCase().startsWith('IP')) {
          result.encounter_type = 'IPD';
        }
      } else if (['DOCTYPE', 'DOC_TYPE', 'DOC-TYPE', 'CATEGORY', 'CAT', 'CATEGORY_TYPE', 'DOCUMENT_TYPE'].includes(key)) {
        result.doctype = val;
      } else if (['DOB', 'BIRTHDATE', 'BIRTH_DATE', 'DATE_OF_BIRTH'].includes(key)) {
        // Strip timestamps like 17:00:00.000
        const dateMatch = val.match(/^(\d{4}-\d{1,2}-\d{1,2})/);
        result.dob = dateMatch ? dateMatch[1] : val;
        // Age calculation
        if (dateMatch) {
          const birthYear = parseInt(dateMatch[1].split('-')[0], 10);
          const birthMonth = parseInt(dateMatch[1].split('-')[1], 10);
          const birthDay = parseInt(dateMatch[1].split('-')[2], 10);
          const now = new Date();
          let age = now.getFullYear() - birthYear;
          if (now.getMonth() + 1 < birthMonth || (now.getMonth() + 1 === birthMonth && now.getDate() < birthDay)) {
            age--;
          }
          if (age >= 0 && age < 130) {
            result.age = `${age} ปี`;
          }
        }
      } else if (['VISIT_DATE', 'VISITDATE', 'DATE'].includes(key)) {
        const dateMatch = val.match(/^(\d{4}-\d{1,2}-\d{1,2})/);
        result.visit_date = dateMatch ? dateMatch[1] : val;
        const timeMatch = val.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?\b/);
        if (timeMatch && !result.visit_time) {
          result.visit_time = timeMatch[0];
        }
      } else if (['VISIT_TIME', 'VISITTIME', 'TIME'].includes(key)) {
        const timeMatch = val.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?\b/);
        result.visit_time = timeMatch ? timeMatch[0] : val;
      } else if (['NAME', 'PATIENT_NAME', 'PATIENTNAME'].includes(key)) {
        result.patient_name = val;
      } else if (['DOCTOR', 'DOCTOR_NAME', 'DOC_NAME'].includes(key)) {
        result.doctor_name = val;
      } else if (['DOC_CODE', 'DOCUMENT_CODE', 'FORM_NO'].includes(key)) {
        result.document_code = val;
      }
    }
  } else {
    // Single-field barcode / QR code fallback
    if (/^\d{2}-?\d{2}-?\d{5,6}$/.test(raw) || /^\d{6,12}$/.test(raw)) {
      result.hn = raw;
    } else if (raw.startsWith('OP') || raw.startsWith('IP') || raw.startsWith('EN-') || raw.startsWith('VN-') || raw.startsWith('CP') || raw.startsWith('CIP')) {
      let norm = raw;
      if (norm.startsWith('CIP')) norm = 'OP' + norm.substring(3);
      else if (norm.startsWith('CP')) norm = 'OP' + norm.substring(2);
      result.en = norm;
      if (norm.startsWith('OP') || norm.startsWith('VN')) result.encounter_type = 'OPD';
      if (norm.startsWith('IP')) result.encounter_type = 'IPD';
    } else if (raw.startsWith('FM-') || raw.startsWith('DOC-') || raw.startsWith('SUR-')) {
      result.document_code = raw;
    }
  }

  // Resolve doctype against categories if provided
  if (result.doctype && Array.isArray(categories) && categories.length > 0) {
    const docClean = result.doctype.trim().toLowerCase();
    const matched = categories.find((c) => {
      const code = (c.code || '').toLowerCase();
      const type = (c.category_type || '').toLowerCase();
      const en = (c.name_en || '').toLowerCase();
      const th = (c.name_th || '').toLowerCase();
      return (
        code === docClean ||
        type === docClean ||
        en === docClean ||
        th === docClean ||
        code.includes(docClean) ||
        docClean.includes(code) ||
        type.includes(docClean)
      );
    });
    if (matched) {
      result.category_id = matched.id;
      result.category_code = matched.code;
      result.category_name = matched.name_th || matched.name_en;
      result.title = matched.name_th || matched.name_en;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}
