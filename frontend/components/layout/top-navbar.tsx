"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  User,
  Maximize,
  Minimize,
  Menu,
  Stethoscope,
  UserCheck,
  ChevronDown,
  Check,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Patient } from "@/types/patient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface UserPersona {
  id: string;
  name: string;
  role: "doctor" | "nurse" | "staff";
  roleTitle: string;
  department: string;
  doctorCode?: string;
}

export const DEMO_PERSONAS: UserPersona[] = [
  {
    id: "YH00412",
    name: "นพ. สุทธิพงษ์ วิริยะสกุล",
    role: "doctor",
    roleTitle: "แพทย์ผู้ตรวจ",
    department: "อายุรกรรมทั่วไป (OPD)",
    doctorCode: "YH00412",
  },
  {
    id: "YH00355",
    name: "นพ. สุรชัย พัฒนากูล",
    role: "doctor",
    roleTitle: "ศัลยแพทย์",
    department: "ศัลยกรรม (Surgery Unit)",
    doctorCode: "YH00355",
  },
  {
    id: "NURSE-04",
    name: "พว. วราภรณ์ แสนดี",
    role: "nurse",
    roleTitle: "พยาบาลวิชาชีพ",
    department: "จุดคัดกรอง & OPD พยาบาล",
  },
  {
    id: "YH1005",
    name: "Yanhee Staff (จนท.เวชระเบียน)",
    role: "staff",
    roleTitle: "เจ้าหน้าที่เวชระเบียน",
    department: "ศูนย์สแกนและเวชระเบียน",
  },
];

interface TopNavbarProps {
  patient: Patient | null;
  userId: string;
  onSelectPersona?: (persona: UserPersona) => void;
  onToggleMobileSidebar?: () => void;
}

export function TopNavbar({
  patient,
  userId,
  onSelectPersona,
  onToggleMobileSidebar,
}: TopNavbarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Identify active persona from userId
  const currentPersona =
    DEMO_PERSONAS.find((p) => p.id.toLowerCase() === userId.toLowerCase()) || {
      id: userId,
      name: userId === "YH00412" ? "นพ. สุทธิพงษ์ วิริยะสกุล" : `ผู้ใช้งาน (${userId})`,
      role: userId.startsWith("YH00") ? "doctor" : "staff",
      roleTitle: userId.startsWith("YH00") ? "แพทย์" : "เจ้าหน้าที่",
      department: "โรงพยาบาลยันฮี",
    };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "doctor":
        return <Stethoscope className="h-3.5 w-3.5 text-emerald-400" />;
      case "nurse":
        return <UserCheck className="h-3.5 w-3.5 text-violet-300" />;
      default:
        return <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "doctor":
        return "bg-emerald-950/80 text-emerald-200 border-emerald-500/40";
      case "nurse":
        return "bg-violet-950/80 text-violet-200 border-violet-500/40";
      default:
        return "bg-amber-950/80 text-amber-200 border-amber-500/40";
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

        <div className="flex items-center gap-2">
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

      {/* Center: Current Patient Badge (Compact) */}
      {patient && (
        <div className="hidden lg:flex items-center gap-2 bg-blue-950/70 border border-blue-700/50 px-3 py-1 rounded-full text-xs shadow-inner">
          <span className="text-blue-300 font-medium">ผู้ป่วย:</span>
          <span className="font-semibold text-white">{patient.name_th}</span>
          <span className="font-mono text-cyan-300 bg-blue-900/90 px-1.5 py-0.2 rounded text-[11px] border border-blue-700/40">
            HN: {patient.hn}
          </span>
          <span className="text-blue-300/80">({patient.age_display || "-"})</span>
        </div>
      )}

      {/* Right: User Persona Switcher & Controls */}
      <div className="flex items-center gap-2 text-xs">
        {/* User Persona Switcher Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-700/50 hover:border-blue-500/70 px-2.5 py-1.5 rounded-lg text-blue-100 transition-all cursor-pointer shadow-xs"
              title="คลิกเพื่อสลับ User ตัวอย่าง (แพทย์ / พยาบาล / เจ้าหน้าที่)"
            >
              <div className="flex items-center gap-1.5">
                {getRoleIcon(currentPersona.role)}
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white truncate max-w-[130px]">
                      {currentPersona.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.2 py-0.2 rounded border font-mono ${getRoleBadgeStyle(
                        currentPersona.role
                      )}`}
                    >
                      {currentPersona.roleTitle}
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-300/80 font-mono block">
                    ID: {currentPersona.id}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-blue-300 shrink-0 ml-0.5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-1.5 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl"
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
              <span>เลือก User ตัวอย่างทดสอบ (Personas)</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

            {DEMO_PERSONAS.map((persona) => {
              const isSelected =
                persona.id.toLowerCase() === currentPersona.id.toLowerCase();
              return (
                <DropdownMenuItem
                  key={persona.id}
                  onClick={() => onSelectPersona?.(persona)}
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-medium"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getRoleIcon(persona.role)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs truncate">
                        {persona.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          persona.role === "doctor"
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300/60"
                            : persona.role === "nurse"
                            ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-300/60"
                            : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300/60"
                        }`}
                      >
                        {persona.roleTitle}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {persona.department}
                    </div>
                    <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                      User ID: {persona.id}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Fullscreen Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="h-8 w-8 p-0 text-white hover:bg-blue-800/80 rounded-lg"
          title={isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
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
