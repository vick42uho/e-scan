"use client";

import React from "react";
import { User } from "lucide-react";
import { Patient } from "@/types/patient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PatientProfileCardProps {
  patient: Patient | null;
  /** @deprecated VN is removed from UI as it duplicates Visit Date */
  vn?: string | null;
}

function formatThaiDob(dobString?: string | null) {
  if (!dobString) return "-";
  try {
    const d = new Date(dobString);
    if (isNaN(d.getTime())) return dobString;
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dobString;
  }
}

export function PatientProfileCard({ patient }: PatientProfileCardProps) {
  if (!patient) return null;

  return (
    <div className="px-3 py-2 bg-gradient-to-r from-blue-50/70 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        {/* Compact Avatar (38x38px) */}
        <div className="h-9.5 w-9.5 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-2xs shrink-0 ring-1 ring-blue-500/20">
          <Avatar className="h-full w-full bg-white dark:bg-slate-900">
            {patient.photo_url && (
              <AvatarImage
                src={patient.photo_url}
                alt={patient.name_th}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400">
              <User className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Patient Details: Clean & Compact Inline Stack */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Thai Name + HN Badge */}
          <div className="flex items-center justify-between gap-1.5 leading-tight">
            <span
              className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px] truncate"
              title={patient.name_th}
            >
              {patient.name_th}
            </span>
            <Badge
              variant="secondary"
              className="font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/70 px-1.5 py-0 h-4 rounded shrink-0 border border-blue-200/60 dark:border-blue-800/60"
            >
              HN: {patient.hn}
            </Badge>
          </div>

          {/* Row 2: English Name */}
          {patient.name_en && (
            <div
              className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5"
              title={patient.name_en}
            >
              {patient.name_en}
            </div>
          )}

          {/* Row 3: Demographics Inline (เพศ • อายุ • วันเกิด) - ประหยัดพื้นที่ในแนวตั้ง */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap leading-tight mt-0.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {patient.gender || "-"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{patient.age_display || "-"}</span>
            {patient.dob && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="whitespace-nowrap">
                  เกิด {formatThaiDob(patient.dob)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
