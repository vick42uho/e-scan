"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DocumentTreeNode,
  DocumentTreeResponse,
  DocumentGroupBy,
  DocumentCategoryType,
  DocumentItem,
} from "@/types/document";
import { documentApi } from "@/services/document-api";

export function useDocumentTree(hn: string, initialUserId: string = "Staff") {
  const [treeData, setTreeData] = useState<DocumentTreeResponse | null>(null);
  const [groupBy, setGroupBy] = useState<DocumentGroupBy>("visit_date");
  const [categoryType, setCategoryType] = useState<DocumentCategoryType>("doctor");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [doctorOnly, setDoctorOnly] = useState<boolean>(false);
  const [doctorCode, setDoctorCode] = useState<string>("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<DocumentItem | null>(null);
  const [loadingTree, setLoadingTree] = useState<boolean>(true);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedDocIdRef.current = selectedDocId;
  }, [selectedDocId]);

  // Fetch document tree when parameters change
  const fetchTree = useCallback(async () => {
    if (!hn) return;
    setLoadingTree(true);
    setError(null);
    try {
      // If doctorOnly is toggled, pass doctorCode or filter doctor
      const activeDocFilter = doctorOnly ? (doctorCode || "YH00412") : undefined;
      const data = await documentApi.getTree(
        hn,
        groupBy,
        categoryType,
        searchQuery,
        activeDocFilter
      );
      setTreeData(data);

      // Auto select first document if none selected or not in tree
      const currentSelected = selectedDocIdRef.current;
      if (!currentSelected || !findNode(data.nodes, currentSelected)) {
        const firstDoc = findFirstDocumentNode(data.nodes);
        if (firstDoc?.document_id) {
          setSelectedDocId(firstDoc.document_id);
        } else {
          setSelectedDocId(null);
          setCurrentDocument(null);
        }
      }
    } catch (err: any) {
      setError(err.message || "ไม่สามารถดึงรายการเอกสารได้");
    } finally {
      setLoadingTree(false);
    }
  }, [hn, groupBy, categoryType, searchQuery, doctorOnly, doctorCode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTree();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchTree]);

  // Load document details when selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) return;

    let isMounted = true;
    setLoadingDoc(true);

    documentApi
      .getDocument(selectedDocId)
      .then((doc) => {
        if (isMounted) {
          setCurrentDocument(doc);
          // Log audit
          documentApi.logAudit(hn, doc.id, 1, "VIEW", initialUserId);
        }
      })
      .catch((err) => {
        console.error("Failed to load document:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingDoc(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDocId, hn, initialUserId]);

  return {
    treeData,
    groupBy,
    setGroupBy,
    categoryType,
    setCategoryType,
    searchQuery,
    setSearchQuery,
    doctorOnly,
    setDoctorOnly,
    doctorCode,
    setDoctorCode,
    selectedDocId,
    setSelectedDocId,
    currentDocument,
    loadingTree,
    loadingDoc,
    error,
    refreshTree: fetchTree,
  };
}

// Helpers
function findFirstDocumentNode(nodes: DocumentTreeNode[]): DocumentTreeNode | null {
  for (const node of nodes) {
    if (node.type === "document" && node.document_id) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findFirstDocumentNode(node.children);
      if (found) return found;
    }
  }
  return null;
}

function findNode(nodes: DocumentTreeNode[], docId: string): boolean {
  for (const node of nodes) {
    if (node.document_id === docId) return true;
    if (node.children && findNode(node.children, docId)) return true;
  }
  return false;
}
