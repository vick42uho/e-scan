"use client";

import React, { useState } from "react";
import { TopNavbar } from "./top-navbar";
import { EscanSidebar } from "@/components/sidebar/escan-sidebar";
import { DocumentViewerCanvas } from "@/components/viewer/document-viewer-canvas";
import { ViewerHeader } from "@/components/viewer/viewer-header";
import { ViewerToolbar } from "@/components/viewer/viewer-toolbar";
import { ThumbnailStrip } from "@/components/viewer/thumbnail-strip";
import { PrintDialog } from "@/components/viewer/print-dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { Patient } from "@/types/patient";
import {
  DocumentTreeResponse,
  DocumentGroupBy,
  DocumentCategoryType,
  EncounterFilterType,
  DocumentItem,
} from "@/types/document";
import { ViewerState, ViewerControls } from "@/types/viewer";

interface ViewerLayoutProps {
  patient: Patient | null;
  vn?: string | null;
  treeData: DocumentTreeResponse | null;
  currentDocument: DocumentItem | null;
  selectedDocId: string | null;
  groupBy: DocumentGroupBy;
  categoryType: DocumentCategoryType;
  encounterType?: EncounterFilterType;
  searchQuery: string;
  doctorOnly: boolean;
  viewerState: ViewerState;
  viewerControls: ViewerControls;
  userId: string;
  loadingPatient?: boolean;
  loadingTree?: boolean;
  loadingDoc?: boolean;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  rightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  onSelectDocument: (docId: string) => void;
  onChangeGroupBy: (group: DocumentGroupBy) => void;
  onChangeCategoryType: (type: DocumentCategoryType) => void;
  onChangeEncounterType?: (type: EncounterFilterType) => void;
  onChangeSearchQuery: (query: string) => void;
  onToggleDoctorOnly?: () => void;
}

export function ViewerLayout({
  patient,
  vn,
  treeData,
  currentDocument,
  selectedDocId,
  groupBy,
  categoryType,
  encounterType = "all",
  searchQuery,
  doctorOnly = false,
  viewerState,
  viewerControls,
  userId,
  loadingPatient,
  loadingTree,
  loadingDoc,
  leftSidebarOpen = true,
  onToggleLeftSidebar,
  rightSidebarOpen = true,
  onToggleRightSidebar,
  onSelectDocument,
  onChangeGroupBy,
  onChangeCategoryType,
  onChangeEncounterType,
  onChangeSearchQuery,
  onToggleDoctorOnly,
}: ViewerLayoutProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileThumbnailsOpen, setMobileThumbnailsOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* 1. Top Brand Header */}
      <TopNavbar
        patient={patient}
        userId={userId}
        isSidebarOpen={leftSidebarOpen}
        onToggleMobileSidebar={() => setMobileDrawerOpen(true)}
      />

      {/* 2. Main 3-Column Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Column: Desktop Collapsible Sidebar */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out shrink-0 overflow-hidden hidden md:flex h-full relative z-10",
            leftSidebarOpen ? "w-80 lg:w-[340px] opacity-100" : "w-0 opacity-0 border-r-0"
          )}
        >
          <EscanSidebar
            patient={patient}
            vn={vn || currentDocument?.en}
            treeData={treeData}
            selectedDocId={selectedDocId}
            groupBy={groupBy}
            categoryType={categoryType}
            encounterType={encounterType}
            searchQuery={searchQuery}
            doctorOnly={doctorOnly}
            loadingPatient={loadingPatient}
            loadingTree={loadingTree}
            onSelectDocument={onSelectDocument}
            onChangeGroupBy={onChangeGroupBy}
            onChangeCategoryType={onChangeCategoryType}
            onChangeEncounterType={onChangeEncounterType}
            onChangeSearchQuery={onChangeSearchQuery}
            onToggleDoctorOnly={onToggleDoctorOnly}
            className="w-full h-full border-r border-slate-200 dark:border-slate-800"
          />
        </div>

        {/* Floating Restore Button for Left Sidebar when collapsed (Desktop only) */}
        {!leftSidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleLeftSidebar}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white/95 dark:bg-slate-900/95 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-300 dark:border-slate-700 border-l-0 rounded-r-lg py-3 px-1 shadow-md transition-all group flex-col items-center gap-1 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                <span className="[writing-mode:vertical-rl] text-[10px] font-medium tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600">
                  เปิดเมนู
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              เปิดแถบประวัติเวชระเบียน ( [ )
            </TooltipContent>
          </Tooltip>
        )}

        {/* Mobile Slide-over Drawer for Patient History & Docs */}
        <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <SheetContent side="left" className="p-0 w-80 sm:w-[340px] max-w-full">
            <SheetTitle className="sr-only">เมนูประวัติและเอกสาร</SheetTitle>
            <EscanSidebar
              patient={patient}
              vn={vn || currentDocument?.en}
              treeData={treeData}
              selectedDocId={selectedDocId}
              groupBy={groupBy}
              categoryType={categoryType}
              encounterType={encounterType}
              searchQuery={searchQuery}
              doctorOnly={doctorOnly}
              loadingPatient={loadingPatient}
              loadingTree={loadingTree}
              onSelectDocument={(id) => {
                onSelectDocument(id);
                setMobileDrawerOpen(false);
              }}
              onChangeGroupBy={onChangeGroupBy}
              onChangeCategoryType={onChangeCategoryType}
              onChangeEncounterType={onChangeEncounterType}
              onChangeSearchQuery={onChangeSearchQuery}
              onToggleDoctorOnly={onToggleDoctorOnly}
              className="w-full h-full border-r-0"
            />
          </SheetContent>
        </Sheet>

        {/* Center Column: Viewer Area (Full width on mobile!) */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-200/50 dark:bg-slate-900 relative min-w-0">
          {/* Header Metadata */}
          <ViewerHeader document={currentDocument} />

          {/* Action Toolbar */}
          <ViewerToolbar
            state={viewerState}
            controls={viewerControls}
            totalPages={currentDocument?.total_pages || 1}
            onPrint={() => setPrintModalOpen(true)}
            leftSidebarOpen={leftSidebarOpen}
            onToggleLeftSidebar={onToggleLeftSidebar}
            rightSidebarOpen={rightSidebarOpen}
            onToggleRightSidebar={onToggleRightSidebar}
            onOpenMobileThumbnails={() => setMobileThumbnailsOpen(true)}
          />

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <DocumentViewerCanvas
              document={currentDocument}
              state={viewerState}
              controls={viewerControls}
              userId={userId}
              loading={loadingDoc}
            />
          </div>
        </main>

        {/* Right Column: Thumbnail Strip for multi-page docs (Desktop Only - Collapsible) */}
        {currentDocument && currentDocument.pages.length > 1 && (
          <div
            className={cn(
              "transition-all duration-300 ease-in-out shrink-0 overflow-hidden h-full relative z-10 hidden md:flex",
              rightSidebarOpen ? "w-48 sm:w-52 md:w-56 opacity-100" : "w-0 opacity-0 border-l-0"
            )}
          >
            <ThumbnailStrip
              pages={currentDocument.pages}
              currentPage={viewerState.currentPage}
              onSelectPage={viewerControls.setPage}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Floating Restore Button for Right Sidebar when collapsed (Desktop only) */}
        {!rightSidebarOpen && currentDocument && currentDocument.pages.length > 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleRightSidebar}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white/95 dark:bg-slate-900/95 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-300 dark:border-slate-700 border-r-0 rounded-l-lg py-3 px-1 shadow-md transition-all group flex-col items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 text-blue-600 group-hover:-translate-x-0.5 transition-transform" />
                <span className="[writing-mode:vertical-rl] text-[10px] font-medium tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600">
                  หน้ารวม ({currentDocument.pages.length})
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              เปิดแถบหน้ารวมเอกสาร ( ] )
            </TooltipContent>
          </Tooltip>
        )}

        {/* Mobile Slide-over Drawer for Thumbnails (Overlay - does not squeeze the canvas) */}
        {currentDocument && currentDocument.pages.length > 1 && (
          <Sheet open={mobileThumbnailsOpen} onOpenChange={setMobileThumbnailsOpen}>
            <SheetContent side="right" className="p-0 w-72 max-w-[85vw] flex flex-col">
              <SheetTitle className="sr-only">หน้ารวมเอกสาร</SheetTitle>
              <ThumbnailStrip
                pages={currentDocument.pages}
                currentPage={viewerState.currentPage}
                onSelectPage={(pageNum) => {
                  viewerControls.setPage(pageNum);
                  setMobileThumbnailsOpen(false);
                }}
                className="w-full h-full border-l-0"
              />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Secured Print Dialog */}
      <PrintDialog
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        document={currentDocument}
        currentPage={viewerState.currentPage}
        userId={userId}
      />
    </div>
  );
}
