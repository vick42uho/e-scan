"use client";

import React from "react";
import { User, AlertTriangle, ShieldCheck } from "lucide-react";
import { Patient } from "@/types/patient";

interface PatientProfileCardProps {
  patient: Patient | null;
}

export function PatientProfileCard({ patient }: PatientProfileCardProps) {
  if (!patient) return null;

  return (
    <div className="p-3 bg-gradient-to-br from-blue-50/80 to-slate-50 dark:from-slate-900 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-start gap-3">
        {/* Avatar Illustration */}
        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-sm shrink-0">
          <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
            {patient.photo_url ? (
              <img
                src={patient.photo_url}
                alt={patient.name_th}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        </div>

        {/* Patient Details */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
            {patient.name_th}
          </div>
          {patient.name_en && (
            <div className="text-[11px] text-slate-500 truncate">
              {patient.name_en}
            </div>
          )}

          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
              HN: {patient.hn}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {patient.gender || "-"} • {patient.age_display || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* DOB, Rights & National ID */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="grid grid-cols-2 gap-1">
          <div>
            <span className="text-slate-400">วันเกิด: </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {patient.dob || "-"}
            </span>
          </div>
          <div>
            <span className="text-slate-400">สิทธิ: </span>
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate block" title={patient.rights}>
              {patient.rights || "ชำระเงินเอง"}
            </span>
          </div>
        </div>
        {patient.id_card && (
          <div className="text-[10px] text-slate-500 font-mono">
            <span className="text-slate-400">เลขบัตร: </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{patient.id_card}</span>
          </div>
        )}
      </div>

      {/* Allergy warning if any */}
      {patient.allergies && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2 py-1 rounded border border-red-200 dark:border-red-900 font-medium">
          <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
          <span className="truncate">แพ้ยา: {patient.allergies}</span>
        </div>
      )}
    </div>
  );
}
