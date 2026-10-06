"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  totalFound?: number;
  placeholder?: string;
  className?: string;
}

export function DocumentSearchInput({
  value,
  onChange,
  totalFound,
  placeholder = "ค้นหาชื่อเอกสาร, หมวดหมู่, เลขฟอร์ม...",
  className = "",
}: DocumentSearchInputProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-8 pr-8 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md focus-visible:ring-1 focus-visible:ring-blue-600 shadow-2xs"
        />
        {value && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange("")}
                  className="absolute right-1 h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X className="h-3 w-3 text-slate-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">ล้างข้อความค้นหา</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {value && totalFound !== undefined && (
        <div className="mt-1 flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 px-1 font-medium">
          <span>กรองผลลัพธ์:</span>
          <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1.5 font-mono">
            พบ {totalFound} เอกสาร
          </Badge>
        </div>
      )}
    </div>
  );
}
