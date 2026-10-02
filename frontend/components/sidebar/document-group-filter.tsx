"use client";

import React from "react";
import { DocumentGroupBy, DocumentCategoryType } from "@/types/document";
import { Calendar, UserCheck, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentGroupFilterProps {
  activeGroup: DocumentGroupBy;
  onChangeGroup: (group: DocumentGroupBy) => void;
  categoryType?: DocumentCategoryType;
}

export function DocumentGroupFilter({
  activeGroup,
  onChangeGroup,
}: DocumentGroupFilterProps) {
  // Support all 3 grouping modes across Doctor and Not Doctor tabs:
  // - Visit Date: Group by Encounter / Scan Date
  // - Caregiver: Group by Doctor (in Doctor tab) or Nurse / Scan Staff (in Not Doctor tab)
  // - Category: Group by Document Type / Category
  const options: { id: DocumentGroupBy; label: string; icon: React.ElementType }[] = [
    { id: "visit_date", label: "Visit Date", icon: Calendar },
    { id: "caregiver", label: "Caregiver", icon: UserCheck },
    { id: "category", label: "Category", icon: Layers },
  ];

  return (
    <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px]">
      <span className="text-slate-400 dark:text-slate-500 font-medium shrink-0">จัดกลุ่ม:</span>
      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeGroup === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChangeGroup(opt.id)}
              className={cn(
                "px-2 py-1 rounded flex items-center gap-1 transition-colors font-medium cursor-pointer",
                isActive
                  ? "bg-blue-600 text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
