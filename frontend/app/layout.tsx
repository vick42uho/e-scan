import type { Metadata } from "next";
import { Geist_Mono, DM_Sans, Sarabun } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const fontSarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
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
