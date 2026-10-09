"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModeToggleProps {
  className?: string;
}

export function ModeToggle({ className }: ModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={
            className ??
            "h-8 w-8 p-0 text-white hover:bg-blue-800/80 rounded-lg cursor-pointer transition-colors relative"
          }
          aria-label="Toggle theme"
        >
          {mounted ? (
            isDark ? (
              <Moon className="h-4 w-4 text-blue-200 transition-transform duration-200 rotate-0 scale-100" />
            ) : (
              <Sun className="h-4 w-4 text-amber-300 transition-transform duration-200 rotate-0 scale-100" />
            )
          ) : (
            <span className="h-4 w-4 inline-block" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isDark ? "เปลี่ยนเป็นโหมดสว่าง (กด D)" : "เปลี่ยนเป็นโหมดมืด (กด D)"}
      </TooltipContent>
    </Tooltip>
  );
}
