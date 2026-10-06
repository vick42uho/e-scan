"use client";

import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  RotateCcw,
  Palette,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ViewerState, ViewerControls } from "@/types/viewer";
import { cn } from "@/lib/utils";

interface ViewerToolbarProps {
  state: ViewerState;
  controls: ViewerControls;
  totalPages: number;
  onPrint?: () => void;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  rightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  onOpenMobileThumbnails?: () => void;
}

export function ViewerToolbar({
  state,
  controls,
  totalPages,
  onPrint,
  leftSidebarOpen = true,
  onToggleLeftSidebar,
  rightSidebarOpen = true,
  onToggleRightSidebar,
  onOpenMobileThumbnails,
}: ViewerToolbarProps) {
  const zoomPercent = Math.round(state.zoom * 100);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-10 sm:h-11 px-2 sm:px-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs select-none overflow-x-auto no-scrollbar gap-1.5">
        {/* Left Side: Sidebar Toggle & Zoom Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Toggle Left Sidebar (Desktop only - mobile uses hamburger in TopNavbar) */}
          {onToggleLeftSidebar && (
            <div className="hidden md:flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={leftSidebarOpen ? "ghost" : "secondary"}
                    size="sm"
                    onClick={onToggleLeftSidebar}
                    className={cn(
                      "h-8 px-2 text-xs gap-1.5 transition-all border",
                      !leftSidebarOpen
                        ? "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                        : "border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    {leftSidebarOpen ? (
                      <PanelLeftClose className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    ) : (
                      <PanelLeftOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span className="hidden xl:inline text-[11px] font-medium">
                      {leftSidebarOpen ? "พับเมนู" : "เปิดเมนู"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {leftSidebarOpen
                    ? "พับเก็บแถบประวัติเวชระเบียน ( [ )"
                    : "เปิดแถบประวัติเวชระเบียน ( [ )"}
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-4 mx-1" />
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.zoomIn}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ซูมเข้า (+)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.zoomOut}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ซูมออก (-)</TooltipContent>
          </Tooltip>

          <span className="w-12 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
            {zoomPercent}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.fitToScreen}
                className="h-8 px-2 text-xs font-medium gap-1"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">พอดีจอ</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>ปรับขนาดพอดีหน้าจอ (0)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.resetZoom}
                className="h-8 px-2 text-xs"
              >
                1:1
              </Button>
            </TooltipTrigger>
            <TooltipContent>ขนาดจริง 100%</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Rotation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.rotateLeft}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>หมุนซ้าย 90°</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={controls.rotateRight}
                className="h-8 w-8 p-0"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>หมุนขวา 90° (R)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Color Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={state.colorMode !== "color" ? "secondary" : "ghost"}
                size="sm"
                onClick={controls.toggleColorMode}
                className="h-8 px-2 text-xs gap-1"
              >
                <Palette className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden md:inline capitalize">{state.colorMode}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>สลับโหมดสี: สี / ขาวดำ / คอนทราสต์สูง / กลับสี</TooltipContent>
          </Tooltip>
        </div>

        {/* Right Side: Page Switcher and Right Panel Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Page Switcher: แสดงตลอดเวลาในมือถือ (เพราะไม่มีแถบขวาข้างจอ) และแสดงใน Desktop เมื่อแถบขวาพับเก็บ */}
          {totalPages > 1 && (
            <div
              className={cn(
                "items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 transition-all shrink-0",
                rightSidebarOpen ? "flex md:hidden" : "flex"
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={controls.prevPage}
                    disabled={state.currentPage <= 1}
                    className="h-7 w-7 p-0"
                    aria-label="หน้าก่อนหน้า"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>หน้าก่อนหน้า (ลูกศรซ้าย)</TooltipContent>
              </Tooltip>

              <Badge
                variant="outline"
                className="px-1.5 sm:px-2 text-xs font-medium text-slate-700 dark:text-slate-300 border-0 h-auto"
              >
                {state.currentPage} / {totalPages}
              </Badge>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => controls.nextPage(totalPages)}
                    disabled={state.currentPage >= totalPages}
                    className="h-7 w-7 p-0"
                    aria-label="หน้าถัดไป"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>หน้าถัดไป (ลูกศรขวา)</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Toggle Right Thumbnail Strip (Desktop) or Open Thumbnail Drawer (Mobile) */}
          {totalPages > 1 && (
            <>
              <Separator orientation="vertical" className="h-4 mx-0.5 sm:mx-1 shrink-0" />

              {/* Desktop Toggle Button */}
              {onToggleRightSidebar && (
                <div className="hidden md:block">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={rightSidebarOpen ? "ghost" : "secondary"}
                        size="sm"
                        onClick={onToggleRightSidebar}
                        className={cn(
                          "h-8 px-2 text-xs gap-1.5 transition-all border shrink-0",
                          !rightSidebarOpen
                            ? "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                            : "border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        {rightSidebarOpen ? (
                          <PanelRightClose className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        ) : (
                          <PanelRightOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                        <span className="hidden xl:inline text-[11px] font-medium">
                          {rightSidebarOpen ? "พับหน้ารวม" : "เปิดหน้ารวม"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {rightSidebarOpen
                        ? "พับเก็บแถบหน้ารวมเอกสาร ( ] )"
                        : "เปิดแถบหน้ารวมเอกสาร ( ] )"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Mobile Thumbnail Sheet Trigger Button */}
              {onOpenMobileThumbnails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenMobileThumbnails}
                  className="md:hidden h-8 px-2 text-xs gap-1 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/70 hover:bg-blue-100 shrink-0"
                >
                  <PanelRightOpen className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium">หน้ารวม ({totalPages})</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
