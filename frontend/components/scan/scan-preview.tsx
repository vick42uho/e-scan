'use client';

import React from 'react';
import { ScannedPage } from '@/types/scan';
import { ScanLine, X, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ScanPreviewProps {
  pages: ScannedPage[];
  activeIndex: number;
  onSelectPage: (index: number) => void;
  onRemovePage: (index: number) => void;
  onClearAll?: () => void;
}

export function ScanPreview({ pages, activeIndex, onSelectPage, onRemovePage, onClearAll }: ScanPreviewProps) {
  if (pages.length === 0) {
    return (
      <Empty className="flex-1 justify-center p-8 border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-16 mb-2 bg-slate-100 dark:bg-slate-800 text-slate-400">
            <ScanLine className="h-8 w-8 stroke-1" />
          </EmptyMedia>
          <EmptyTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
            ยังไม่มีเอกสารในพื้นที่สแกน
          </EmptyTitle>
          <EmptyDescription className="text-xs text-slate-400">
            สแกนจากเครื่อง Scanner หรืออัพโหลดเอกสารเพื่อแสดงตัวอย่าง
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const activePage = pages[activeIndex] || pages[0];
  const fileNameLower = (activePage.fileName || '').toLowerCase();
  const isPdf = fileNameLower.endsWith('.pdf') || activePage.blob?.type === 'application/pdf';
  const isTiff = fileNameLower.endsWith('.tiff') || fileNameLower.endsWith('.tif') || activePage.blob?.type?.includes('tiff');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Main Preview Area */}
      <div className="flex-1 bg-slate-800 p-4 flex items-center justify-center overflow-hidden relative">
        {/* Page Indicator & Action Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 pointer-events-auto shadow-md">
            <span>หน้า {activeIndex + 1} จาก {pages.length}</span>
            {isPdf && (
              <Badge variant="destructive" className="text-[10px] uppercase font-bold py-0 h-4">
                PDF Document
              </Badge>
            )}
            {isTiff && (
              <Badge variant="outline" className="bg-amber-500/80 text-white border-0 text-[10px] uppercase font-bold py-0 h-4">
                TIFF Document
              </Badge>
            )}
          </div>

          {onClearAll && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onClearAll}
              className="pointer-events-auto h-7 px-2.5 text-[11px] gap-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full shadow-lg border border-rose-400/30 backdrop-blur-sm cursor-pointer"
              title="ล้างเอกสารปัจจุบันและรีเซ็ตข้อมูลฟอร์ม"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>ล้างเอกสาร</span>
            </Button>
          )}
        </div>
        
        {isPdf ? (
          <iframe 
            src={`${activePage.dataUrl}#toolbar=1&navpanes=0`} 
            className="w-full h-full rounded-md shadow-2xl bg-white border-0" 
            aria-label={activePage.fileName}
          />
        ) : isTiff ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-md rounded-lg text-white border border-white/20 max-w-sm text-center">
            <FileText className="h-14 w-14 text-amber-400 mb-3" />
            <p className="font-semibold text-sm mb-1">{activePage.fileName}</p>
            <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30 uppercase font-bold py-0 h-5">
              TIFF Medical Image
            </Badge>
            <p className="text-xs text-slate-300 mt-2">เอกสารพร้อมบันทึกและสกัดข้อมูลเรียบร้อยแล้ว</p>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={activePage.dataUrl} 
            alt={`Page ${activeIndex + 1}`} 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
          />
        )}
      </div>

      {/* Barcode Info Bar */}
      {activePage.barcodes && activePage.barcodes.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/60 border-y border-blue-100 dark:border-blue-900 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 shrink-0">พบ Barcode / QR:</span>
          {activePage.barcodes.map((bc, idx) => (
            <Badge key={idx} variant="outline" className="bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 shrink-0">
              {bc.text} ({bc.format})
            </Badge>
          ))}
        </div>
      )}

      {/* Thumbnail Strip */}
      <div className="h-32 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 overflow-x-auto shrink-0 shadow-inner">
        {pages.map((page, idx) => {
          const pNameLower = (page.fileName || '').toLowerCase();
          const pageIsPdf = pNameLower.endsWith('.pdf') || page.blob?.type === 'application/pdf';
          const pageIsTiff = pNameLower.endsWith('.tiff') || pNameLower.endsWith('.tif') || page.blob?.type?.includes('tiff');

          return (
            <div 
              key={page.id} 
              className={`relative h-[100px] w-[80px] shrink-0 rounded overflow-hidden cursor-pointer border-2 transition-all group ${
                idx === activeIndex ? 'border-blue-500 shadow-md scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
              }`}
              onClick={() => onSelectPage(idx)}
            >
              {pageIsPdf ? (
                <div className="h-full w-full bg-red-50 dark:bg-red-950/40 flex flex-col items-center justify-center p-1.5 text-center select-none">
                  <FileText className="h-8 w-8 text-red-500 mb-1 shrink-0" />
                  <span className="text-[9px] font-medium text-slate-700 dark:text-slate-300 truncate w-full px-0.5">
                    {page.fileName}
                  </span>
                  <Badge variant="destructive" className="text-[8px] font-bold uppercase py-0 h-3.5 mt-0.5 px-1">
                    PDF
                  </Badge>
                </div>
              ) : pageIsTiff ? (
                <div className="h-full w-full bg-amber-50 dark:bg-amber-950/40 flex flex-col items-center justify-center p-1.5 text-center select-none">
                  <FileText className="h-8 w-8 text-amber-600 mb-1 shrink-0" />
                  <span className="text-[9px] font-medium text-slate-700 dark:text-slate-300 truncate w-full px-0.5">
                    {page.fileName}
                  </span>
                  <Badge variant="secondary" className="text-[8px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 py-0 h-3.5 mt-0.5 px-1 border-0">
                    TIFF
                  </Badge>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={page.dataUrl} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
              )}

              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-5 w-5 p-0 rounded-full"
                  onClick={(e) => { e.stopPropagation(); onRemovePage(idx); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-0.5 z-10">
                {idx + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
