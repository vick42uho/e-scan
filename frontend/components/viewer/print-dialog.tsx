"use client";

import React, { useState } from "react";
import { Printer, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="truncate">{document.title}</span>
              <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                {document.total_pages} หน้า
              </Badge>
            </div>
            <div className="text-slate-500 flex items-center gap-2">
              <span>HN: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{document.hn}</span></span>
              {document.document_code && (
                <Badge variant="outline" className="font-mono text-[10px] py-0 h-4">
                  {document.document_code}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-slate-700 dark:text-slate-300">
              หน้าที่ต้องการพิมพ์:
            </Label>
            <Tabs
              value={printAllPages ? "all" : "current"}
              onValueChange={(val) => setPrintAllPages(val === "all")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full h-8">
                <TabsTrigger value="all" className="text-xs">
                  ทุกหน้า (1 - {document.total_pages})
                </TabsTrigger>
                <TabsTrigger value="current" className="text-xs">
                  เฉพาะหน้าที่กำลังดู (หน้า {currentPage})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator />

          <div className="pt-1">
            <label
              htmlFor="watermark-checkbox"
              className="flex items-start gap-2.5 cursor-pointer"
            >
              <Checkbox
                id="watermark-checkbox"
                checked={includeWatermark}
                onCheckedChange={(checked) => setIncludeWatermark(!!checked)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label
                  htmlFor="watermark-checkbox"
                  className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  ประทับตราลายน้ำ &quot;สำเนาถูกต้อง COPY&quot; และรหัสเจ้าหน้าที่ ({userId})
                </Label>
                <p className="text-[11px] text-slate-500">
                  แนะนำให้เปิดไว้เพื่อความถูกต้องตามระเบียบ พ.ร.บ. เวชระเบียน
                </p>
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
