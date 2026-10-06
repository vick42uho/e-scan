import React from "react";
import { FileQuestion, FolderOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface EmptyStateProps {
  icon?: "file" | "folder" | "search";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "file",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  const IconComponent =
    icon === "folder" ? FolderOpen : icon === "search" ? Search : FileQuestion;

  return (
    <Empty className={`p-8 max-w-sm mx-auto border-0 ${className}`}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-2 bg-slate-100 dark:bg-slate-800 text-slate-500">
          <IconComponent className="h-5 w-5" />
        </EmptyMedia>
        <EmptyTitle className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
          {title}
        </EmptyTitle>
        {description && (
          <EmptyDescription className="text-xs text-slate-500 mt-1 max-w-xs">
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>
      {actionLabel && onAction && (
        <EmptyContent>
          <Button
            size="sm"
            variant="outline"
            onClick={onAction}
            className="text-xs h-8"
          >
            {actionLabel}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
