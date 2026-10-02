"use client";

import React, { useState } from "react";
import {
  DocumentTreeNode,
  DocumentTreeResponse,
} from "@/types/document";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Calendar,
  Stethoscope,
  UserCheck,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";

interface DocumentTreeViewProps {
  treeData: DocumentTreeResponse | null;
  selectedDocId: string | null;
  onSelectDocument: (docId: string) => void;
  loading?: boolean;
}

export function DocumentTreeView({
  treeData,
  selectedDocId,
  onSelectDocument,
  loading = false,
}: DocumentTreeViewProps) {
  if (loading) {
    return <LoadingSkeleton variant="tree" />;
  }

  if (!treeData || treeData.nodes.length === 0) {
    return (
      <EmptyState
        icon="folder"
        title="ไม่พบเอกสาร"
        description="ไม่มีเอกสารที่ตรงกับเงื่อนไขการค้นหาหรือหมวดหมู่นี้"
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs select-none">
      {treeData.nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          selectedDocId={selectedDocId}
          onSelectDocument={onSelectDocument}
        />
      ))}
    </div>
  );
}

function TreeNodeItem({
  node,
  selectedDocId,
  onSelectDocument,
  depth = 0,
}: {
  node: DocumentTreeNode;
  selectedDocId: string | null;
  onSelectDocument: (docId: string) => void;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isDocument = node.type === "document";
  const isSelected = isDocument && node.document_id === selectedDocId;

  // Document Leaf Node
  if (isDocument) {
    return (
      <button
        onClick={() => node.document_id && onSelectDocument(node.document_id)}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={cn(
          "w-full text-left py-1.5 pr-2 rounded-md flex items-center justify-between transition-all group",
          isSelected
            ? "bg-blue-600 text-white font-medium shadow-xs"
            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          <FileText
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              isSelected
                ? "text-white"
                : "text-slate-400 group-hover:text-blue-600"
            )}
          />
          <span className="truncate">{node.label}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {/* Badge: แพทย์ vs พยาบาล/ทั่วไป */}
          {node.is_doctor_document ? (
            <span
              className={cn(
                "text-[9px] font-semibold px-1 py-0.2 rounded",
                isSelected
                  ? "bg-blue-800 text-cyan-200"
                  : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              )}
            >
              แพทย์
            </span>
          ) : (
            <span
              className={cn(
                "text-[9px] font-medium px-1 py-0.2 rounded",
                isSelected
                  ? "bg-blue-700/80 text-blue-100"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}
            >
              {node.scan_by_role === "Nurse" ? "พยาบาล" : "ทั่วไป"}
            </span>
          )}

          {/* Page Count */}
          {node.count > 0 && (
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                isSelected
                  ? "bg-blue-800 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}
            >
              {node.count}น.
            </span>
          )}
        </div>
      </button>
    );
  }

  // Folder Node (Caregiver Group, Category Group, or Date Group)
  const isDateNode = node.type === "date_group" || node.label.startsWith("Visit:");
  const isCaregiverNode = node.type === "caregiver_group";
  const isDoctorCaregiver = isCaregiverNode && (node.label.startsWith("นพ.") || node.label.startsWith("พญ."));

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={cn(
          "w-full text-left py-1.5 pr-2 rounded-md flex items-center justify-between transition-colors group",
          depth === 0
            ? "text-slate-900 dark:text-slate-100 font-bold bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800"
            : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60"
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
          )}

          {/* Context Icon */}
          {isDateNode ? (
            <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          ) : isDoctorCaregiver ? (
            <Stethoscope className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          ) : isCaregiverNode ? (
            <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          ) : isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}

          <span className="truncate text-xs">{node.label}</span>
        </div>

        <span className="text-[10px] font-mono text-slate-500 bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.2 rounded">
          {node.count}
        </span>
      </button>

      {/* Children Subnodes */}
      {isOpen && node.children && node.children.length > 0 && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedDocId={selectedDocId}
              onSelectDocument={onSelectDocument}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
