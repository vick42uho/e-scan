"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePatient } from "@/hooks/use-patient";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { useViewerControls } from "@/hooks/use-viewer-controls";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ViewerLayout } from "@/components/layout/viewer-layout";
import { DocumentCategoryType } from "@/types/document";
import { Loader2 } from "lucide-react";

function EscanViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read URL params (from HIS/EMR or direct link)
  const hnParam = searchParams.get("hn") || "08-24-00030";
  const userParam = searchParams.get("user") || "YH1005";

  // Modular Custom Hooks
  const { patient, loading: loadingPatient, changeHn } = usePatient(hnParam);
  const {
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

  // Handlers
  const handleSelectPersona = (persona: import("@/components/layout/top-navbar").UserPersona) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("user", persona.id);
    if (persona.role) params.set("role", persona.role);
    if (persona.doctorCode) {
      setDoctorCode(persona.doctorCode);
    } else {
      setDoctorCode("");
      setDoctorOnly(false);
    }
    router.push(`/view?${params.toString()}`);
  };

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
      treeData={treeData}
      currentDocument={currentDocument}
      selectedDocId={selectedDocId}
      groupBy={groupBy}
      categoryType={categoryType}
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
      onSelectPersona={handleSelectPersona}
      onSelectDocument={handleSelectDocument}
      onChangeGroupBy={setGroupBy}
      onChangeCategoryType={handleChangeCategoryType}
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
