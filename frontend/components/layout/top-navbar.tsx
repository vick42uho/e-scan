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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModeToggle } from "@/components/mode-toggle";
import { YanheeLogo } from "@/components/common/yanhee-logo";
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
    <TooltipProvider delayDuration={300}>
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
            <YanheeLogo size="md" />

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                  Yanhee e-Scan v3.1
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
            <Badge
              variant="secondary"
              className="text-cyan-300 bg-blue-900/90 border-blue-700/40 text-[11px] h-4 py-0"
            >
              HN: {patient.hn}
            </Badge>
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
            <Badge
              variant="secondary"
              className="text-[10px] text-blue-300/80 bg-blue-900/60 border-0 h-4 px-1"
            >
              ONLINE
            </Badge>
          </div>

          {/* Fullscreen Button with Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0 text-white hover:bg-blue-800/80 rounded-lg cursor-pointer transition-colors"
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isFullscreen ? "ออกจากโหมดเต็มหน้าจอ" : "โหมดเต็มหน้าจอ"}
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle Button (1-Click Toggle: Dark <-> Light) */}
          <ModeToggle />
        </div>
      </header>
    </TooltipProvider>
  );
}
