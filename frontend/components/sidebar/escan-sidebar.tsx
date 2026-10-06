"use client";

import React, { useState } from "react";
import { Patient } from "@/types/patient";
import {
  DocumentTreeResponse,
  DocumentGroupBy,
  DocumentCategoryType,
  EncounterFilterType,
} from "@/types/document";
import { PatientProfileCard } from "./patient-profile-card";
import { DocumentGroupFilter } from "./document-group-filter";
import { DocumentTreeView } from "./document-tree-view";
import { DocumentSearchInput } from "./document-search-input";
import { cn } from "@/lib/utils";

interface EscanSidebarProps {
  patient: Patient | null;
  vn?: string | null;
  treeData: DocumentTreeResponse | null;
  selectedDocId: string | null;
  groupBy: DocumentGroupBy;
  categoryType: DocumentCategoryType;
  encounterType?: EncounterFilterType;
  searchQuery: string;
  doctorOnly?: boolean;
  loadingPatient?: boolean;
  loadingTree?: boolean;
  onSelectDocument: (docId: string) => void;
  onChangeGroupBy: (group: DocumentGroupBy) => void;
  onChangeCategoryType: (type: DocumentCategoryType) => void;
  onChangeEncounterType?: (type: EncounterFilterType) => void;
  onChangeSearchQuery: (query: string) => void;
  onToggleDoctorOnly?: () => void;
  className?: string;
}

export function EscanSidebar({
  patient,
  vn,
  treeData,
  selectedDocId,
  groupBy,
  categoryType,
  encounterType = "all",
  searchQuery,
  doctorOnly = false,
  loadingPatient,
  loadingTree,
  onSelectDocument,
  onChangeGroupBy,
  onChangeCategoryType,
  onChangeEncounterType,
  onChangeSearchQuery,
  onToggleDoctorOnly,
  className = "",
}: EscanSidebarProps) {
  return (
    <aside
      className={`w-80 lg:w-[340px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 select-none overflow-hidden ${className}`}
    >
      {/* 1. Patient Profile Info (Ultra Compact) */}
      <div className="shrink-0">
        <PatientProfileCard patient={patient} />
      </div>

      {/* 2. In-Chart Document Search Bar (ค้นหาเอกสารในเวชระเบียนนี้) */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 shrink-0">
        <DocumentSearchInput
          value={searchQuery}
          onChange={onChangeSearchQuery}
          totalFound={treeData?.total_documents}
          placeholder="ค้นหาเอกสารในเวชระเบียนนี้..."
        />
      </div>

      {/* 3. Group Filter (Visit Date / Care provider / Doc Type + OPD/IPD/O+I) */}
      <div className="shrink-0">
        <DocumentGroupFilter
          activeGroup={groupBy}
          onChangeGroup={onChangeGroupBy}
          encounterType={encounterType}
          onChangeEncounterType={onChangeEncounterType}
        />
      </div>

      {/* 5. Collapsible Multi-Level Document Tree (Bounded Flex Child) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <DocumentTreeView
          treeData={treeData}
          selectedDocId={selectedDocId}
          onSelectDocument={onSelectDocument}
          loading={loadingTree}
        />
      </div>
    </aside>
  );
}
