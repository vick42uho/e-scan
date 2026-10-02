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

function EscanViewerContent() {
  const searchParams = useSearchParams();

  // Read URL params (strictly ?hn=... without forced user/role params)
  const hnParam = searchParams.get("hn") || "08-24-00030";
  const userParam = searchParams.get("user") || "Staff";
  const vnParam = searchParams.get("vn") || searchParams.get("en");

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
