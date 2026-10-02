import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton({ variant = "canvas" }: { variant?: "canvas" | "tree" | "card" }) {
  if (variant === "tree") {
    return (
      <div className="space-y-3 p-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-2 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="p-3 border rounded-lg space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50">
      <div className="w-full max-w-xl aspect-[3/4] bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="w-full flex-1 border border-dashed border-slate-200 dark:border-slate-700 rounded flex items-center justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
