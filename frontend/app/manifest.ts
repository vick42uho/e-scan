import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yanhee e-Scan DMS (Secured)",
    short_name: "Yanhee e-Scan",
    description: "ระบบจัดเก็บและเปิดดูเอกสารเวชระเบียนสแกน โรงพยาบาลยันฮี (DMS)",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#1E3A8A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
