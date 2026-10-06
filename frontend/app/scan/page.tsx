import React, { Suspense } from 'react';
import ScanWorkspace from '@/components/scan/scan-workspace';
import { Loader2 } from 'lucide-react';

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="text-sm font-medium">กำลังเตรียมระบบสแกน...</span>
      </div>
    }>
      <ScanWorkspace />
    </Suspense>
  );
}
