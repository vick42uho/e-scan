export interface DocumentCategory {
  id: number;
  code: string;
  name_th: string;
  name_en: string;
  category_type: string;
  icon?: string;
  sort_order: number;
}

export interface DocumentPage {
  id: number;
  document_id: string;
  page_number: number;
  page_label?: string;
  file_name: string;
  mime_type: string;
  file_size?: number;
  width?: number;
  height?: number;
  file_url: string;
  thumbnail_url: string;
}

export interface DocumentItem {
  id: string;
  hn: string;
  en?: string;
  category_id: number;
  category_name?: string;
  title: string;
  document_code?: string;
  doctor_code?: string;
  doctor_name?: string;
  is_doctor_document: boolean;
  scan_by_id?: string;
  scan_by_name?: string;
  scan_by_role?: "Doctor" | "Nurse" | "Staff" | "Admin";
  scan_date?: string;
  total_pages: number;
  is_confidential: boolean;
  pages: DocumentPage[];
}

export interface DocumentTreeNode {
  id: string;
  label: string;
  type: "date_group" | "category_group" | "caregiver_group" | "document";
  count: number;
  document_id?: string;
  category_type?: string;
  date_str?: string;
  doctor_name?: string;
  is_doctor_document?: boolean;
  scan_by_role?: string;
  children?: DocumentTreeNode[];
}

export interface DocumentTreeResponse {
  group_by: string;
  category_type: string;
  total_documents: number;
  nodes: DocumentTreeNode[];
}

export type DocumentGroupBy = "visit_date" | "category" | "caregiver";
export type DocumentCategoryType = "doctor" | "non_doctor" | "admin" | "all" | "care_team";
