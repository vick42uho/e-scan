export type FitMode = "fit" | "actual" | "width" | "custom";
export type ColorMode = "color" | "grayscale" | "high-contrast" | "inverted";

export interface ViewerState {
  zoom: number; // 0.2 to 4.0 (1.0 = 100%)
  rotation: number; // 0, 90, 180, 270
  fitMode: FitMode;
  colorMode: ColorMode;
  currentPage: number;
  position: { x: number; y: number };
  showWatermark: boolean;
}

export interface ViewerControls {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  toggleColorMode: () => void;
  toggleWatermark: () => void;
  setPage: (page: number) => void;
  nextPage: (total: number) => void;
  prevPage: () => void;
  setPan: (x: number, y: number) => void;
}
