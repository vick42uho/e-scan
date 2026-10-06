import type { Metadata } from "next";
import { Geist_Mono, DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const fontSarabun = localFont({
  src: [
    {
      path: "./fonts/SarabunPSK/THSarabun.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/SarabunPSK/THSarabun-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/SarabunPSK/THSarabun-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/SarabunPSK/THSarabun-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yanhee e-Scan System v3.1 (Secured) | โรงพยาบาลยันฮี",
  description: "ระบบจัดเก็บและเปิดดูเอกสารเวชระเบียนสแกน โรงพยาบาลยันฮี (DMS)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        fontSarabun.variable,
        fontMono.variable,
        dmSans.variable
      )}
    >
      <body
        suppressHydrationWarning
        className="bg-slate-100 dark:bg-slate-950 min-h-screen font-sans"
      >
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
