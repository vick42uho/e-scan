"use client";

import React from "react";
import { DocumentGroupBy, EncounterFilterType } from "@/types/document";
import { Calendar, UserCheck, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const options: { id: DocumentGroupBy; label: string; icon: React.ElementType }[] = [
    { id: "visit_date", label: "Visit Date", icon: Calendar },
    { id: "caregiver", label: "Care provider", icon: UserCheck },
    { id: "category", label: "Doc Type", icon: Layers },
  ];

  const encounterSubFilters: { id: EncounterFilterType; label: string; title: string }[] = [
    { id: "opd", label: "OPD", title: "ผู้ป่วยนอก (Out-Patient)" },
    { id: "ipd", label: "IPD", title: "ผู้ป่วยใน (In-Patient)" },
    { id: "all", label: "O+I", title: "ทั้งหมด (OPD + IPD)" },
  ];

  return (
    <div className="px-2.5 py-1.5 bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 select-none">
      {/* 1. Main Grouping Segmented Control with shadcn Tabs */}
      <Tabs
        value={activeGroup}
        onValueChange={(val) => onChangeGroup(val as DocumentGroupBy)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full h-7 p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <TabsTrigger
                key={opt.id}
                value={opt.id}
                className="py-1 px-1 h-full rounded-md flex items-center justify-center gap-1.5 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap select-none data-active:bg-blue-600 data-active:text-white data-active:font-semibold data-active:shadow-xs text-slate-600 dark:text-slate-400"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{opt.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* 2. Visit Date Sub-Filters with shadcn Tabs & Tooltip */}
      {activeGroup === "visit_date" && onChangeEncounterType && (
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-2 pt-0.5 text-[10.5px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
              ประเภทคนไข้:
            </span>
            <Tabs
              value={encounterType}
              onValueChange={(val) => onChangeEncounterType(val as EncounterFilterType)}
              className="inline-flex"
            >
              <TabsList className="inline-flex items-center h-6 p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-md">
                {encounterSubFilters.map((sub) => (
                  <Tooltip key={sub.id}>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value={sub.id}
                        className="px-2 py-0.5 h-full rounded text-[10px] font-bold transition-all cursor-pointer select-none data-active:bg-blue-600 data-active:text-white data-active:shadow-2xs text-slate-600 dark:text-slate-400"
                      >
                        {sub.label}
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {sub.title}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
