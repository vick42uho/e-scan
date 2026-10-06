'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Card } from '@/components/ui/card';
import { ScanLine, Paperclip, Save, Loader2, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { UploadResult, ExtractionMode } from '@/types/scan';

interface ScanActionsProps {
  bridgeStatus: 'unknown' | 'connected' | 'disconnected';
  isScanning: boolean;
  isUploading: boolean;
  isExtracting: boolean;
  hasPages: boolean;
  dpi: number;
  colorMode: string;
  extractionMode: ExtractionMode;
  selectedDeviceName?: string;
  onChangeDpi: (dpi: number) => void;
  onChangeColorMode: (mode: string) => void;
  onChangeExtractionMode: (mode: ExtractionMode) => void;
  onScan: () => void;
  onFileSelect: (files: FileList) => void;
  onReExtract: () => void;
  onSave: () => void;
  uploadResult: UploadResult | null;
}

export function ScanActions({
  bridgeStatus, isScanning, isUploading, isExtracting, hasPages, 
  dpi, colorMode, extractionMode, selectedDeviceName, onChangeDpi, onChangeColorMode, 
  onChangeExtractionMode, onScan, onFileSelect, onReExtract, onSave, uploadResult
}: ScanActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const rawFiles = Array.from(e.target.files);
      const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
      const validFiles = rawFiles.filter((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return allowedExtensions.includes(ext);
      });

      if (validFiles.length === 0) {
        alert('กรุณาเลือกไฟล์เอกสารเฉพาะรูปแบบ PDF, JPG, JPEG หรือ PNG เท่านั้น');
        e.target.value = '';
        return;
      }

      if (validFiles.length < rawFiles.length) {
        alert(`มีบางไฟล์ที่ไม่รองรับถูกข้าม (${rawFiles.length - validFiles.length} ไฟล์) ระบบอนุญาตเฉพาะ .pdf, .jpg, .jpeg, .png`);
      }

      const dt = new DataTransfer();
      validFiles.forEach((file) => dt.items.add(file));
      onFileSelect(dt.files);
      e.target.value = ''; // reset
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 space-y-3 shrink-0">
      {/* Extraction Mode Settings */}
      <Card className="p-2.5 space-y-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            โหมดตรวจจับข้อมูลอัตโนมัติ
          </span>
          {hasPages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReExtract}
              disabled={isExtracting}
              className="text-[10px] text-blue-600 dark:text-blue-400 h-5 px-1.5 py-0 gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${isExtracting ? 'animate-spin' : ''}`} />
              ตรวจจับซ้ำ
            </Button>
          )}
        </div>
        <Combobox
          items={[
            'อัตโนมัติ (Hybrid: Barcode + Text + OCR)',
            'เฉพาะ Barcode / QR Code',
            'เฉพาะข้อความดิจิทัล (PDF Text Layer)',
            'เฉพาะ OCR ภาษาไทย (Optical Recognition)',
          ]}
          value={
            extractionMode === 'auto'
              ? 'อัตโนมัติ (Hybrid: Barcode + Text + OCR)'
              : extractionMode === 'barcode'
              ? 'เฉพาะ Barcode / QR Code'
              : extractionMode === 'pdf_text'
              ? 'เฉพาะข้อความดิจิทัล (PDF Text Layer)'
              : 'เฉพาะ OCR ภาษาไทย (Optical Recognition)'
          }
          onValueChange={(val: string | null) => {
            if (val?.startsWith('อัตโนมัติ')) onChangeExtractionMode('auto');
            else if (val?.startsWith('เฉพาะ Barcode')) onChangeExtractionMode('barcode');
            else if (val?.startsWith('เฉพาะข้อความ')) onChangeExtractionMode('pdf_text');
            else if (val?.startsWith('เฉพาะ OCR')) onChangeExtractionMode('ocr');
          }}
        >
          <ComboboxInput placeholder="เลือกโหมดตรวจจับข้อมูล" className="w-full text-xs h-7.5 bg-slate-50 dark:bg-slate-900" />
          <ComboboxContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <ComboboxEmpty>ไม่พบโหมด</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Card>

      {/* Scanner Hardware Settings */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Combobox
            items={['200 DPI', '300 DPI']}
            value={`${dpi} DPI`}
            onValueChange={(val: string | null) => {
              if (val) onChangeDpi(parseInt(val, 10));
            }}
          >
            <ComboboxInput placeholder="DPI" className="w-full text-xs h-7.5 bg-white dark:bg-slate-900" />
            <ComboboxContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <ComboboxEmpty>ไม่พบตัวเลือก</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <div className="flex-1">
          <Combobox
            items={['Color', 'Grayscale']}
            value={colorMode}
            onValueChange={(val: string | null) => {
              if (val) onChangeColorMode(val);
            }}
          >
            <ComboboxInput placeholder="Color" className="w-full text-xs h-7.5 bg-white dark:bg-slate-900" />
            <ComboboxContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <ComboboxEmpty>ไม่พบตัวเลือก</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium min-h-8.5 h-auto py-1.5 flex flex-col items-center justify-center gap-0.5 shadow-xs" 
          onClick={onScan}
          disabled={bridgeStatus !== 'connected' || isScanning || isUploading || isExtracting}
        >
          <div className="flex items-center justify-center gap-1.5 leading-none">
            {isScanning ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <ScanLine className="h-4 w-4 shrink-0" />}
            <span className="text-xs font-semibold">สแกนเอกสาร (Scanner)</span>
          </div>
          {selectedDeviceName && (
            <span className="text-[10px] text-blue-200/90 font-normal truncate max-w-[260px] leading-tight">
              {selectedDeviceName}
            </span>
          )}
        </Button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,.png,.jpg,.jpeg" 
          multiple 
          onChange={handleFileChange} 
        />
        <Button 
          variant="outline" 
          className="w-full h-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning || isUploading || isExtracting}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          อัพโหลดไฟล์จากเครื่อง
        </Button>
      </div>

      <Separator />

      {/* Save Button */}
      <div className="space-y-1">
        <Button 
          className={cn(
            "w-full font-medium h-8.5 text-xs transition-colors shadow-xs",
            hasPages 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
              : "bg-emerald-600/80 hover:bg-emerald-600 text-white"
          )} 
          onClick={onSave}
          disabled={isUploading || isScanning || isExtracting}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังบันทึกข้อมูลเข้าระบบ DMS...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              บันทึกเข้าระบบ DMS
            </>
          )}
        </Button>
        {!hasPages && (
          <p className="text-[10.5px] text-muted-foreground text-center">
            * ต้องสแกนหรืออัพโหลดเอกสารอย่างน้อย 1 หน้าก่อนบันทึก
          </p>
        )}
      </div>

      {uploadResult && (
        <Alert
          variant={uploadResult.status === 'success' ? 'default' : 'destructive'}
          className={uploadResult.status === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : ''}
        >
          {uploadResult.status === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription className="text-xs font-medium">
            {uploadResult.status === 'success' ? 'บันทึกสำเร็จ!' : uploadResult.message || 'เกิดข้อผิดพลาดในการบันทึก'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
