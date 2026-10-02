import React from "react";
import { FileQuestion, FolderOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: "file" | "folder" | "search";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "file",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const IconComponent =
    icon === "folder" ? FolderOpen : icon === "search" ? Search : FileQuestion;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
        <IconComponent className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAction}
          className="mt-4 text-xs h-8"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
