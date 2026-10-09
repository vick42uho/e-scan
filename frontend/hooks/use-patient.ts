"use client";

import { useState, useEffect, useCallback } from "react";
import { Patient } from "@/types/patient";
import { patientApi } from "@/services/patient-api";

export function usePatient(initialHn: string) {
  const [hn, setHn] = useState<string>(initialHn);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(initialHn));
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async (targetHn: string) => {
    if (!targetHn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await patientApi.getPatient(targetHn);
      setPatient(data);
      setHn(targetHn);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลผู้ป่วยได้");
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialHn) {
      fetchPatient(initialHn);
    } else {
      setLoading(false);
    }
  }, [initialHn, fetchPatient]);

  return {
    hn,
    patient,
    loading,
    error,
    changeHn: fetchPatient,
    refetch: () => fetchPatient(hn),
  };
}
