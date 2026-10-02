"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Maximize,
  Minimize,
  Menu,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Patient } from "@/types/patient";

export interface UserPersona {
  id: string;
  name: string;
  role: "doctor" | "nurse" | "staff";
  roleTitle: string;
  department: string;
  doctorCode?: string;
}

interface TopNavbarProps {
  patient: Patient | null;
  userId?: string;
  isSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
}

export function TopNavbar({
  patient,
  userId = "Staff",
  isSidebarOpen = true,
  onToggleMobileSidebar,
}: TopNavbarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <header className="h-14 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white px-3 sm:px-4 flex items-center justify-between shadow-md select-none shrink-0 z-30 border-b border-blue-800/40">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-2.5">
        {onToggleMobileSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMobileSidebar}
            className="md:hidden h-8 w-8 p-0 text-white hover:bg-blue-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center gap-2.5">
          {/* Yanhee Medical Emblem */}
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-xs p-1">
            <div className="h-full w-full rounded flex items-center justify-center text-blue-900 font-extrabold text-sm bg-blue-50">
              YH
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight truncate max-w-[140px] xs:max-w-none">
                Yanhee e-Scan System
              </span>
              <span className="text-[9px] sm:text-[10px] bg-blue-700/80 text-blue-100 px-1.5 py-0.2 rounded font-mono border border-blue-500/40 hidden xs:inline-block">
                v3.1 Secured
              </span>
            </div>
            <div className="text-[10px] text-blue-200/80 hidden sm:block">
              โรงพยาบาลยันฮี • ระบบจัดเก็บและเปิดดูเอกสารเวชระเบียนสแกน
            </div>
          </div>
        </div>
      </div>

      {/* Center: Current Patient Badge (Only visible when sidebar is collapsed to eliminate duplicate info) */}
      {patient && !isSidebarOpen && (
        <div className="hidden sm:flex items-center gap-2 bg-blue-950/70 border border-blue-700/50 px-3 py-1 rounded-full text-xs shadow-inner animate-in fade-in duration-200">
          <span className="text-blue-300 font-medium">ผู้ป่วย:</span>
          <span className="font-semibold text-white">{patient.name_th}</span>
          <span className="font-mono text-cyan-300 bg-blue-900/90 px-1.5 py-0.2 rounded text-[11px] border border-blue-700/40">
            HN: {patient.hn}
          </span>
          {patient.age_display && (
            <span className="text-blue-300/80">({patient.age_display})</span>
          )}
        </div>
      )}

      {/* Right: Hospital System Status & Fullscreen Control */}
      <div className="flex items-center gap-2 text-xs">
        {/* System Status Pill */}
        <div className="hidden xs:flex items-center gap-1.5 bg-blue-950/70 border border-blue-700/50 px-2.5 py-1 rounded-lg text-blue-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium hidden sm:inline">ระบบเชื่อมต่อ EMR/HIS</span>
          <span className="text-[10px] font-mono text-blue-300/70 border-l border-blue-800/80 pl-1.5 ml-0.5">
            ONLINE
          </span>
        </div>

        {/* Fullscreen Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="h-8 w-8 p-0 text-white hover:bg-blue-800/80 rounded-lg cursor-pointer transition-colors"
          title={isFullscreen ? "ออกจากโหมดเต็มหน้าจอ" : "โหมดเต็มหน้าจอ"}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
