'use client';

import React from 'react';
import Link from 'next/link';
import { ScanLine, Wifi, WifiOff, ArrowLeft, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ScannerDevice } from '@/types/scan';

interface ScanTopBarProps {
  bridgeStatus: 'unknown' | 'connected' | 'disconnected';
  devices: ScannerDevice[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
}

export function ScanTopBar({ bridgeStatus, devices, selectedDeviceId, onSelectDevice }: ScanTopBarProps) {
  // Ensure all devices have unique display names without confusing duplicates
  const uniqueDevices = React.useMemo(() => {
    const seen = new Set<string>();
    const result: ScannerDevice[] = [];
    for (const d of devices) {
      if (!seen.has(d.name)) {
        seen.add(d.name);
        result.push(d);
      }
    }
    return result;
  }, [devices]);

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-14 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white px-3 sm:px-4 flex items-center justify-between shadow-md select-none shrink-0 z-30 border-b border-blue-800/40">
        {/* Left: Hospital Brand & Module Title */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-xs p-1 shrink-0">
            <div className="h-full w-full rounded flex items-center justify-center text-blue-900 font-extrabold text-sm bg-blue-50">
              YH
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                Yanhee e-Scan v3.1
              </span>
              <Badge
                variant="outline"
                className="bg-blue-800/80 text-cyan-200 border-blue-600/50 text-[10px] px-1.5 py-0 h-4 hidden sm:inline-flex"
              >
                สแกนเอกสาร
              </Badge>
            </div>
            <div className="text-[10px] text-blue-200/80 hidden md:block">
              โรงพยาบาลยันฮี • ระบบนำเข้าและสแกนเวชระเบียนผู้ป่วย
            </div>
          </div>
        </div>

        {/* Center: Scanner Device Selector & Hardware Bridge Status */}
        <div className="flex items-center gap-2">
          {bridgeStatus === 'connected' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Wifi className="h-4 w-4 text-emerald-400 shrink-0" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Scanner Bridge เชื่อมต่อพร้อมทำงาน</TooltipContent>
            </Tooltip>
          ) : bridgeStatus === 'disconnected' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <WifiOff className="h-4 w-4 text-rose-400 shrink-0" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Scanner Bridge ไม่ได้ทำงาน (กรุณาเปิด e-Scan Bridge Client)</TooltipContent>
            </Tooltip>
          ) : (
            <div className="h-3.5 w-3.5 rounded-full bg-slate-400/60 animate-pulse shrink-0" />
          )}

          {bridgeStatus === 'connected' && uniqueDevices.length > 0 ? (
            <div className="flex items-center gap-1.5 bg-blue-900/60 border border-blue-700/60 rounded-md px-2 py-0.5 text-xs">
              <MonitorSmartphone className="h-3.5 w-3.5 text-blue-300 shrink-0 hidden sm:inline" />
              <Combobox
                items={uniqueDevices.map((d) => d.name)}
                value={uniqueDevices.find((d) => d.id === selectedDeviceId)?.name || null}
                onValueChange={(val: string | null) => {
                  const match = uniqueDevices.find((d) => d.name === val);
                  if (match) onSelectDevice(match.id);
                }}
              >
                <ComboboxInput
                  placeholder="เลือกเครื่องสแกน"
                  className="border-0 bg-transparent text-white shadow-none min-w-[150px] sm:min-w-[210px] max-w-[260px] text-xs h-7 py-0 focus:ring-0 [&_input]:text-white [&_input]:placeholder:text-blue-200/60 truncate"
                />
                <ComboboxContent className="z-50 bg-slate-900 text-slate-100 border border-slate-700 shadow-xl">
                  <ComboboxEmpty>ไม่พบเครื่องสแกน</ComboboxEmpty>
                  <ComboboxList>
                    {(name: string) => {
                      const dev = uniqueDevices.find((d) => d.name === name);
                      return (
                        <ComboboxItem 
                          key={dev?.id || name} 
                          value={name} 
                          className="text-xs text-slate-100 hover:bg-blue-600 hover:text-white data-highlighted:bg-blue-600 data-highlighted:text-white cursor-pointer px-2.5 py-1.5 transition-colors"
                        >
                          {name}
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Badge
                variant="secondary"
                className="text-[10px] font-mono shrink-0 bg-blue-800 text-cyan-200 border-0 hidden md:inline-flex h-4 px-1"
              >
                {uniqueDevices.length} เครื่อง
              </Badge>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-[11px] font-medium text-blue-200 bg-blue-900/40 border-blue-700/40 py-0.5"
            >
              {bridgeStatus === 'connected'
                ? 'ไม่พบเครื่องสแกน'
                : bridgeStatus === 'disconnected'
                ? 'Bridge ออฟไลน์'
                : 'กำลังตรวจสอบ...'}
            </Badge>
          )}
        </div>

        {/* Right: Back to Viewer */}
        <div>
          <Link href="/view" passHref>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-white hover:bg-blue-800 hover:text-white h-8 px-2 sm:px-3 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">กลับเวชระเบียน</span>
            </Button>
          </Link>
        </div>
      </header>
    </TooltipProvider>
  );
}
