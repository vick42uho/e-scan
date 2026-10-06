'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocalScanner } from '@/hooks/use-local-scanner';
import { ScanTopBar } from './scan-top-bar';
import { ScanForm } from './scan-form';
import { ScanActions } from './scan-actions';
import { ScanPreview } from './scan-preview';
import { getCategories, getEncounters, uploadDocument, uploadAdditionalPage, extractMetadata } from '@/services/scan-api';
import { decodeBarcodesFromBlob, parseBarcodePayload } from '@/lib/barcode-scanner';
import { 
  ScannedPage, 
  ScanFormData, 
  DocumentCategoryOption, 
  EncounterOption, 
  UploadResult,
  ExtractionMode
} from '@/types/scan';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Sparkles, 
  X, 
  FileText, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ExternalLink, 
  Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateAgeFromDob, formatThaiDate } from '@/lib/date-utils';

interface SaveFeedbackState {
  isOpen: boolean;
  type: 'success' | 'validation_error' | 'error';
  title: string;
  message?: string;
  missingFields?: string[];
  savedInfo?: {
    documentId: string;
    hn: string;
    patientName: string;
    categoryName: string;
    title: string;
    totalPages: number;
    visitDate?: string;
  };
}

export default function ScanWorkspace() {
  const searchParams = useSearchParams();
  const defaultHn = searchParams.get('hn') || '';

  const { bridgeStatus, devices, isScanning, checkBridge, scanPage } = useLocalScanner();

  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [categories, setCategories] = useState<DocumentCategoryOption[]>([]);
  const [encounters, setEncounters] = useState<EncounterOption[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionInfo, setExtractionInfo] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedbackState>({
    isOpen: false,
    type: 'success',
    title: '',
  });
  
  const [dpi, setDpi] = useState(200);
  const [colorMode, setColorMode] = useState('Color');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('auto');
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  const initialFormData: ScanFormData = {
    hn: defaultHn,
    patient_name: '',
    age: '',
    dob: '',
    en: '',
    visit_date: '',
    visit_time: '',
    title: '',
    category_id: '' as unknown as number,
    document_code: '',
    doctor_code: '',
    doctor_name: '',
    encounter_type: 'OPD',
    is_doctor_document: false,
    is_confidential: false,
  };

  const [formData, setFormData] = useState<ScanFormData>(initialFormData);

  const handleClearAll = useCallback(() => {
    setPages([]);
    setActiveIndex(0);
    setFormData({
      hn: '',
      patient_name: '',
      age: '',
      dob: '',
      en: '',
      visit_date: '',
      visit_time: '',
      title: '',
      category_id: '' as unknown as number,
      document_code: '',
      doctor_code: '',
      doctor_name: '',
      encounter_type: 'OPD',
      is_doctor_document: false,
      is_confidential: false,
    });
    setEncounters([]);
    setExtractionInfo(null);
    setUploadResult(null);
  }, []);

  useEffect(() => {
    checkBridge();
    getCategories().then(setCategories).catch(console.error);
  }, [checkBridge]);

  // เลือกเครื่องสแกนตัวแรกอัตโนมัติเมื่อพบเครื่อง
  useEffect(() => {
    if (devices.length > 0) {
      if (!selectedDeviceId || !devices.some(d => d.id === selectedDeviceId)) {
        setSelectedDeviceId(devices[0].id);
      }
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    if (formData.hn && formData.hn.length >= 7) {
      getEncounters(formData.hn).then((encList) => {
        setEncounters(encList);
        if (formData.en) {
          const cleanEn = formData.en.trim().toLowerCase();
          const matched = encList.find((e) => e.en.trim().toLowerCase() === cleanEn);
          if (matched && matched.visit_date && !formData.visit_date) {
            setFormData((prev) => ({
              ...prev,
              visit_date: matched.visit_date,
              visit_time: prev.visit_time || matched.visit_time || '',
              encounter_type: prev.encounter_type || (matched.encounter_type as 'OPD' | 'IPD' | 'O+I') || 'OPD',
              doctor_name: prev.doctor_name || matched.doctor_name || '',
            }));
          }
        }
      }).catch(console.error);
    } else {
      setEncounters([]);
    }
  }, [formData.hn]);

  // ซิงค์ข้อมูล Encounter (visit_date, visit_time, encounter_type, doctor_name) อัตโนมัติเมื่อ encounters โหลดเสร็จ หรือเมื่อมี EN ตรงกัน
  useEffect(() => {
    if (!formData.en || encounters.length === 0) return;
    const cleanEn = formData.en.trim().toLowerCase();
    const matched = encounters.find((e) => e.en.trim().toLowerCase() === cleanEn);
    if (matched && matched.visit_date) {
      if (!formData.visit_date || (!formData.visit_time && matched.visit_time)) {
        setFormData((prev) => ({
          ...prev,
          visit_date: prev.visit_date || matched.visit_date,
          visit_time: prev.visit_time || matched.visit_time || '',
          encounter_type: prev.encounter_type || (matched.encounter_type as 'OPD' | 'IPD' | 'O+I') || 'OPD',
          doctor_name: prev.doctor_name || matched.doctor_name || '',
        }));
      }
    }
  }, [encounters, formData.en, formData.visit_date, formData.visit_time]);

  // ฟังก์ชันสกัดข้อมูลอัตโนมัติแบบไดนามิก รองรับ modeOverride ทันทีเมื่อสลับ dropdown
  const runExtraction = useCallback(async (blob: Blob, fileName: string, modeOverride?: ExtractionMode) => {
    const activeMode = modeOverride || extractionMode;
    setIsExtracting(true);
    setExtractionInfo(null);
    try {
      const res = await extractMetadata(blob, fileName, activeMode);
      if (res.status === 'success' && res.data) {
        const d = res.data;
        const docName = (d.doctor_name || '').trim();
        
        const computedAge = d.dob ? calculateAgeFromDob(d.dob) : null;
        
        const nameDisplay = d.name_th || d.name || d.name_en;

        setFormData(prev => ({
          ...prev,
          hn: d.hn ? d.hn : prev.hn,
          en: d.en ? d.en : prev.en,
          visit_date: d.visit_date ? d.visit_date : prev.visit_date,
          visit_time: d.visit_time ? d.visit_time : prev.visit_time,
          patient_name: nameDisplay ? nameDisplay : prev.patient_name,
          age: computedAge || (d.age ? d.age : prev.age),
          dob: d.dob ? d.dob : prev.dob,
          title: d.title ? d.title : prev.title,
          category_id: (d.category_id !== null && d.category_id !== undefined) ? d.category_id : prev.category_id,
          document_code: d.document_code ? d.document_code : prev.document_code,
          doctor_name: docName || prev.doctor_name,
          // ซิงค์อัตโนมัติ: ถ้าตรวจพบชื่อแพทย์ ให้ติ๊กเป็นเอกสารแพทย์ทันที
          is_doctor_document: prev.is_doctor_document || Boolean((docName || prev.doctor_name).length > 0),
          encounter_type: d.encounter_type ? d.encounter_type : prev.encounter_type,
        }));

        if (d.hn) {
          getEncounters(d.hn).then((encList) => {
            setEncounters(encList);
            const targetEn = d.en || formData.en;
            if (targetEn) {
              const matched = encList.find((e) => e.en.trim().toLowerCase() === targetEn.trim().toLowerCase());
              if (matched && matched.visit_date) {
                setFormData((p) => ({
                  ...p,
                  visit_date: p.visit_date || matched.visit_date,
                  visit_time: p.visit_time || matched.visit_time || '',
                  encounter_type: p.encounter_type || (matched.encounter_type as 'OPD' | 'IPD' | 'O+I') || 'OPD',
                  doctor_name: p.doctor_name || matched.doctor_name || '',
                }));
              }
            }
          }).catch(console.error);
        }

        const modeLabels: Record<string, string> = {
          barcode: 'สติ๊กเกอร์ Barcode / QR',
          pdf_text: 'ข้อความดิจิทัล (PDF Text Layer)',
          ocr: 'OCR อ่านข้อความจากภาพ',
          auto: 'ตรวจจับอัตโนมัติ (Hybrid)'
        };
        const modeText = modeLabels[res.mode_used] || res.mode_used;
        
        const summary = [];
        if (d.hn) summary.push(`HN: ${d.hn}`);
        if (d.en) summary.push(`VN/EN: ${d.en}`);
        if (d.visit_date) summary.push(`วันตรวจ: ${formatThaiDate(d.visit_date)}`);
        if (d.visit_time) summary.push(`เวลา: ${d.visit_time}`);
        if (nameDisplay) summary.push(`ชื่อ: ${nameDisplay}`);
        if (computedAge || d.age) summary.push(`อายุ: ${computedAge || d.age}`);
        if (d.dob) summary.push(`เกิด: ${d.dob}`);
        if (d.category_name) summary.push(`หมวด: ${d.category_name}`);
        if (d.doctor_name) summary.push(`แพทย์: ${d.doctor_name}`);

        setExtractionInfo(`ตรวจพบข้อมูลสำเร็จ [${modeText}]: ${summary.join(' | ')}`);
      }
    } catch (err) {
      console.error('Metadata extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  }, [extractionMode]);

  // สลับโหมดแล้วสั่งตรวจจับซ้ำอัตโนมัติทันที ไม่ต้องให้ผู้ใช้คลิกปุ่มเอง
  const handleExtractionModeChange = (mode: ExtractionMode) => {
    setExtractionMode(mode);
    if (pages.length > 0) {
      const active = pages[activeIndex] || pages[0];
      if (active) {
        runExtraction(active.blob, active.fileName, mode);
      }
    }
  };

  // สลับหน้าพรีวิวแล้วตรวจจับข้อมูลของหน้านั้นให้อัตโนมัติ
  const handleSelectPage = (index: number) => {
    setActiveIndex(index);
    const targetPage = pages[index];
    if (targetPage) {
      runExtraction(targetPage.blob, targetPage.fileName, extractionMode);
    }
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];
  const selectedDeviceName = selectedDevice?.name || '';

  const handleScan = async () => {
    const targetDeviceId = selectedDeviceId || (devices.length > 0 ? devices[0].id : undefined);
    console.log('[e-Scan] Initiating scan with device ID:', targetDeviceId, 'Name:', selectedDeviceName);
    const dataUrl = await scanPage(dpi, colorMode, targetDeviceId);
    if (dataUrl) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const barcodes = await decodeBarcodesFromBlob(blob);
        
        const newPage: ScannedPage = {
          id: Math.random().toString(36).substring(7),
          dataUrl,
          blob,
          fileName: `scan_${Date.now()}.jpg`,
          barcodes
        };

        setPages(prev => {
          const next = [...prev, newPage];
          return next;
        });

        const newIndex = pages.length;
        setActiveIndex(newIndex);

        // ตรวจสอบ Barcode / QR Code (รองรับทั้ง Key=Value และ Barcode เดี่ยว)
        if (barcodes && barcodes.length > 0) {
          for (const bc of barcodes) {
            const parsed = parseBarcodePayload(bc.text, categories);
            if (parsed) {
              setFormData(prev => ({
                ...prev,
                hn: parsed.hn || prev.hn,
                en: parsed.en || prev.en,
                visit_date: parsed.visit_date || prev.visit_date,
                visit_time: parsed.visit_time || prev.visit_time,
                category_id: (parsed.category_id !== null && parsed.category_id !== undefined) ? parsed.category_id : prev.category_id,
                title: parsed.title || prev.title,
                dob: parsed.dob || prev.dob,
                age: parsed.age || prev.age,
                encounter_type: parsed.encounter_type || prev.encounter_type,
                patient_name: parsed.patient_name || prev.patient_name,
                doctor_name: parsed.doctor_name || prev.doctor_name,
                document_code: parsed.document_code || prev.document_code,
              }));
              if (parsed.hn) {
                getEncounters(parsed.hn).then(setEncounters).catch(console.error);
              }
              break;
            }
          }
        }

        // สลับไปแท็บตัวอย่างบนมือถือ
        setMobileTab('preview');

        // สกัดข้อมูลอัตโนมัติทันที
        await runExtraction(blob, newPage.fileName, extractionMode);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFileSelect = async (files: FileList) => {
    if (!files || files.length === 0) return;

    // เคลียร์ข้อมูลเอกสารเดิมทั้งหมดก่อนโหลดเอกสารใหม่
    handleClearAll();

    const newPages: ScannedPage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = URL.createObjectURL(file);
      const barcodes = await decodeBarcodesFromBlob(file, file.name);
      
      newPages.push({
        id: Math.random().toString(36).substring(7),
        dataUrl,
        blob: file,
        fileName: file.name,
        barcodes
      });
    }

    if (newPages.length > 0) {
      setPages(newPages);
      setActiveIndex(0);

      // ตรวจสอบ Barcode / QR Code จากทุกหน้าที่เพิ่งอัพโหลดเข้ามา
      const allBarcodes = newPages.flatMap(p => p.barcodes || []);
      if (allBarcodes.length > 0) {
        for (const bc of allBarcodes) {
          const parsed = parseBarcodePayload(bc.text, categories);
          if (parsed) {
            setFormData(prev => ({
              ...prev,
              hn: parsed.hn || prev.hn,
              en: parsed.en || prev.en,
              visit_date: parsed.visit_date || prev.visit_date,
              visit_time: parsed.visit_time || prev.visit_time,
              category_id: (parsed.category_id !== null && parsed.category_id !== undefined) ? parsed.category_id : prev.category_id,
              title: parsed.title || prev.title,
              dob: parsed.dob || prev.dob,
              age: parsed.age || prev.age,
              encounter_type: parsed.encounter_type || prev.encounter_type,
              patient_name: parsed.patient_name || prev.patient_name,
              doctor_name: parsed.doctor_name || prev.doctor_name,
              document_code: parsed.document_code || prev.document_code,
            }));
            if (parsed.hn) {
              getEncounters(parsed.hn).then(setEncounters).catch(console.error);
            }
            break;
          }
        }
      }

      // สลับไปแท็บตัวอย่างบนมือถือ
      setMobileTab('preview');

      // สกัดข้อมูลอัตโนมัติจากหน้าที่เปิดดูทันที
      const firstTarget = newPages[0];
      await runExtraction(firstTarget.blob, firstTarget.fileName, extractionMode);
    }
  };

  const handleReExtract = () => {
    if (pages.length > 0) {
      const active = pages[activeIndex] || pages[0];
      runExtraction(active.blob, active.fileName, extractionMode);
    }
  };

  const handleRemovePage = (index: number) => {
    setPages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        handleClearAll();
        return [];
      }
      if (activeIndex >= next.length) {
        setActiveIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleSave = async () => {
    // 1. Validation check
    const missingFields: string[] = [];
    if (pages.length === 0) missingFields.push('ยังไม่มีไฟล์เอกสารที่สแกนหรืออัพโหลด (กรุณาสแกนหรือเลือกไฟล์ก่อน)');
    if (!formData.hn?.trim()) missingFields.push('เลขประจำตัวผู้ป่วย (HN)');
    if (!formData.patient_name?.trim()) missingFields.push('ชื่อ-นามสกุลผู้ป่วย');
    if (!formData.category_id) missingFields.push('หมวดหมู่เอกสาร');
    if (!formData.title?.trim()) missingFields.push('ชื่อเอกสาร');
    // ตรวจสอบและดึงค่า visit_date สำรองจาก HIS หาก formData.visit_date ยังว่างอยู่แต่มี EN ที่ตรงกัน
    let effectiveVisitDate = formData.visit_date?.trim();
    if (!effectiveVisitDate && formData.en?.trim() && encounters.length > 0) {
      const cleanEn = formData.en.trim().toLowerCase();
      const matched = encounters.find((e) => e.en.trim().toLowerCase() === cleanEn);
      if (matched?.visit_date) {
        effectiveVisitDate = matched.visit_date;
        setFormData((prev) => ({ ...prev, visit_date: matched.visit_date }));
      }
    }

    if (formData.en?.trim() && !effectiveVisitDate) missingFields.push('วันที่รับบริการ (Visit Date)');

    if (missingFields.length > 0) {
      setSaveFeedback({
        isOpen: true,
        type: 'validation_error',
        title: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน',
        message: 'ระบบต้องการข้อมูลต่อไปนี้เพื่อจัดทำดัชนีเวชระเบียนที่ถูกต้องและปลอดภัย:',
        missingFields,
      });
      setUploadResult({
        status: 'error',
        message: `กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(', ')}`,
      });
      setMobileTab('form');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const firstPage = pages[0];
      const dataToSubmit: ScanFormData = {
        ...formData,
        visit_date: effectiveVisitDate || formData.visit_date || '',
        visit_time: formData.visit_time?.trim() || '',
      };
      const result = await uploadDocument(firstPage.blob, firstPage.fileName, dataToSubmit);
      
      let finalTotalPages = pages.length;
      if (result.status === 'success' && result.document_id && pages.length > 1) {
        for (let i = 1; i < pages.length; i++) {
          const page = pages[i];
          await uploadAdditionalPage(result.document_id, page.blob, page.fileName, `หน้า ${i + 1}`);
        }
      }

      // Find category name for display
      const cat = categories.find(c => String(c.id) === String(formData.category_id));
      const catName = cat ? (cat.name_th && cat.name_en ? `${cat.name_th} (${cat.name_en})` : cat.name_th || cat.name_en || '') : '';

      setSaveFeedback({
        isOpen: true,
        type: 'success',
        title: 'บันทึกเอกสารเวชระเบียนสำเร็จ!',
        message: 'เอกสารถูกนำเข้า จัดเก็บลงคลังเวชระเบียน และเชื่อมโยงประวัติคนไข้เรียบร้อยแล้ว',
        savedInfo: {
          documentId: result.document_id || '',
          hn: formData.hn,
          patientName: formData.patient_name || '',
          categoryName: catName,
          title: formData.title,
          totalPages: finalTotalPages,
          visitDate: formData.visit_date,
        }
      });

      // ล้างข้อมูลฟอร์มและภาพสแกนเดิมทั้งหมดทันที ให้พร้อมสำหรับเคสถัดไป 100%
      handleClearAll();
    } catch (e: any) {
      setSaveFeedback({
        isOpen: true,
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึกเอกสาร',
        message: e.message || 'ไม่สามารถบันทึกเอกสารเข้าระบบได้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง',
      });
      setUploadResult({ status: 'error', message: e.message || 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-sans bg-slate-100 dark:bg-slate-950">
      {/* 1. Hospital Header */}
      <ScanTopBar 
        bridgeStatus={bridgeStatus} 
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={setSelectedDeviceId}
      />

      {/* 2. Mobile Responsive Tab Switcher (< md) */}
      <div className="md:hidden flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-1.5 gap-1 shrink-0 z-20">
        <Button
          type="button"
          variant={mobileTab === 'form' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMobileTab('form')}
          className={cn(
            'flex-1 h-8 text-xs font-medium gap-1.5',
            mobileTab === 'form' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>ข้อมูล & สแกน</span>
        </Button>
        <Button
          type="button"
          variant={mobileTab === 'preview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMobileTab('preview')}
          className={cn(
            'flex-1 h-8 text-xs font-medium gap-1.5',
            mobileTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>ตัวอย่าง {pages.length > 0 && `(${pages.length} หน้า)`}</span>
        </Button>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Control & Form Panel */}
        <div
          className={cn(
            'flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 h-full',
            'w-full md:w-[380px] lg:w-[420px]',
            mobileTab === 'form' ? 'flex' : 'hidden md:flex'
          )}
        >
          {/* Active Extraction Progress Banner (Directly in Form View) */}
          {isExtracting && (
            <div className="bg-blue-50 dark:bg-blue-950/80 border-b border-blue-200 dark:border-blue-800 px-3 py-1.5 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 animate-pulse shrink-0">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="font-medium">กำลังตรวจจับข้อมูลอัตโนมัติ (Barcode / OCR)...</span>
            </div>
          )}

          {/* Extraction Success Pill on Form Panel */}
          {extractionInfo && (
            <div className="bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 px-3 py-1.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="truncate font-medium text-[11px]">{extractionInfo}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExtractionInfo(null)}
                className="h-5 w-5 p-0 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/50 rounded-xs"
                aria-label="ปิดการแจ้งเตือน"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-hidden min-h-0">
            <ScanForm 
              formData={formData} 
              onChange={setFormData} 
              categories={categories} 
              encounters={encounters} 
              onAddCategory={(newCat) => {
                setCategories((prev) => [...prev, newCat]);
                setFormData((prev) => ({ ...prev, category_id: newCat.id }));
              }}
              onLookupSuccess={(hn) => {
                getEncounters(hn).then(setEncounters).catch(console.error);
              }}
            />
          </div>
          <ScanActions 
            bridgeStatus={bridgeStatus}
            isScanning={isScanning}
            isUploading={isUploading}
            isExtracting={isExtracting}
            hasPages={pages.length > 0}
            dpi={dpi}
            colorMode={colorMode}
            extractionMode={extractionMode}
            selectedDeviceName={selectedDeviceName}
            onChangeDpi={setDpi}
            onChangeColorMode={setColorMode}
            onChangeExtractionMode={handleExtractionModeChange}
            onScan={handleScan}
            onFileSelect={handleFileSelect}
            onReExtract={handleReExtract}
            onSave={handleSave}
            uploadResult={uploadResult}
          />
        </div>

        {/* Right Preview Panel */}
        <div
          className={cn(
            'flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden relative h-full min-w-0',
            mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
          )}
        >
          {isExtracting && (
            <div className="absolute top-3 right-4 z-40">
              <Badge variant="default" className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg animate-pulse border-0">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>กำลังวิเคราะห์และสกัดข้อมูลเอกสาร...</span>
              </Badge>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ScanPreview 
              pages={pages}
              activeIndex={activeIndex}
              onSelectPage={handleSelectPage}
              onRemovePage={handleRemovePage}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
      </div>

      {/* Save Result & Validation Feedback Dialog (Hospital Grade) */}
      <Dialog
        open={saveFeedback.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSaveFeedback(prev => ({ ...prev, isOpen: false }));
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {saveFeedback.type === 'success' && saveFeedback.savedInfo && (
            <>
              <DialogHeader className="items-center text-center pb-1">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <DialogTitle className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {saveFeedback.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {saveFeedback.message}
                </DialogDescription>
              </DialogHeader>

              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-muted-foreground">เลขประจำตัวผู้ป่วย (HN):</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{saveFeedback.savedInfo.hn}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-muted-foreground">ชื่อ-นามสกุล:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{saveFeedback.savedInfo.patientName || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-muted-foreground">หมวดหมู่เอกสาร:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{saveFeedback.savedInfo.categoryName || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-muted-foreground">ชื่อเอกสาร:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[220px]" title={saveFeedback.savedInfo.title}>{saveFeedback.savedInfo.title}</span>
                </div>
                {saveFeedback.savedInfo.visitDate && (
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-muted-foreground">วันที่รับบริการ:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200 font-mono">
                      {formatThaiDate(saveFeedback.savedInfo.visitDate)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">จำนวนหน้าที่จัดเก็บ:</span>
                  <Badge variant="secondary" className="font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                    {saveFeedback.savedInfo.totalPages} หน้า
                  </Badge>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-xs gap-1.5 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={() => {
                    const hn = saveFeedback.savedInfo?.hn;
                    if (hn) {
                      window.open(`/view?hn=${encodeURIComponent(hn)}`, '_blank');
                    }
                    setSaveFeedback(prev => ({ ...prev, isOpen: false }));
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  เปิดดูใน Viewer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  onClick={() => {
                    handleClearAll();
                    setSaveFeedback(prev => ({ ...prev, isOpen: false }));
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  สแกน / นำเข้าเคสถัดไป
                </Button>
              </DialogFooter>
            </>
          )}

          {saveFeedback.type === 'validation_error' && (
            <>
              <DialogHeader className="items-center text-center pb-1">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <DialogTitle className="text-base font-bold text-amber-700 dark:text-amber-400">
                  {saveFeedback.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {saveFeedback.message}
                </DialogDescription>
              </DialogHeader>

              {saveFeedback.missingFields && saveFeedback.missingFields.length > 0 && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                    รายการข้อมูลที่ยังไม่ครบถ้วน:
                  </p>
                  <ul className="text-xs space-y-1 text-amber-800 dark:text-amber-300/90 pl-1">
                    {saveFeedback.missingFields.map((field, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  onClick={() => {
                    setSaveFeedback(prev => ({ ...prev, isOpen: false }));
                    setMobileTab('form');
                  }}
                >
                  กลับไปกรอกข้อมูลให้ครบ
                </Button>
              </DialogFooter>
            </>
          )}

          {saveFeedback.type === 'error' && (
            <>
              <DialogHeader className="items-center text-center pb-1">
                <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <DialogTitle className="text-base font-bold text-rose-700 dark:text-rose-400">
                  {saveFeedback.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  เกิดข้อผิดพลาดในการบันทึกข้อมูลเข้าระบบ DMS
                </DialogDescription>
              </DialogHeader>

              <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-3 text-xs text-rose-800 dark:text-rose-300">
                <p className="font-mono">{saveFeedback.message}</p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setSaveFeedback(prev => ({ ...prev, isOpen: false }))}
                >
                  ปิดหน้าต่าง
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
