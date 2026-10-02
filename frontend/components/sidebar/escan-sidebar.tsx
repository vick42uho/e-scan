"use client";

import React, { useState } from "react";
import { Patient } from "@/types/patient";
import {
  DocumentTreeResponse,
  DocumentGroupBy,
  DocumentCategoryType,
} from "@/types/document";
import { PatientProfileCard } from "./patient-profile-card";
import { ViewModeTabs } from "./view-mode-tabs";
import { DocumentGroupFilter } from "./document-group-filter";
import { DocumentTreeView } from "./document-tree-view";
import { DocumentSearchInput } from "./document-search-input";

interface EscanSidebarProps {
  patient: Patient | null;
  treeData: DocumentTreeResponse | null;
  selectedDocId: string | null;
  groupBy: DocumentGroupBy;
  categoryType: DocumentCategoryType;
  searchQuery: string;
  doctorOnly: boolean;
  loadingPatient?: boolean;
  loadingTree?: boolean;
  onSelectDocument: (docId: string) => void;
  onChangeGroupBy: (group: DocumentGroupBy) => void;
  onChangeCategoryType: (type: DocumentCategoryType) => void;
  onChangeSearchQuery: (query: string) => void;
  onToggleDoctorOnly: () => void;
  className?: string;
}

export function EscanSidebar({
  patient,
  treeData,
  selectedDocId,
  groupBy,
  categoryType,
  searchQuery,
  doctorOnly,
  loadingPatient,
  loadingTree,
  onSelectDocument,
  onChangeGroupBy,
  onChangeCategoryType,
  onChangeSearchQuery,
  onToggleDoctorOnly,
  className = "",
}: EscanSidebarProps) {
  return (
    <aside
      className={`w-72 md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 select-none overflow-hidden ${className}`}
    >
      {/* 1. Patient Profile Info */}
      <PatientProfileCard patient={patient} />

      {/* 2. In-Chart Document Search Bar (ค้นหาเอกสารในเวชระเบียนนี้) */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900">
        <DocumentSearchInput
          value={searchQuery}
          onChange={onChangeSearchQuery}
          totalFound={treeData?.total_documents}
          placeholder="ค้นหาเอกสารในเวชระเบียนนี้..."
        />
      </div>

      {/* 3. View Mode Tabs (Doctor vs Not Doctor + My Documents toggle) */}
      <ViewModeTabs
        activeTab={categoryType}
        onChangeTab={onChangeCategoryType}
        doctorOnly={doctorOnly}
        onToggleDoctorOnly={onToggleDoctorOnly}
      />

      {/* 4. Group Filter (Visit Date / Caregiver / Category) */}
      <DocumentGroupFilter
        activeGroup={groupBy}
        onChangeGroup={onChangeGroupBy}
        categoryType={categoryType}
      />

      {/* 5. Collapsible Multi-Level Document Tree */}
      <DocumentTreeView
        treeData={treeData}
        selectedDocId={selectedDocId}
        onSelectDocument={onSelectDocument}
        loading={loadingTree}
      />
    </aside>
  );
}
