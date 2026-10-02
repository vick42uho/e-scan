from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.patient import Patient, Encounter
from app.schemas.patient import PatientResponse, PatientSearchResult, EncounterResponse

class PatientService:
    @staticmethod
    def get_by_hn(db: Session, hn: str) -> Optional[PatientResponse]:
        """ค้นหาข้อมูลผู้ป่วยตาม HN พร้อมประวัติการเข้ารับบริการ (Visits)"""
        patient = db.query(Patient).filter(Patient.hn == hn).first()
        if not patient:
            return None
        
        # จัดเรียง encounters ตามวันที่ล่าสุดก่อน
        encounters = (
            db.query(Encounter)
            .filter(Encounter.hn == hn)
            .order_by(Encounter.visit_date.desc())
            .all()
        )
        
        return PatientResponse(
            hn=patient.hn,
            name_th=patient.name_th,
            name_en=patient.name_en,
            dob=patient.dob,
            gender=patient.gender,
            age_display=patient.age_display,
            id_card=patient.id_card,
            allergies=patient.allergies,
            rights=patient.rights,
            photo_url=patient.photo_url,
            encounters=[EncounterResponse.model_validate(e) for e in encounters]
        )

    @staticmethod
    def search_patients(db: Session, query: str, limit: int = 15) -> List[PatientSearchResult]:
        """ค้นหาผู้ป่วยด้วย HN, ชื่อภาษาไทย หรือชื่อภาษาอังกฤษ"""
        search_pattern = f"%{query.strip()}%"
        patients = (
            db.query(Patient)
            .filter(
                or_(
                    Patient.hn.ilike(search_pattern),
                    Patient.name_th.ilike(search_pattern),
                    Patient.name_en.ilike(search_pattern)
                )
            )
            .limit(limit)
            .all()
        )

        results = []
        for p in patients:
            last_enc = (
                db.query(Encounter.visit_date)
                .filter(Encounter.hn == p.hn)
                .order_by(Encounter.visit_date.desc())
                .first()
            )
            doc_count = len(p.documents) if p.documents else 0
            results.append(
                PatientSearchResult(
                    hn=p.hn,
                    name_th=p.name_th,
                    name_en=p.name_en,
                    gender=p.gender,
                    age_display=p.age_display,
                    last_visit=last_enc[0] if last_enc else None,
                    document_count=doc_count
                )
            )
        return results

patient_service = PatientService()
