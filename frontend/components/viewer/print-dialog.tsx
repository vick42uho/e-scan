"use client";

import React, { useState } from "react";
import { Printer, Shield, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentItem } from "@/types/document";
import { documentApi } from "@/services/document-api";

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentItem | null;
  currentPage: number;
  userId: string;
}

export function PrintDialog({
  open,
  onOpenChange,
  document,
  currentPage,
  userId,
}: PrintDialogProps) {
  const [printAllPages, setPrintAllPages] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [printing, setPrinting] = useState(false);

  if (!document) return null;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      // 1. Log Audit record
      await documentApi.logAudit(
        document.hn,
        document.id,
        printAllPages ? undefined : currentPage,
        "PRINT",
        userId,
        `Print mode: ${printAllPages ? "All pages" : `Page ${currentPage}`}, Watermark: ${includeWatermark}`
      );

      // 2. Open printable window
      const printUrl = documentApi.getFileUrl(
        document.id,
        currentPage,
        includeWatermark,
        userId
      );

      const printWindow = window.open(printUrl, "_blank");
      if (printWindow) {
        printWindow.focus();
        // Give time for image to load before trigger print
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      onOpenChange(false);
    } catch (err) {
      console.error("Print error:", err);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Printer className="h-5 w-5 text-blue-600" />
            สั่งพิมพ์เอกสารเวชระเบียน (Yanhee e-Scan Print)
          </DialogTitle>
          <DialogDescription className="text-xs">
            การพิมพ์เอกสารจะถูกบันทึกประวัติ (Audit Log) ในระบบรักษาความปลอดภัย
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-100">
              {document.title}
            </div>
            <div className="text-slate-500">
              HN: <span className="font-mono">{document.hn}</span> • จำนวน {document.total_pages} หน้า
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-slate-700 dark:text-slate-300">
              หน้าที่ต้องการพิมพ์:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="printRange"
                  checked={printAllPages}
                  onChange={() => setPrintAllPages(true)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>ทุกหน้า (1 - {document.total_pages})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="printRange"
                  checked={!printAllPages}
                  onChange={() => setPrintAllPages(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>เฉพาะหน้าที่กำลังดู (หน้า {currentPage})</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWatermark}
                onChange={(e) => setIncludeWatermark(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  ประทับตราลายน้ำ "สำเนาถูกต้อง COPY" และรหัสเจ้าหน้าที่ ({userId})
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  แนะนำให้เปิดไว้เพื่อความถูกต้องตามระเบียบ พ.ร.บ. เวชระเบียน
                </div>
              </div>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            disabled={printing}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            {printing ? "กำลังเตรียมเอกสาร..." : "ยืนยันการพิมพ์"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
