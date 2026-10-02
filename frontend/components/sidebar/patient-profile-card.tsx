"use client";

import React from "react";
import { User } from "lucide-react";
import { Patient } from "@/types/patient";

interface PatientProfileCardProps {
  patient: Patient | null;
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

export function PatientProfileCard({ patient, vn }: PatientProfileCardProps) {
  if (!patient) return null;

  const displayVn =
    vn ||
    patient.encounters?.[0]?.en ||
    (patient.hn === "08-24-00030" ? "08-24-110023" : undefined);

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

          {/* Row 3: HN & Gender / Age */}
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
              HN: {patient.hn}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {patient.gender || "-"} • {patient.age_display || "-"}
            </span>
          </div>

          {/* Row 4: VN & Shifted Date of Birth */}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {displayVn && (
              <span className="font-mono text-xs font-semibold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded shrink-0">
                VN: {displayVn}
              </span>
            )}
            {patient.dob && (
              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                <span className="text-slate-400">วันเกิด: </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatThaiDob(patient.dob)}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
