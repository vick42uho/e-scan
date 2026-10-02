"use client";

import { useEffect } from "react";
import { ViewerControls } from "@/types/viewer";

export function useKeyboardShortcuts(
  controls: ViewerControls,
  totalPages: number = 1,
  onPrint?: () => void,
  onToggleLeftSidebar?: () => void,
  onToggleRightSidebar?: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        if (onPrint) {
          e.preventDefault();
          onPrint();
        }
        return;
      }

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          controls.zoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          controls.zoomOut();
          break;
        case "0":
          e.preventDefault();
          controls.fitToScreen();
          break;
        case "r":
        case "R":
          e.preventDefault();
          controls.rotateRight();
          break;
        case "ArrowLeft":
          e.preventDefault();
          controls.prevPage();
          break;
        case "ArrowRight":
          e.preventDefault();
          controls.nextPage(totalPages);
          break;
        case "[":
          if (onToggleLeftSidebar) {
            e.preventDefault();
            onToggleLeftSidebar();
          }
          break;
        case "]":
          if (onToggleRightSidebar) {
            e.preventDefault();
            onToggleRightSidebar();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controls, totalPages, onPrint, onToggleLeftSidebar, onToggleRightSidebar]);
}
