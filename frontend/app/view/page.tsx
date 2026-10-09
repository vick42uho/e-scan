"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePatient } from "@/hooks/use-patient";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { useViewerControls } from "@/hooks/use-viewer-controls";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ViewerLayout } from "@/components/layout/viewer-layout";
import { DocumentCategoryType } from "@/types/document";
import { Loader2 } from "lucide-react";
import { YanheeLogo } from "@/components/common/yanhee-logo";

function EscanViewerContent() {
  const searchParams = useSearchParams();

  // Read URL params dynamically from HIS / iFrame
  const hnParam = searchParams.get("hn") || "";
  const userParam = searchParams.get("user") || searchParams.get("userId") || "Staff";
  const vnParam =
    searchParams.get("visitId") ||
    searchParams.get("vn") ||
    searchParams.get("en") ||
    "";

  // Modular Custom Hooks
  const { patient, loading: loadingPatient, changeHn } = usePatient(hnParam);
  const {
    treeData,
    groupBy,
    setGroupBy,
    categoryType,
    setCategoryType,
    encounterType,
    setEncounterType,
    searchQuery,
    setSearchQuery,
    doctorOnly,
    setDoctorOnly,
    selectedDocId,
    setSelectedDocId,
    currentDocument,
    loadingTree,
    loadingDoc,
  } = useDocumentTree(hnParam, userParam);

  const { state: viewerState, controls: viewerControls } = useViewerControls(1);

  // Collapsible Sidebars State (Left Tree Sidebar & Right Thumbnail Strip)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const toggleLeftSidebar = () => setLeftSidebarOpen((prev) => !prev);
  const toggleRightSidebar = () => setRightSidebarOpen((prev) => !prev);

  // Keyboard navigation (+, -, 0, r, arrow keys, [ and ] for panels)
  useKeyboardShortcuts(
    viewerControls,
    currentDocument?.total_pages || 1,
    undefined,
    toggleLeftSidebar,
    toggleRightSidebar
  );

  const handleSelectDocument = (docId: string) => {
    setSelectedDocId(docId);
    viewerControls.setPage(1);
  };

  const handleChangeCategoryType = (type: DocumentCategoryType) => {
    setCategoryType(type);
  };

  // If no HN provided in URL, show safe hospital-grade empty state
  if (!hnParam) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-6 select-none">
        <div className="flex flex-col items-center max-w-md w-full text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg transition-all">
          <YanheeLogo size="xl" className="mb-5" />
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            ไม่พบหมายเลขผู้ป่วย (HN)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            กรุณาเปิดเวชระเบียนผ่านระบบ HIS (Arcus Air) หรือระบุพารามิเตอร์{" "}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono font-semibold">
              ?hn=...
            </code>{" "}
            ใน URL
          </p>
          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-4 w-full justify-center">
            <span>Yanhee DMS Document Management System</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ViewerLayout
      patient={patient}
      vn={currentDocument?.en || vnParam}
      treeData={treeData}
      currentDocument={currentDocument}
      selectedDocId={selectedDocId}
      groupBy={groupBy}
      categoryType={categoryType}
      encounterType={encounterType}
      searchQuery={searchQuery}
      doctorOnly={doctorOnly}
      viewerState={viewerState}
      viewerControls={viewerControls}
      userId={userParam}
      loadingPatient={loadingPatient}
      loadingTree={loadingTree}
      loadingDoc={loadingDoc}
      leftSidebarOpen={leftSidebarOpen}
      onToggleLeftSidebar={toggleLeftSidebar}
      rightSidebarOpen={rightSidebarOpen}
      onToggleRightSidebar={toggleRightSidebar}
      onSelectDocument={handleSelectDocument}
      onChangeGroupBy={setGroupBy}
      onChangeCategoryType={handleChangeCategoryType}
      onChangeEncounterType={setEncounterType}
      onChangeSearchQuery={setSearchQuery}
      onToggleDoctorOnly={() => setDoctorOnly(!doctorOnly)}
    />
  );
}

export default function EscanViewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-sm font-medium">กำลังเตรียมระบบ Yanhee e-Scan...</span>
        </div>
      }
    >
      <EscanViewerContent />
    </Suspense>
  );
}
