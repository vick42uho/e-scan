"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { patientApi } from "@/services/patient-api";
import { PatientSearchResult } from "@/types/patient";

interface SearchInputProps {
  placeholder?: string;
  onSelectPatient: (hn: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = "ค้นหา HN หรือ ชื่อผู้ป่วย...",
  onSelectPatient,
  className = "",
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await patientApi.searchPatients(query);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (hn: string) => {
    onSelectPatient(hn);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-8 pr-8 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md focus-visible:ring-1 focus-visible:ring-blue-600"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setQuery("")}
            className="absolute right-1 h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
          >
            <X className="h-3 w-3 text-slate-400" />
          </Button>
        )}
        {loading && (
          <Loader2 className="absolute right-2.5 h-3.5 w-3.5 text-blue-600 animate-spin" />
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden text-xs">
          <div className="p-1.5 font-medium text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            ผลการค้นหา ({results.length})
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {results.map((patient) => (
              <button
                key={patient.hn}
                onClick={() => handleSelect(patient.hn)}
                className="w-full text-left p-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600">
                      {patient.name_th}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      HN: <span className="font-mono">{patient.hn}</span> • {patient.gender || "-"} • {patient.age_display || "-"}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">
                  {patient.document_count} เอกสาร
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
