"use client";

import React from "react";
import { DocumentItem } from "@/types/document";
import { StatusPill } from "@/components/common/status-pill";
import { Stethoscope, Calendar, UserCheck, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { documentApi } from "@/services/document-api";

interface ViewerHeaderProps {
  document: DocumentItem | null;
  currentPage?: number;
}

export function ViewerHeader({ document }: ViewerHeaderProps) {
  if (!document) return null;

  const isPdf = document.pages.some(
    (p) => p.mime_type === "application/pdf" || p.file_name.toLowerCase().endsWith(".pdf")
  );

  const formattedDate = document.scan_date
    ? new Date(document.scan_date).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "Doctor":
        return <StatusPill label="แพทย์สแกน" variant="blue" size="sm" />;
      case "Nurse":
        return <StatusPill label="พยาบาลสแกน" variant="green" size="sm" />;
      case "Staff":
        return <StatusPill label="จนท.เวชระเบียน" variant="slate" size="sm" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-10 px-2 sm:px-3 md:px-4 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 overflow-hidden select-none">
        {/* Title & Document Badge (min-w-0 flex-1 prevents text collision) */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
          {document.is_doctor_document ? (
            <Badge
              variant="default"
              className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0 h-5 flex items-center gap-1 shrink-0"
            >
              <Stethoscope className="h-3 w-3" />
              <span className="hidden xs:inline">เอกสารแพทย์</span>
              <span className="xs:hidden">แพทย์</span>
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-emerald-600 text-white text-[10px] font-medium px-1.5 py-0 h-5 flex items-center gap-1 shrink-0 hover:bg-emerald-700"
            >
              <UserCheck className="h-3 w-3" />
              <span className="hidden xs:inline">พยาบาล/ทั่วไป</span>
              <span className="xs:hidden">ทั่วไป</span>
            </Badge>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs sm:text-[13px] cursor-default flex-1 min-w-0">
                {document.title}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-md">
              {document.title}
            </TooltipContent>
          </Tooltip>

          {isPdf && (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={documentApi.getRawFileUrl(document.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors shrink-0"
                >
                  <FileText className="h-3 w-3 text-rose-500" />
                  <span>PDF ต้นฉบับ</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                คลิกเพื่อเปิดดูไฟล์ PDF ต้นฉบับในแท็บใหม่
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Doctor & Scanner Details (Right side, non-overlapping) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-[11px] shrink-0">
          {document.doctor_name && (
            <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-1.5 sm:px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 shrink-0">
              <Stethoscope className="h-3 w-3 text-blue-600 shrink-0" />
              <span className="text-slate-500 hidden md:inline">แพทย์:</span>
              <span className="font-semibold truncate max-w-[80px] xs:max-w-[100px] sm:max-w-[130px]">
                {document.doctor_name}
              </span>
            </div>
          )}

          {/* Show scanner on ultra-wide displays only so document title remains prominently readable */}
          {document.scan_by_name && document.scan_by_name !== document.doctor_name && (
            <div className="hidden 2xl:flex items-center gap-1 shrink-0">
              <span className="text-slate-400">ผู้สแกน:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[110px]">
                {document.scan_by_name}
              </span>
              {getRoleBadge(document.scan_by_role)}
            </div>
          )}

          {document.scan_date && (
            <div className="hidden xl:flex items-center gap-1 text-slate-500 dark:text-slate-400 shrink-0">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className="font-mono text-[11px]">{formattedDate}</span>
            </div>
          )}

          {/* Total pages info pill */}
          <Badge
            variant="secondary"
            className="hidden xs:inline-flex text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0 h-5 shrink-0 border-0"
          >
            รวม {document.total_pages} หน้า
          </Badge>
        </div>
      </div>
    );
  }
