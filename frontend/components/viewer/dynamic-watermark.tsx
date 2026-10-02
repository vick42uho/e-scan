"use client";

import React from "react";

interface DynamicWatermarkProps {
  userId?: string;
  userName?: string;
  stampText?: string;
  visible?: boolean;
}

export function DynamicWatermark({
  userId = "Staff",
  userName = "Yanhee Staff",
  stampText = "สำเนาถูกต้อง COPY",
  visible = true,
}: DynamicWatermarkProps) {
  if (!visible) return null;

  const currentDate = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const currentTime = new Date().toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const personaNameMap: Record<string, string> = {
    YH00412: "นพ. สุทธิพงษ์ วิริยะสกุล (แพทย์)",
    YH00355: "นพ. สุรชัย พัฒนากูล (แพทย์)",
    "NURSE-04": "พว. วราภรณ์ แสนดี (พยาบาล)",
    YH1005: "เจ้าหน้าที่เวชระเบียน",
  };
  const displayName = userName || personaNameMap[userId.toUpperCase()] || personaNameMap[userId] || userId;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
      {/* 1. ตราประทับกรอบสี่เหลี่ยมด้านล่างขวา เหมือนตราประทับโรงพยาบาลจริง */}
      <div className="absolute bottom-6 right-6 border-2 border-blue-900/60 bg-blue-50/30 backdrop-blur-[1px] rounded px-3 py-1.5 text-center shadow-xs">
        <div className="text-blue-900/85 font-bold text-xs tracking-wider">
          {stampText}
        </div>
        <div className="text-blue-800/80 text-[10px] mt-0.5 font-medium">
          โรงพยาบาลยันฮี (Yanhee Hospital)
        </div>
        <div className="text-blue-700/80 text-[9px] mt-0.5">
          ผู้เปิดดู: {displayName} [{userId}]
        </div>
        <div className="text-blue-600/70 text-[8px] font-mono">
          {currentDate} {currentTime}
        </div>
      </div>

      {/* 2. ลายน้ำซ้ำเอียงทแยงมุม ป้องกันการแคปภาพหน้าจอไปใช้ในทางที่ผิด */}
      <div className="absolute inset-0 flex flex-col justify-around opacity-15 rotate-[-25deg] scale-125">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex justify-around text-slate-800 dark:text-slate-200 font-mono font-bold text-sm tracking-widest uppercase whitespace-nowrap"
          >
            <span>YANHEE E-SCAN • {userId} • {currentDate}</span>
            <span>FOR MEDICAL RECORD USE ONLY • {stampText}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
