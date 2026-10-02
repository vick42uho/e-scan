import { fetchApi } from "./api-client";
import { Patient, PatientSearchResult } from "@/types/patient";

export const patientApi = {
  getPatient: (hn: string) => {
    return fetchApi<Patient>(`/patients/${encodeURIComponent(hn)}`);
  },

  searchPatients: (query: string) => {
    return fetchApi<PatientSearchResult[]>(
      `/patients/search?q=${encodeURIComponent(query)}`
    );
  },
};
