export interface Encounter {
  en: string;
  hn: string;
  visit_date: string;
  visit_time?: string;
  department_code?: string;
  department_name?: string;
  doctor_code?: string;
  doctor_name?: string;
  encounter_type?: string;
  status?: string;
}

export interface Patient {
  hn: string;
  name_th: string;
  name_en?: string;
  dob?: string;
  gender?: string;
  age_display?: string;
  id_card?: string;
  allergies?: string;
  rights?: string;
  photo_url?: string;
  encounters: Encounter[];
}

export interface PatientSearchResult {
  hn: string;
  name_th: string;
  name_en?: string;
  gender?: string;
  age_display?: string;
  last_visit?: string;
  document_count: number;
}
