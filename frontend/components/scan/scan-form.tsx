'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from '@/components/ui/combobox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScanFormData, DocumentCategoryOption, EncounterOption } from '@/types/scan';
import { 
  User, 
  FileText, 
  Calendar, 
  Stethoscope, 
  Search, 
  Loader2, 
  Plus, 
  FolderPlus, 
  CheckCircle2, 
  AlertCircle,
  X,
  Lock,
  Unlock,
  RotateCcw,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateAgeFromDob, getTodayIso, formatThaiDate } from '@/lib/date-utils';
import { createCategory, lookupPatientOrEncounter } from '@/services/scan-api';

interface ScanFormProps {
  formData: ScanFormData;
  onChange: (data: ScanFormData) => void;
  categories: DocumentCategoryOption[];
  encounters: EncounterOption[];
  onAddCategory?: (category: DocumentCategoryOption) => void;
  onLookupSuccess?: (hn: string) => void;
}

interface CategoryGroup {
  value: string;
  items: string[];
}

/**
 * Format category label:
 * If both name_th and name_en exist and are different, display both: "name_th (name_en)"
 * If only one exists, display that one.
 */
function formatCategoryDisplay(cat: { name_th?: string | null; name_en?: string | null; code?: string | null }): string {
  const th = (cat.name_th || '').trim();
  const en = (cat.name_en || '').trim();
  if (th && en && th.toLowerCase() !== en.toLowerCase()) {
    return `${th} (${en})`;
  }
  return th || en || cat.code || '';
}

export function ScanForm({
  formData,
  onChange,
  categories,
  encounters,
  onAddCategory,
  onLookupSuccess,
}: ScanFormProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Matched encounter from encounters list
  const matchedEncounter = useMemo(() => {
    if (!formData.en || !encounters || encounters.length === 0) return null;
    const clean = formData.en.trim().toLowerCase();
    return encounters.find((e) => e.en.trim().toLowerCase() === clean) || null;
  }, [formData.en, encounters]);

  // Track if user explicitly unlocked the HIS date to edit manually
  const [isDateUnlocked, setIsDateUnlocked] = useState(false);

  // Reset unlocked state when user changes EN/VN
  useEffect(() => {
    setIsDateUnlocked(false);
  }, [formData.en]);

  // Auto-sync visit_date & visit_time if matchedEncounter has them and formData is empty
  useEffect(() => {
    if (matchedEncounter) {
      let hasUpdate = false;
      const updated = { ...formData };
      if (matchedEncounter.visit_date && !formData.visit_date) {
        updated.visit_date = matchedEncounter.visit_date;
        hasUpdate = true;
      }
      if (matchedEncounter.visit_time && !formData.visit_time) {
        updated.visit_time = matchedEncounter.visit_time;
        hasUpdate = true;
      }
      if (matchedEncounter.encounter_type && !formData.encounter_type) {
        updated.encounter_type = (matchedEncounter.encounter_type as 'OPD' | 'IPD' | 'O+I');
        hasUpdate = true;
      }
      if (matchedEncounter.doctor_name && !formData.doctor_name) {
        updated.doctor_name = matchedEncounter.doctor_name;
        hasUpdate = true;
      }
      if (hasUpdate) {
        onChange(updated);
      }
    }
  }, [matchedEncounter, formData.visit_date, formData.visit_time]);

  // Determine if the visit date should be locked (NEVER lock an empty required field!)
  const isDateLocked = Boolean(matchedEncounter && formData.visit_date && !isDateUnlocked);

  // Dialog state for adding a category
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCatNameTh, setNewCatNameTh] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatType, setNewCatType] = useState('');
  const [isCustomType, setIsCustomType] = useState(false);
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [catError, setCatError] = useState('');

  // 1. Grouped categories by category_type & formatted dual-language labels
  const { groupedCategories, categoryByLabel, labelById, availableCategoryTypes } = useMemo(() => {
    const labelCounts = new Map<string, number>();
    categories.forEach((c) => {
      const base = formatCategoryDisplay(c);
      labelCounts.set(base, (labelCounts.get(base) || 0) + 1);
    });

    const catByLabel = new Map<string, DocumentCategoryOption>();
    const lblById = new Map<number, string>();
    const groupsMap = new Map<string, string[]>();
    const typesSet = new Set<string>();

    categories.forEach((c) => {
      const base = formatCategoryDisplay(c);
      // Disambiguate if identical label exists in multiple records
      const label = (labelCounts.get(base) || 0) > 1 ? `${base} [${c.code}]` : base;

      catByLabel.set(label, c);
      lblById.set(c.id, label);

      const groupName = (c.category_type || '').trim() || 'ทั่วไป (General)';
      typesSet.add(groupName);

      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, []);
      }
      groupsMap.get(groupName)!.push(label);
    });

    const groups: CategoryGroup[] = Array.from(groupsMap.entries())
      .filter(([_, items]) => items.length > 0)
      .map(([value, items]) => ({
        value,
        items,
      }));

    return {
      groupedCategories: groups,
      categoryByLabel: catByLabel,
      labelById: lblById,
      availableCategoryTypes: Array.from(typesSet),
    };
  }, [categories]);

  // เปิด Dialog เพิ่มหมวดหมู่ พร้อมรีเซ็ตค่าเริ่มต้นอย่างปลอดภัย
  const handleOpenCategoryDialog = () => {
    setNewCatNameTh('');
    setNewCatNameEn('');
    setNewCatCode('');
    setNewCatType(availableCategoryTypes[0] || '');
    setIsCustomType(false);
    setCatError('');
    setIsCategoryDialogOpen(true);
  };

  const updateField = (field: keyof ScanFormData, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  const encounterTypes: Array<{
    key: "OPD" | "IPD" | "O+I";
    label: string;
    sub?: string;
  }> = [
    { key: "OPD", label: "OPD", sub: "ผู้ป่วยนอก" },
    { key: "IPD", label: "IPD", sub: "ผู้ป่วยใน" },
    { key: "O+I", label: "OPD + IPD", sub: "ทั้งหมด" },
  ];

  // Auto-calculate age whenever DOB changes
  const handleDobChange = (val: string) => {
    const computedAge = calculateAgeFromDob(val);
    if (computedAge) {
      onChange({ ...formData, dob: val, age: computedAge });
    } else {
      updateField('dob', val);
    }
  };

  // Lookup Patient/Encounter by HN or VN
  const handleLookup = async (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsSearching(true);
    setLookupFeedback({ type: null, message: '' });

    try {
      const res = await lookupPatientOrEncounter(cleanQuery);
      if (res.found) {
        const computedAge = calculateAgeFromDob(res.dob) || res.age || formData.age;
        const newDocName = (res.doctor_name || formData.doctor_name || '').trim();

        onChange({
          ...formData,
          hn: res.hn || formData.hn,
          patient_name: res.name_th || res.name_en || formData.patient_name,
          dob: res.dob || formData.dob,
          age: computedAge,
          en: res.en || formData.en,
          visit_date: res.visit_date || formData.visit_date,
          visit_time: res.visit_time || formData.visit_time,
          encounter_type: (res.encounter_type as 'OPD' | 'IPD' | 'O+I') || formData.encounter_type,
          doctor_name: newDocName,
          is_doctor_document: formData.is_doctor_document || Boolean(newDocName.length > 0),
        });

        if (res.hn && onLookupSuccess) {
          onLookupSuccess(res.hn);
        }

        setLookupFeedback({
          type: 'success',
          message: `พบข้อมูล: ${res.name_th || res.hn} ${computedAge ? `(อายุ ${computedAge})` : ''}`,
        });
      } else {
        setLookupFeedback({
          type: 'error',
          message: res.message || 'ไม่พบข้อมูลในระบบ',
        });
      }
    } catch (err: any) {
      setLookupFeedback({
        type: 'error',
        message: err.message || 'เชื่อมต่อระบบดึงข้อมูลล้มเหลว',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Create new category
  const handleCreateCategory = async () => {
    if (!newCatNameTh.trim()) {
      setCatError('กรุณาระบุชื่อหมวดหมู่ภาษาไทย');
      return;
    }

    if (isCustomType && !newCatType.trim()) {
      setCatError('กรุณาระบุชื่อประเภทหมวดหมู่ใหม่');
      return;
    }

    setIsCreatingCat(true);
    setCatError('');

    try {
      const targetType = newCatType.trim() || availableCategoryTypes[0] || 'General';
      const created = await createCategory({
        name_th: newCatNameTh.trim(),
        name_en: newCatNameEn.trim() || undefined,
        code: newCatCode.trim() || undefined,
        category_type: targetType,
      });

      if (onAddCategory) {
        onAddCategory(created);
      }
      updateField('category_id', created.id);
      setIsCategoryDialogOpen(false);
      setIsCustomType(false);
      setNewCatNameTh('');
      setNewCatNameEn('');
      setNewCatCode('');
      setNewCatType(availableCategoryTypes[0] || '');
    } catch (err: any) {
      setCatError(err.message || 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่');
    } finally {
      setIsCreatingCat(false);
    }
  };

  return (
    <>
      <ScrollArea type="always" className="h-full">
        <div className="flex flex-col gap-3 py-3 px-3 sm:px-4 box-border max-w-full">
          {/* Lookup Feedback Badge */}
          {lookupFeedback.type && (
            <div
              className={cn(
                "flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md border",
                lookupFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
              )}
            >
              <div className="flex items-center gap-1.5 truncate">
                {lookupFeedback.type === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                )}
                <span className="truncate font-medium text-[11px]">
                  {lookupFeedback.message}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLookupFeedback({ type: null, message: "" })}
                className="h-4 w-4 p-0 text-slate-500 hover:text-slate-900"
              >
                ×
              </Button>
            </div>
          )}

          {/* 1. Patient Demographics Section */}
          <section className="space-y-2 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold text-xs">
                <User className="h-3.5 w-3.5" />
                <span>ข้อมูลผู้ป่วย</span>
              </div>
              {(formData.patient_name || formData.age) && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 h-4 py-0"
                >
                  ตรวจพบอัตโนมัติ
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                  HN <span className="text-rose-500">*</span>
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={formData.hn}
                    onChange={(e) => updateField("hn", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLookup(formData.hn);
                      }
                    }}
                    placeholder="00-00-00000"
                    className="font-mono text-xs h-8 bg-white dark:bg-slate-900 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSearching || !formData.hn}
                    onClick={() => handleLookup(formData.hn)}
                    className="h-8 px-2.5 text-xs shrink-0 gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800 transition-colors"
                  >
                    {isSearching ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>ดึงข้อมูล</span>
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                  ชื่อ-นามสกุลผู้ป่วย <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.patient_name || ""}
                  onChange={(e) => updateField("patient_name", e.target.value)}
                  placeholder="ระบุชื่อ-นามสกุล"
                  className="text-xs h-8 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                    อายุ (คำนวณปีปัจจุบัน)
                  </Label>
                  <Input
                    value={formData.age || ""}
                    onChange={(e) => updateField("age", e.target.value)}
                    placeholder="เช่น 32 ปี"
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                    วันเกิด (DOB)
                  </Label>
                  <Input
                    value={formData.dob || ""}
                    onChange={(e) => handleDobChange(e.target.value)}
                    placeholder="15 พ.ค. 2535 หรือ 1992-05-15"
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Visit & Encounter Section */}
          <section className="space-y-2 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold text-xs border-b border-slate-200/80 dark:border-slate-800 pb-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>ข้อมูลการรับบริการ (Encounter)</span>
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                  ประเภท Encounter (OPD / IPD / O+I)
                </Label>
                {/* Segmented Pill Control for OPD / IPD / O+I */}
                <div className="grid grid-cols-3 p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg gap-0.5">
                  {encounterTypes.map(({ key, label, sub }) => {
                    const isSelected = formData.encounter_type === key;
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant={isSelected ? "default" : "ghost"}
                        size="sm"
                        onClick={() => updateField("encounter_type", key)}
                        className={cn(
                          "h-7 text-xs font-medium py-0 px-1 transition-all flex items-center justify-center gap-1",
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs hover:bg-blue-700 dark:bg-blue-600"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60",
                        )}
                      >
                        <span className="font-semibold">{label}</span>
                        <span
                          className={cn(
                            "text-[9px] opacity-75 hidden sm:inline",
                            isSelected ? "text-blue-100" : "",
                          )}
                        >
                          {sub}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    VN / Encounter Number{" "}
                    <span className="text-rose-500">*</span>
                  </Label>
                </div>
                <div className="flex gap-1.5">
                  <Input
                    value={formData.en || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const clean = val.trim().toLowerCase();
                      const matched = encounters.find((enc) => enc.en.trim().toLowerCase() === clean);
                      if (matched) {
                        onChange({
                          ...formData,
                          en: val,
                          visit_date: matched.visit_date,
                          visit_time: matched.visit_time || formData.visit_time || '',
                          encounter_type: (matched.encounter_type as 'OPD' | 'IPD' | 'O+I') || formData.encounter_type,
                          doctor_name: matched.doctor_name || formData.doctor_name,
                        });
                      } else {
                        onChange({
                          ...formData,
                          en: val,
                          visit_date: val ? (formData.visit_date || getTodayIso()) : '',
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (formData.en) handleLookup(formData.en);
                      }
                    }}
                    placeholder="ระบุเลขที่ VN / EN เช่น 08-24-110023"
                    className="font-mono text-xs h-8 bg-white dark:bg-slate-900 flex-1"
                    list="encounters-datalist"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSearching || !formData.en}
                    onClick={() => handleLookup(formData.en)}
                    className="h-8 px-2.5 text-xs shrink-0 gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800 transition-colors"
                  >
                    {isSearching ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>ดึงข้อมูล</span>
                  </Button>
                </div>
                {encounters.length > 0 && (
                  <datalist id="encounters-datalist">
                    {encounters.map((enc) => (
                      <option key={enc.en} value={enc.en}>
                        {enc.visit_date} {enc.visit_time ? `(${enc.visit_time})` : ""} - {enc.encounter_type}{" "}
                        {enc.department_name ? `(${enc.department_name})` : ""}
                      </option>
                    ))}
                  </datalist>
                )}
              </div>

              {/* Encounter Date & Time Section (Equal 50/50 Layout with Aligned Baselines) */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Visit Date */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1 h-5">
                    <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate flex items-center gap-1">
                      <span>วันที่รับบริการ</span>
                      <span className="text-rose-500">*</span>
                    </Label>
                    {matchedEncounter ? (
                      <div className="flex items-center gap-1 shrink-0">
                        {isDateLocked ? (
                          <>
                            <Badge
                              variant="secondary"
                              className="text-[9px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 font-medium h-4 py-0 px-1 gap-0.5"
                            >
                              <Lock className="h-2 w-2" />
                              <span>HIS</span>
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsDateUnlocked(true)}
                              className="h-4 px-1 text-[10px] text-slate-500 hover:text-blue-600 gap-0.5 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                              title="คลิกเพื่อปลดล็อคและระบุวันที่/เวลาด้วยตนเอง"
                            >
                              <Unlock className="h-2 w-2" />
                              <span>แก้ไข</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge
                              variant="outline"
                              className="text-[9px] text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 font-medium h-4 py-0 px-1 gap-0.5"
                            >
                              <Unlock className="h-2 w-2" />
                              <span>แก้ไข</span>
                            </Badge>
                            {matchedEncounter.visit_date && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIsDateUnlocked(false);
                                  updateField("visit_date", matchedEncounter.visit_date);
                                  if (matchedEncounter.visit_time) {
                                    updateField("visit_time", matchedEncounter.visit_time);
                                  }
                                }}
                                className="h-4 px-1 text-[10px] text-blue-600 hover:text-blue-800 dark:text-blue-400 gap-0.5 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                title="รีเซ็ตกลับเป็นวันที่และเวลาตามระบบ HIS"
                              >
                                <RotateCcw className="h-2 w-2" />
                                <span>คืนค่า</span>
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        (จำเป็น)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="date"
                      value={formData.visit_date || (matchedEncounter?.visit_date ?? "")}
                      disabled={isDateLocked}
                      onChange={(e) => updateField("visit_date", e.target.value)}
                      max={getTodayIso()}
                      className={cn(
                        "text-xs h-8 bg-white dark:bg-slate-900 font-mono w-full",
                        isDateLocked && "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                      )}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 h-4 flex items-center truncate">
                    {(formData.visit_date || matchedEncounter?.visit_date) ? (
                      <span>
                        พ.ศ.: <span className="font-medium text-slate-700 dark:text-slate-300">
                          {formatThaiDate(formData.visit_date || matchedEncounter?.visit_date || "")}
                        </span>
                      </span>
                    ) : (
                      <span className="opacity-60">วว/ดด/ปปปป</span>
                    )}
                  </p>
                </div>

                {/* 2. Visit Time */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1 h-5">
                    <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 truncate">
                      <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>เวลารับบริการ</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      (ไม่บังคับ)
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="time"
                      step="1"
                      value={formData.visit_time || (matchedEncounter?.visit_time ?? "")}
                      disabled={isDateLocked}
                      onChange={(e) => updateField("visit_time", e.target.value)}
                      className={cn(
                        "text-xs h-8 bg-white dark:bg-slate-900 font-mono w-full",
                        isDateLocked && "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                      )}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 h-4 flex items-center truncate">
                    {(formData.visit_time || matchedEncounter?.visit_time) ? (
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {formData.visit_time || matchedEncounter?.visit_time} น.
                      </span>
                    ) : (
                      <span className="opacity-60">HH:mm:ss</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Document Details Section */}
          <section className="space-y-2 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold text-xs border-b border-slate-200/80 dark:border-slate-800 pb-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>ข้อมูลเอกสารเวชระเบียน</span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    หมวดหมู่เอกสาร <span className="text-rose-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenCategoryDialog}
                    className="text-[10px] text-blue-600 dark:text-blue-400 h-5 px-1.5 py-0 gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                  >
                    <Plus className="h-3 w-3" />
                    เพิ่มหมวดหมู่
                  </Button>
                </div>
                <Combobox
                  items={groupedCategories}
                  value={
                    formData.category_id
                      ? labelById.get(Number(formData.category_id)) || null
                      : null
                  }
                  onValueChange={(val: string | null) => {
                    if (!val) {
                      updateField("category_id", "");
                      return;
                    }
                    const match = categoryByLabel.get(val);
                    if (match) {
                      const shouldUpdateTitle = !formData.title || formData.title.startsWith("scan_");
                      onChange({
                        ...formData,
                        category_id: match.id,
                        title: shouldUpdateTitle ? (match.name_th || match.name_en || formData.title) : formData.title,
                      });
                    } else {
                      updateField("category_id", "");
                    }
                  }}
                >
                  <ComboboxInput
                    placeholder="-- ค้นหาหรือเลือกหมวดหมู่เอกสาร --"
                    showClear
                    className="w-full text-xs h-8 bg-white dark:bg-slate-900"
                  />
                  <ComboboxContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
                    <ComboboxEmpty>ไม่พบหมวดหมู่ที่ค้นหา</ComboboxEmpty>
                    <ComboboxList className="max-h-72">
                      {(group: CategoryGroup, index: number) => (
                        <ComboboxGroup key={group.value} items={group.items}>
                          <ComboboxLabel className="font-semibold text-blue-700 dark:text-blue-400 bg-slate-100/90 dark:bg-slate-800/90 px-2 py-1 text-[11px] border-b border-slate-200/50 dark:border-slate-700/50">
                            {group.value}
                          </ComboboxLabel>
                          <ComboboxCollection>
                            {(item: string) => (
                              <ComboboxItem
                                key={item}
                                value={item}
                                className="text-xs text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                              >
                                {item}
                              </ComboboxItem>
                            )}
                          </ComboboxCollection>
                          {index < groupedCategories.length - 1 && (
                            <ComboboxSeparator />
                          )}
                        </ComboboxGroup>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div>
                <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                  ชื่อเอกสาร <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="เช่น บันทึกการตรวจรักษา OPD"
                  className="text-xs h-8 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                  รหัสแบบฟอร์มเอกสาร (Doc Code)
                </Label>
                <Input
                  value={formData.document_code}
                  onChange={(e) => updateField("document_code", e.target.value)}
                  placeholder="เช่น OPD-MED-01"
                  className="text-xs h-8 font-mono bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </section>

          {/* 4. Doctor Section (Cleaned: Strictly Zero Confidential Level) */}
          <section className="space-y-2 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold text-xs border-b border-slate-200/80 dark:border-slate-800 pb-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>แพทย์ผู้ตรวจรักษา</span>
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                  ชื่อแพทย์ผู้ตรวจรักษา (ถ้ามี)
                </Label>
                <div className="relative">
                  <Input
                    value={formData.doctor_name || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const hasText = val.trim().length > 0;
                      onChange({
                        ...formData,
                        doctor_name: val,
                        is_doctor_document: hasText
                          ? (!formData.doctor_name?.trim() ? true : formData.is_doctor_document)
                          : false,
                      });
                    }}
                    placeholder="ระบุชื่อแพทย์..."
                    className="text-xs h-8 bg-white dark:bg-slate-900 pr-7"
                  />
                  {Boolean(formData.doctor_name) && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange({
                          ...formData,
                          doctor_name: "",
                          is_doctor_document: false,
                        });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="ล้างชื่อแพทย์"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_doctor"
                    checked={formData.is_doctor_document}
                    onCheckedChange={(checked) =>
                      updateField("is_doctor_document", !!checked)
                    }
                  />
                  <Label
                    htmlFor="is_doctor"
                    className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
                  >
                    เป็นเอกสารบันทึกของแพทย์โดยตรง
                  </Label>
                </div>
                <p className="text-[10px] text-muted-foreground pl-6">
                  (เมื่อเลือก ระบบจะติดแท็ก{" "}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    [แพทย์]
                  </span>{" "}
                  ในเวชระเบียน และนำไปจัดหมวดหมู่ Care provider ให้อัตโนมัติ)
                </p>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Dynamic Category Creation Dialog (shadcn/ui Dialog) */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          setIsCategoryDialogOpen(open);
          if (!open) {
            setIsCustomType(false);
            setCatError('');
          }
        }}
      >
        <DialogContent ref={dialogRef} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
              <FolderPlus className="h-4 w-4 text-blue-600" />
              เพิ่มหมวดหมู่เอกสารใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              สร้างหมวดหมู่เอกสารเวชระเบียนแบบไดนามิกเข้าระบบ DMS ทันที
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium mb-1 block">
                ชื่อหมวดหมู่ (ภาษาไทย) <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={newCatNameTh}
                onChange={(e) => setNewCatNameTh(e.target.value)}
                placeholder="เช่น ใบสั่งยาและใบกำกับเวชภัณฑ์"
                className="text-xs h-8"
              />
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">
                ชื่อภาษาอังกฤษ (English Name / ตัวย่อ)
              </Label>
              <Input
                value={newCatNameEn}
                onChange={(e) => setNewCatNameEn(e.target.value)}
                placeholder="เช่น Prescription & Pharmacy Order"
                className="text-xs h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium mb-1 block">
                  รหัสหมวด (Code - ถ้ามี)
                </Label>
                <Input
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value.toUpperCase())}
                  placeholder="เช่น RX_MED"
                  className="text-xs h-8 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-medium">
                    ประเภทหมวดหมู่ <span className="text-rose-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isCustomType;
                      setIsCustomType(next);
                      if (next) {
                        setNewCatType("");
                      } else {
                        setNewCatType(availableCategoryTypes[0] || "");
                      }
                    }}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    {isCustomType ? "← เลือกที่มีอยู่" : "+ พิมพ์ใหม่"}
                  </button>
                </div>

                {isCustomType ? (
                  <Input
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value)}
                    placeholder="พิมพ์ชื่อประเภทใหม่ เช่น Specialty..."
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                    autoFocus
                  />
                ) : (
                  <Combobox
                    items={availableCategoryTypes}
                    value={newCatType || null}
                    onValueChange={(val: string | null) => {
                      setNewCatType(val || "");
                    }}
                  >
                    <ComboboxInput
                      placeholder="เลือกประเภทหมวดหมู่"
                      showClear
                      className="w-full text-xs h-8 bg-white dark:bg-slate-900"
                    />
                    <ComboboxContent
                      container={dialogRef}
                      className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md"
                    >
                      <ComboboxEmpty>
                        <div className="p-2 text-center">
                          <p className="text-xs text-muted-foreground mb-1">
                            ไม่พบประเภทนี้
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-[11px] h-6 px-2 text-blue-600"
                            onClick={() => setIsCustomType(true)}
                          >
                            + พิมพ์ประเภทใหม่เอง
                          </Button>
                        </div>
                      </ComboboxEmpty>
                      <ComboboxList className="max-h-52 overflow-y-auto">
                        {(type: string) => (
                          <ComboboxItem
                            key={type}
                            value={type}
                            className="text-xs text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                          >
                            {type}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )}
              </div>
            </div>

            {catError && (
              <p className="text-xs text-rose-500 font-medium">{catError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCategory}
              disabled={isCreatingCat || !newCatNameTh.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreatingCat ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : null}
              บันทึกหมวดหมู่
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
