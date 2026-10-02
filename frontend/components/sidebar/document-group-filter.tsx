"use client";

import React from "react";
import { DocumentGroupBy, EncounterFilterType } from "@/types/document";
import { Calendar, UserCheck, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentGroupFilterProps {
  activeGroup: DocumentGroupBy;
  onChangeGroup: (group: DocumentGroupBy) => void;
  encounterType?: EncounterFilterType;
  onChangeEncounterType?: (type: EncounterFilterType) => void;
}

export function DocumentGroupFilter({
  activeGroup,
  onChangeGroup,
  encounterType = "all",
  onChangeEncounterType,
}: DocumentGroupFilterProps) {
  // Support 3 grouping modes:
  // - Visit Date: Group by Encounter / Scan Date (with sub-filter OPD, IPD, O+I)
  // - Care provider: Group by Physician / Caregiver
  // - Doc Type: Group by Document Type / Category
  const options: { id: DocumentGroupBy; label: string; icon: React.ElementType }[] = [
    { id: "visit_date", label: "Visit Date", icon: Calendar },
    { id: "caregiver", label: "Care provider", icon: UserCheck },
    { id: "category", label: "Doc Type", icon: Layers },
  ];

  // Sub-filters for Visit Date: OPD, IPD, O+I
  const encounterSubFilters: { id: EncounterFilterType; label: string; title: string }[] = [
    { id: "opd", label: "OPD", title: "ผู้ป่วยนอก (Out-Patient)" },
    { id: "ipd", label: "IPD", title: "ผู้ป่วยใน (In-Patient)" },
    { id: "all", label: "O+I", title: "ทั้งหมด (OPD + IPD)" },
  ];

  return (
    <div className="px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 select-none">
      {/* 1. Main Grouping Segmented Control (Compact 1-Line Tabs) */}
      <div className="grid grid-cols-3 p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeGroup === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeGroup(opt.id)}
              className={cn(
                "py-1 px-1 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap select-none",
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Visit Date Sub-Filters: OPD / IPD / O+I (Placed directly next to 'ประเภทคนไข้:') */}
      {activeGroup === "visit_date" && onChangeEncounterType && (
        <div className="flex items-center gap-2 pt-0.5 text-[10.5px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
            ประเภทคนไข้:
          </span>
          <div className="inline-flex items-center p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-md">
            {encounterSubFilters.map((sub) => {
              const isSubActive = encounterType === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  title={sub.title}
                  onClick={() => onChangeEncounterType(sub.id)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer select-none",
                    isSubActive
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
