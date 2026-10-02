"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { DocumentItem } from "@/types/document";
import { ViewerState, ViewerControls } from "@/types/viewer";
import { documentApi } from "@/services/document-api";
import { DynamicWatermark } from "./dynamic-watermark";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { Loader2, AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerCanvasProps {
  document: DocumentItem | null;
  state: ViewerState;
  controls: ViewerControls;
  userId: string;
  loading?: boolean;
}

export function DocumentViewerCanvas({
  document,
  state,
  controls,
  userId,
  loading = false,
}: DocumentViewerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgLoading, setImgLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Active page object
  const activePage =
    document?.pages.find((p) => p.page_number === state.currentPage) ||
    document?.pages[0];

  const rawFileUrl = activePage
    ? documentApi.getFileUrl(
        activePage.document_id,
        activePage.page_number,
        false, // render watermark overlay on UI for crispness
        userId
      )
    : "";

  const fileUrl = retryKey > 0 ? `${rawFileUrl}&retry=${retryKey}` : rawFileUrl;

  useEffect(() => {
    if (fileUrl) {
      setHasError(false);
      setImgLoading(true);

      // Check if image is already cached and loaded
      if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
        setImgLoading(false);
      }
    }
  }, [fileUrl]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      controls.zoomIn();
    } else {
      controls.zoomOut();
    }
  };

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({
      x: e.clientX - state.position.x,
      y: e.clientY - state.position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      controls.setPan(e.clientX - dragStart.x, e.clientY - dragStart.y);
    },
    [isDragging, dragStart, controls]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile / Tablet (Pan + Swipe Page Switch + Double-tap Zoom)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - state.position.x,
        y: touch.clientY - state.position.y,
      });

      // Double tap detection
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        handleDoubleClick();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    controls.setPan(touch.clientX - dragStart.x, touch.clientY - dragStart.y);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);

    // Swipe page switch detection when zoom is close to 1x
    if (touchStartRef.current && e.changedTouches.length === 1 && state.zoom <= 1.2) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;

      // Quick horizontal swipe: dx > 50px, dy < 45px, dt < 350ms
      if (dt < 350 && Math.abs(dx) > 50 && Math.abs(dy) < 45) {
        if (dx < 0 && document?.total_pages) {
          // Swipe left -> Next page
          controls.nextPage(document.total_pages);
        } else if (dx > 0) {
          // Swipe right -> Previous page
          controls.prevPage();
        }
      }
    }
    touchStartRef.current = null;
  };

  // Double click toggles between fit & 100%
  const handleDoubleClick = () => {
    if (state.zoom === 1.0) {
      controls.zoomIn();
    } else {
      controls.resetZoom();
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="canvas" />;
  }

  if (!document || !activePage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <EmptyState
          icon="file"
          title="ยังไม่ได้เลือกเอกสาร"
          description="กรุณาเลือกเอกสารที่ต้องการดูจากเมนูประวัติการรักษาทางด้านซ้าย"
        />
      </div>
    );
  }

  // Filter styles based on colorMode
  const getFilterStyle = () => {
    switch (state.colorMode) {
      case "grayscale":
        return "grayscale(100%)";
      case "high-contrast":
        return "grayscale(100%) contrast(180%) brightness(105%)";
      case "inverted":
        return "invert(100%) contrast(120%)";
      default:
        return "none";
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      style={{ touchAction: "none" }}
      className={`relative w-full h-full overflow-hidden bg-slate-200/80 dark:bg-slate-950 flex items-center justify-center select-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Loading Spinner Indicator */}
      {imgLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-white/90 dark:bg-slate-900/90 px-4 py-3 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              กำลังโหลดเอกสาร...
            </span>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-100/90 dark:bg-slate-950/90 p-4 text-center">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-rose-200 dark:border-rose-900/50 max-w-sm flex flex-col items-center">
            <AlertCircle className="h-10 w-10 text-rose-500 mb-2.5" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              ไม่สามารถแสดงผลเอกสารหน้านี้ได้
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              เกิดข้อผิดพลาดในการโหลดรูปภาพ หรือการเชื่อมต่อเครือข่าย
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setHasError(false);
                setImgLoading(true);
                setRetryKey((k) => k + 1);
              }}
              className="text-xs gap-1.5"
            >
              <RotateCw className="h-3.5 w-3.5" />
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        </div>
      )}

      {/* Render Canvas Container with Transformation */}
      <div
        style={{
          transform: `translate(${state.position.x}px, ${state.position.y}px) scale(${state.zoom}) rotate(${state.rotation}deg)`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.12s ease-out",
        }}
        className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded"
      >
        {/* Scanned Document Image with unique key per page for clean load */}
        <img
          key={fileUrl}
          ref={imageRef}
          src={fileUrl}
          alt={document.title}
          onLoad={() => {
            setImgLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setImgLoading(false);
            setHasError(true);
          }}
          style={{ filter: getFilterStyle() }}
          className="max-w-[96vw] md:max-w-[85vw] max-h-[82vh] md:max-h-[78vh] object-contain rounded bg-white shadow-xl pointer-events-none select-none"
          draggable={false}
        />

        {/* Dynamic Watermark Layer */}
        <DynamicWatermark
          userId={userId}
          visible={state.showWatermark}
          stampText="สำเนาถูกต้อง COPY"
        />
      </div>
    </div>
  );
}
