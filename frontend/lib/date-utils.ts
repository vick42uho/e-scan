/**
 * Date and Age calculation utilities for Yanhee e-Scan DMS
 * Supports Thai Buddhist Era (พ.ศ.), English Gregorian Era (A.D.),
 * Thai month names, and various medical chart formats.
 */

export const THAI_MONTHS: Record<string, number> = {
  'ม.ค.': 1, 'มกราคม': 1,
  'ก.พ.': 2, 'กุมภาพันธ์': 2,
  'มี.ค.': 3, 'มีนาคม': 3,
  'เม.ย.': 4, 'เมษายน': 4,
  'พ.ค.': 5, 'พฤษภาคม': 5,
  'มิ.ย.': 6, 'มิถุนายน': 6,
  'ก.ค.': 7, 'กรกฎาคม': 7,
  'ส.ค.': 8, 'สิงหาคม': 8,
  'ก.ย.': 9, 'กันยายน': 9,
  'ต.ค.': 10, 'ตุลาคม': 10,
  'พ.ย.': 11, 'พฤศจิกายน': 11,
  'ธ.ค.': 12, 'ธันวาคม': 12,
};

/**
 * Calculates patient age based on current date and birth date.
 * Handles Thai Buddhist Era (พ.ศ. > 2400) automatically.
 */
export function calculateAgeFromDob(dobStr?: string | null): string | null {
  if (!dobStr || !dobStr.trim()) return null;
  const trimmed = dobStr.trim();

  let birthDay = 1;
  let birthMonth = 1;
  let birthYear: number | null = null;

  // 1. Format: "15 พ.ค. 2535" or "15 พฤษภาคม 2535"
  const thaiTextMatch = trimmed.match(/^(\d{1,2})\s*([^\d\s]+)\s*(\d{4})$/);
  if (thaiTextMatch) {
    birthDay = parseInt(thaiTextMatch[1], 10);
    const monthText = thaiTextMatch[2];
    birthMonth = THAI_MONTHS[monthText] || 1;
    birthYear = parseInt(thaiTextMatch[3], 10);
  } else if (/^(\d{4})-(\d{1,2})-(\d{1,2})/.test(trimmed)) {
    // 2. ISO Format: "1992-05-15" or "2006-01-08 17:00:00.000" or "2535-05-15"
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      birthYear = parseInt(isoMatch[1], 10);
      birthMonth = parseInt(isoMatch[2], 10);
      birthDay = parseInt(isoMatch[3], 10);
    }
  } else if (/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4}/.test(trimmed)) {
    // 3. DD/MM/YYYY Format: "15/05/2535"
    const parts = trimmed.split(/[\/\.-]/);
    birthDay = parseInt(parts[0], 10);
    birthMonth = parseInt(parts[1], 10);
    birthYear = parseInt(parts[2], 10);
  } else if (/^\d{4}$/.test(trimmed)) {
    // 4. Year only: "2535" or "1992"
    birthYear = parseInt(trimmed, 10);
  }

  if (!birthYear || isNaN(birthYear)) return null;

  // Adjust Thai Buddhist Era (พ.ศ.) to Gregorian Era
  if (birthYear > 2400) {
    birthYear -= 543;
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (birthYear > currentYear) return null;

  let ageYears = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    ageYears--;
  }

  if (ageYears > 0 && ageYears < 130) {
    return `${ageYears} ปี`;
  } else if (ageYears === 0) {
    let months = (currentYear - birthYear) * 12 + (currentMonth - birthMonth);
    if (currentDay < birthDay) months--;
    return months > 0 ? `${months} เดือน` : 'แรกเกิด';
  }

  return null;
}

/**
 * Normalizes any DOB string to clean ISO YYYY-MM-DD or trimmed date string
 * e.g. "2006-01-08 17:00:00.000" -> "2006-01-08"
 */
export function cleanDobString(dobStr?: string | null): string {
  if (!dobStr || !dobStr.trim()) return '';
  const trimmed = dobStr.trim();
  const match = trimmed.match(/^(\d{4}-\d{1,2}-\d{1,2})/);
  if (match) {
    return match[1];
  }
  return trimmed;
}

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatThaiDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const clean = cleanDobString(dateStr);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const thaiYear = y < 2400 ? y + 543 : y;
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d} ${months[m - 1] || ''} ${thaiYear}`;
  }
  return dateStr;
}
