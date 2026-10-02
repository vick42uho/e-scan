from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

class EncounterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    en: str
    hn: str
    visit_date: date
    visit_time: Optional[str] = None
    department_code: Optional[str] = None
    department_name: Optional[str] = None
    doctor_code: Optional[str] = None
    doctor_name: Optional[str] = None
    encounter_type: Optional[str] = "OPD"
    status: Optional[str] = "Completed"


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hn: str
    name_th: str
    name_en: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    age_display: Optional[str] = None
    id_card: Optional[str] = None
    allergies: Optional[str] = None
    rights: Optional[str] = None
    photo_url: Optional[str] = None
    encounters: List[EncounterResponse] = []


class PatientSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hn: str
    name_th: str
    name_en: Optional[str] = None
    gender: Optional[str] = None
    age_display: Optional[str] = None
    last_visit: Optional[date] = None
    document_count: int = 0
