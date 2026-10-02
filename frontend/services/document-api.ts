import { fetchApi, API_BASE_URL } from "./api-client";
import {
  DocumentItem,
  DocumentTreeResponse,
  DocumentGroupBy,
  DocumentCategoryType,
} from "@/types/document";

export const documentApi = {
  getTree: (
    hn: string,
    groupBy: DocumentGroupBy = "visit_date",
    categoryType: DocumentCategoryType = "all",
    query?: string,
    doctorCode?: string
  ) => {
    const params = new URLSearchParams({
      group_by: groupBy,
      category_type: categoryType,
    });
    if (query && query.trim()) {
      params.append("query", query.trim());
    }
    if (doctorCode && doctorCode.trim()) {
      params.append("doctor_code", doctorCode.trim());
    }
    return fetchApi<DocumentTreeResponse>(
      `/documents/tree/${encodeURIComponent(hn)}?${params.toString()}`
    );
  },

  getDocument: (documentId: string) => {
    return fetchApi<DocumentItem>(`/documents/${encodeURIComponent(documentId)}`);
  },

  getFileUrl: (
    documentId: string,
    pageNumber: number,
    watermark: boolean = false,
    userId: string = "Staff"
  ) => {
    const params = new URLSearchParams({
      watermark: watermark ? "true" : "false",
      user_id: userId,
      stamp: "สำเนาถูกต้อง COPY",
    });
    return `${API_BASE_URL}/documents/${encodeURIComponent(
      documentId
    )}/pages/${pageNumber}/file?${params.toString()}`;
  },

  getThumbnailUrl: (documentId: string, pageNumber: number) => {
    return `${API_BASE_URL}/documents/${encodeURIComponent(
      documentId
    )}/pages/${pageNumber}/thumbnail`;
  },

  getRawFileUrl: (documentId: string) => {
    return `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/raw`;
  },

  logAudit: (
    hn: string,
    documentId?: string,
    pageNumber?: number,
    action: string = "VIEW",
    userId: string = "Staff",
    userName?: string
  ) => {
    return fetchApi("/audit/log", {
      method: "POST",
      body: JSON.stringify({
        hn,
        document_id: documentId,
        page_number: pageNumber,
        action,
        user_id: userId,
        user_name: userName,
      }),
    });
  },
};
