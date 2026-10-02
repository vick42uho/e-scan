"use client";

import { useState, useCallback } from "react";
import { ViewerState, ViewerControls, ColorMode } from "@/types/viewer";

export function useViewerControls(initialPage: number = 1): {
  state: ViewerState;
  controls: ViewerControls;
} {
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [fitMode, setFitMode] = useState<"fit" | "actual" | "width" | "custom">("fit");
  const [colorMode, setColorMode] = useState<ColorMode>("color");
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showWatermark, setShowWatermark] = useState<boolean>(false);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.2, 4.0));
    setFitMode("custom");
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.2, 0.3));
    setFitMode("custom");
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
    setPosition({ x: 0, y: 0 });
    setFitMode("actual");
  }, []);

  const fitToScreen = useCallback(() => {
    setZoom(1.0);
    setPosition({ x: 0, y: 0 });
    setFitMode("fit");
  }, []);

  const rotateLeft = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  const rotateRight = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => {
      if (prev === "color") return "grayscale";
      if (prev === "grayscale") return "high-contrast";
      if (prev === "high-contrast") return "inverted";
      return "color";
    });
  }, []);

  const toggleWatermark = useCallback(() => {
    setShowWatermark((prev) => !prev);
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    setPosition({ x: 0, y: 0 });
  }, []);

  const nextPage = useCallback((total: number) => {
    setCurrentPage((prev) => Math.min(prev + 1, total));
    setPosition({ x: 0, y: 0 });
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    setPosition({ x: 0, y: 0 });
  }, []);

  const setPan = useCallback((x: number, y: number) => {
    setPosition({ x, y });
  }, []);

  return {
    state: {
      zoom,
      rotation,
      fitMode,
      colorMode,
      currentPage,
      position,
      showWatermark,
    },
    controls: {
      zoomIn,
      zoomOut,
      resetZoom,
      fitToScreen,
      rotateLeft,
      rotateRight,
      toggleColorMode,
      toggleWatermark,
      setPage,
      nextPage,
      prevPage,
      setPan,
    },
  };
}
