"use client";

import React, { useState } from "react";
import { DocumentPage } from "@/types/document";
import { cn } from "@/lib/utils";
import { FileText, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ThumbnailStripProps {
  pages: DocumentPage[];
  currentPage: number;
  onSelectPage: (pageNumber: number) => void;
  className?: string;
}

function ThumbnailCard({
  page,
  isActive,
  onSelect,
}: {
  page: DocumentPage;
  isActive: boolean;
  onSelect: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fallback or full URL
  const thumbUrl = page.thumbnail_url || `/api/v1/documents/${page.document_id}/pages/${page.page_number}/thumbnail`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full max-w-full box-border text-left rounded-xl transition-all p-2 flex flex-col items-center group relative border focus:outline-hidden cursor-pointer",
        isActive
          ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 ring-1 ring-blue-500/50 shadow-md"
          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-400 hover:shadow-xs"
      )}
    >
      {/* Thumbnail Aspect Card (A4 Aspect Ratio ~ 1 : 1.414) */}
      <div className="relative w-full aspect-[1/1.4] bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
        {/* Placeholder / Loading Skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 animate-pulse text-slate-400">
            <FileText className="h-6 w-6 stroke-1 mb-1" />
            <span className="text-[10px]">กำลังโหลด...</span>
          </div>
        )}

        {/* Fallback Graphic if Image Load Fails */}
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/90 p-2 text-center text-slate-400">
            <FileText className="h-7 w-7 text-blue-500/70 mb-1" />
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
              หน้า {page.page_number}
            </span>
            <span className="text-[9px] text-slate-400 truncate max-w-[80px]">
              {page.file_name}
            </span>
          </div>
        ) : (
          <img
            src={thumbUrl}
            alt={page.page_label || `Page ${page.page_number}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(true);
              setImageError(true);
            }}
            className={cn(
              "w-full h-full object-contain transition-opacity duration-200",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
          />
        )}

        {/* Page Badge In Top-Left */}
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={cn(
            "absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0 h-4 rounded shadow-sm border-0",
            isActive
              ? "bg-blue-600 text-white ring-1 ring-white/50"
              : "bg-slate-900/75 text-white backdrop-blur-[2px]"
          )}
        >
          {page.page_number}
        </Badge>
      </div>

      {/* Page Title / Subtext */}
      <div className="w-full mt-2 text-center px-0.5">
        <span
          className={cn(
            "text-[11px] block truncate transition-colors leading-tight",
            isActive
              ? "text-blue-700 dark:text-blue-400 font-bold"
              : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 font-medium"
          )}
          title={page.page_label || `Page ${page.page_number}`}
        >
          {page.page_label || `หน้า ${page.page_number}`}
        </span>
      </div>
    </button>
  );
}

export function ThumbnailStrip({
  pages,
  currentPage,
  onSelectPage,
  className = "",
}: ThumbnailStripProps) {
  if (!pages || pages.length <= 1) return null;

  return (
    <aside
      className={cn(
        "w-full bg-slate-50/95 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full select-none overflow-hidden shadow-xs",
        className
      )}
    >
      {/* Header */}
      <div className="h-10 px-3 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between bg-slate-100/60 dark:bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
          <span>หน้ารวม</span>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0 h-4 border-0 font-bold"
        >
          {pages.length} หน้า
        </Badge>
      </div>

      {/* Scrollable Thumbnails List (Bounded Flex Container) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-2.5 pr-3.5 space-y-2.5 w-full box-border">
            {pages.map((p) => (
              <ThumbnailCard
                key={`${p.document_id}-${p.page_number}`}
                page={p}
                isActive={p.page_number === currentPage}
                onSelect={() => onSelectPage(p.page_number)}
              />
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </aside>
  );
}
