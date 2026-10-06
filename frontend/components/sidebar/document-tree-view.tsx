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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <ScrollArea className="h-full w-full select-none" type="always">
      <div className="p-2 space-y-0.5 text-xs">
        {treeData.nodes.map((node) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            selectedDocId={selectedDocId}
            onSelectDocument={onSelectDocument}
          />
        ))}
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
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

  // Document Leaf Node: Strictly 1 row, truncated with ... when long, clean minimal tooltip on hover (no native title overlap)
  if (isDocument) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => node.document_id && onSelectDocument(node.document_id)}
            style={{ paddingLeft: `${depth * 14 + 6}px` }}
            className={cn(
              "w-full max-w-full box-border overflow-hidden text-left py-1 px-2 rounded-md flex items-center justify-between gap-1.5 transition-colors group cursor-pointer text-xs h-7.5",
              isSelected
                ? "bg-blue-600 text-white font-medium shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            {/* Left: Document Icon + File Title strictly on 1 line with ellipsis (...) */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <FileText
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isSelected
                    ? "text-white"
                    : "text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                )}
              />
              <span className="truncate text-xs font-medium block min-w-0 flex-1">
                {node.label}
              </span>
            </div>

            {/* Right: Badges (Doctor/Nurse + Page count) */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {node.is_doctor_document ? (
                <Badge
                  variant="default"
                  className={cn(
                    "text-[9px] px-1 py-0 h-4 font-semibold shrink-0 rounded",
                    isSelected
                      ? "bg-blue-800 text-cyan-200 border-0"
                      : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  )}
                >
                  แพทย์
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[9px] px-1 py-0 h-4 font-medium shrink-0 rounded",
                    isSelected
                      ? "bg-blue-700/80 text-blue-100 border-0"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  )}
                >
                  {node.scan_by_role === "Nurse" ? "พยาบาล" : "ทั่วไป"}
                </Badge>
              )}

              {node.count > 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1 py-0 h-4 rounded-full shrink-0 border-0",
                    isSelected
                      ? "bg-blue-800 text-white"
                      : "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  )}
                >
                  {node.count}น.
                </Badge>
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={6}
          className="text-xs max-w-[280px] bg-slate-900/95 text-slate-100 px-2.5 py-1.5 shadow-xl border border-slate-800 rounded-md z-50 leading-snug break-words"
        >
          <p className="font-medium text-[11px]">{node.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Folder Node (Caregiver Group, Category Group, or Date Group)
  const isDateNode =
    node.type === "date_group" || node.label.startsWith("Visit:");
  const isCaregiverNode = node.type === "caregiver_group";
  const isDoctorCaregiver =
    isCaregiverNode &&
    (node.label.startsWith("นพ.") || node.label.startsWith("พญ."));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-0.5">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className={cn(
            "w-full max-w-full box-border overflow-hidden text-left py-1.5 pr-2 rounded-md flex items-center justify-between transition-colors group cursor-pointer h-7.5",
            depth === 0
              ? "text-slate-900 dark:text-slate-100 font-bold bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800"
              : "text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
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

          <Badge
            variant="secondary"
            className="text-[10px] text-slate-500 bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0 h-4 border-0 shrink-0"
          >
            {node.count}
          </Badge>
        </button>
      </CollapsibleTrigger>

      {/* Children Subnodes */}
      {node.children && node.children.length > 0 && (
        <CollapsibleContent className="space-y-0.5">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedDocId={selectedDocId}
              onSelectDocument={onSelectDocument}
              depth={depth + 1}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
