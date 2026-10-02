"use client";

import React from "react";
import { DocumentCategoryType } from "@/types/document";
import { Stethoscope, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewModeTabsProps {
  activeTab: DocumentCategoryType;
  onChangeTab: (tab: DocumentCategoryType) => void;
  doctorOnly?: boolean;
  onToggleDoctorOnly?: () => void;
  currentDoctorName?: string;
}

export function ViewModeTabs({
  activeTab,
  onChangeTab,
  doctorOnly = false,
  onToggleDoctorOnly,
  currentDoctorName = "นพ. สุทธิพงษ์ วิริยะสกุล",
}: ViewModeTabsProps) {
  const isDoctor = activeTab === "doctor";

  return (
    <div className="flex flex-col bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* 2 Primary Tabs: Doctor vs Not Doctor */}
      <div className="grid grid-cols-2 p-1.5 gap-1.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onChangeTab("doctor")}
          className={cn(
            "py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center border cursor-pointer",
            isDoctor
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          <Stethoscope className={cn("h-4 w-4", isDoctor ? "text-white" : "text-blue-600")} />
          <span className="font-bold">Doctor</span>
          
        </button>

        <button
          type="button"
          onClick={() => onChangeTab("non_doctor")}
          className={cn(
            "py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center border cursor-pointer",
            !isDoctor
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          <FileText className={cn("h-4 w-4", !isDoctor ? "text-white" : "text-emerald-600")} />
          <span className="font-bold">Not Doctor</span>
          
        </button>
      </div>

      {/* Doctor Quick Filter (เฉพาะเมื่ออยู่ในแท็บ Doctor) */}
      {isDoctor && onToggleDoctorOnly && (
        <div className="px-2 py-1.5 bg-blue-50/70 dark:bg-blue-950/40 border-t border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={doctorOnly}
              onChange={onToggleDoctorOnly}
              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <span
              className={cn(
                "font-medium",
                doctorOnly
                  ? "text-blue-800 dark:text-blue-300 font-bold"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              เฉพาะเอกสารของฉัน (My Documents)
            </span>
          </label>

          {doctorOnly && (
            <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 rounded font-medium">
              แพทย์ผู้ตรวจ
            </span>
          )}
        </div>
      )}
    </div>
  );
}
