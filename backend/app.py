"""CampusCare AI API. RAG and Gmail delivery are deliberately separate future integrations."""
import datetime as dt
import os
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import Base, engine, get_db
from models import AuthorityMapping, EmailLog, LetterDraft, StudentComplaint, StudentProfile
from schemas import ComplaintCreate, ComplaintOut, ComplaintUpdate, LetterDraftEdit, LetterOut, PaginatedComplaints, StudentComplaintClassificationRequest
from security import Identity, current_identity
from services import AIServiceError, classify, generate_letter, letter

Base.metadata.create_all(bind=engine)
app = FastAPI(title="CampusCare AI", version="2.0.0")
origins = [x.strip() for x in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PATCH"], allow_headers=["Authorization", "Content-Type"])

def profile(identity: Identity, db: Session):
    p = db.query(StudentProfile).filter_by(auth_user_id=identity.user_id).first()
    if not p:
        p = StudentProfile(auth_user_id=identity.user_id, institutional_email=identity.email, full_name=identity.name); db.add(p); db.commit(); db.refresh(p)
    return p
def owned(cid, identity, db):
    c = db.query(StudentComplaint).join(StudentProfile).filter(StudentComplaint.id == cid, StudentProfile.auth_user_id == identity.user_id).first()
    if not c: raise HTTPException(404, "Complaint not found")
    return c
def output(c):
    draft = max(c.drafts, key=lambda x: x.version) if c.drafts else None
    return ComplaintOut.model_validate({**{k: getattr(c, k) for k in ("id","title","description","category","subcategory","urgency","classification_reason","needs_clarification","clarification_question","status","created_at","updated_at")}, "current_draft": LetterOut.model_validate(draft) if draft else None})
def classify_record(c, request):
    result = classify(c.description, request.clarification, request.category_hint)
    c.category, c.subcategory, c.urgency = result.category, result.subcategory, result.urgency
    c.classification_reason, c.needs_clarification, c.clarification_question = result.classification_reason, result.needs_clarification, result.clarification_question
    c.status = "Draft" if result.needs_clarification else "Processing"
    return result
def draft_record(c, p, db):
    if c.needs_clarification or not c.category or not c.urgency: raise HTTPException(409, "Classification must be completed before generating a draft")
    authority = db.query(AuthorityMapping).filter_by(category=c.category, is_active=True).first()
    if not authority: raise HTTPException(409, "No active authority mapping exists for this category. Ask an administrator to configure one.")
    data = letter(c.description, c.category, c.subcategory, c.urgency, p.full_name, authority.authority_name, authority.official_email)
    version = max((d.version for d in c.drafts), default=0) + 1
    d = LetterDraft(complaint_id=c.id, version=version, **data); db.add(d); c.status = "Awaiting Approval"; return d

@app.get("/health")
@app.get("/api/health")
def health(): return {"status": "ok", "service": "campuscare-api"}

@app.post("/api/student-complaints/classify")
def compatibility_classify(req: StudentComplaintClassificationRequest):
    """Compatibility endpoint; persistent workflow uses POST /api/complaints."""
    try:
        data = classify(req.description, req.clarification, req.category_hint)
        return {**data.model_dump(), "requires_clarification": data.needs_clarification}
    except (AIServiceError, RuntimeError) as exc: raise HTTPException(502 if os.getenv("GROQ_API_KEY") else 503, str(exc))

@app.post("/api/student-complaints/analyze")
def analyze_student_complaint(req: StudentComplaintClassificationRequest):
    """Compatibility bridge for the current unauthenticated student portal.

    It generates a review-only draft; authenticated clients must use
    ``POST /api/complaints`` to persist the complaint and draft.
    """
    try:
        result = classify(req.description, req.clarification, req.category_hint)
        payload = {**result.model_dump(), "requires_clarification": result.needs_clarification, "draft": None, "authority_error": None}
        if result.needs_clarification:
            return payload
        authority = db = None
        # A short session is used only to read a trusted, active mapping. No
        # profile, complaint, or draft is created by this compatibility route.
        from database import SessionLocal
        db = SessionLocal()
        try:
            authority = db.query(AuthorityMapping).filter_by(category=result.category, is_active=True).first()
            name = authority.authority_name if authority else "College Authority"
            generated = generate_letter(req.description, result.category, result.subcategory, result.urgency, None, name)
            payload["draft"] = {"recipient_name": authority.authority_name if authority else None, "recipient_email": authority.official_email if authority else None, **generated}
            if not authority:
                payload["authority_error"] = f"No active authority mapping exists for {result.category}. An administrator must configure a verified recipient before sending."
            return payload
        finally:
            if db: db.close()
    except (AIServiceError, RuntimeError) as exc:
        raise HTTPException(502 if os.getenv("GROQ_API_KEY") else 503, str(exc))

@app.post("/api/complaints", response_model=ComplaintOut, status_code=201)
def create(req: ComplaintCreate, identity: Identity = Depends(current_identity), db: Session = Depends(get_db)):
    p = profile(identity, db); c = StudentComplaint(student_id=p.id, title=req.title or req.description[:80], description=req.description, status="Processing"); db.add(c); db.commit()
    try: classify_record(c, StudentComplaintClassificationRequest(description=c.description));
    except (AIServiceError, RuntimeError) as exc: c.status="Failed"; db.commit(); raise HTTPException(502, str(exc))
    try:
        if not c.needs_clarification: draft_record(c, p, db)
        db.commit(); db.refresh(c); return output(c)
    except HTTPException:
        # Persist the valid classification, but do not conceal an authority
        # configuration problem as a successfully generated draft.
        c.status = "Draft"; db.commit()
        raise
    except AIServiceError as exc: c.status="Failed"; db.commit(); raise HTTPException(502, str(exc))

@app.get("/api/complaints", response_model=PaginatedComplaints)
def list_complaints(status: str | None = None, category: str | None = None, offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), identity: Identity = Depends(current_identity), db: Session = Depends(get_db)):
    q = db.query(StudentComplaint).join(StudentProfile).filter(StudentProfile.auth_user_id == identity.user_id)
    if status: q=q.filter(StudentComplaint.status==status)
    if category: q=q.filter(StudentComplaint.category==category)
    total=q.count(); records=q.order_by(StudentComplaint.created_at.desc()).offset(offset).limit(limit).all()
    return PaginatedComplaints(items=[output(c) for c in records], total=total, offset=offset, limit=limit)

@app.get("/api/complaints/{complaint_id}", response_model=ComplaintOut)
def get(complaint_id: str, identity: Identity = Depends(current_identity), db: Session = Depends(get_db)): return output(owned(complaint_id, identity, db))

@app.patch("/api/complaints/{complaint_id}", response_model=ComplaintOut)
def update(complaint_id: str, req: ComplaintUpdate, identity: Identity = Depends(current_identity), db: Session = Depends(get_db)):
    c=owned(complaint_id, identity, db)
    for k,v in req.model_dump(exclude_unset=True).items(): setattr(c,k,v)
    if req.description is not None: c.status="Draft"; c.category=c.subcategory=c.urgency=c.classification_reason=c.clarification_question=None; c.needs_clarification=False
    db.commit(); db.refresh(c); return output(c)

@app.post("/api/complaints/{complaint_id}/classify", response_model=ComplaintOut)
def retry_classify(complaint_id: str, req: StudentComplaintClassificationRequest, identity: Identity = Depends(current_identity), db: Session = Depends(get_db)):
    c=owned(complaint_id, identity, db)
    try: classify_record(c, req); db.commit(); return output(c)
    except (AIServiceError, RuntimeError) as exc: c.status="Failed"; db.commit(); raise HTTPException(502, str(exc))

@app.post("/api/complaints/{complaint_id}/draft", response_model=ComplaintOut)
def draft(complaint_id: str, identity: Identity = Depends(current_identity), db: Session = Depends(get_db)):
    c=owned(complaint_id, identity, db); p=profile(identity, db)
    try: draft_record(c,p,db); db.commit(); return output(c)
    except AIServiceError as exc: c.status="Failed"; db.commit(); raise HTTPException(502, str(exc))

@app.patch("/api/complaints/{complaint_id}/draft", response_model=ComplaintOut)
def edit_draft(complaint_id: str, req: LetterDraftEdit, identity: Identity = Depends(current_identity), db: Session = Depends(get_db)):
    c=owned(complaint_id, identity, db); d=max(c.drafts,key=lambda x:x.version,default=None)
    if not d: raise HTTPException(409,"Generate a draft first")
    for k,v in req.model_dump(exclude_unset=True).items(): setattr(d,k,v)
    c.status="Awaiting Approval"; db.commit(); return output(c)

@app.post("/api/complaints/{complaint_id}/approve-send", response_model=ComplaintOut)
def approve_send(complaint_id: str, identity: Identity = Depends(current_identity), db: Session = Depends(get_db)):
    c=owned(complaint_id, identity, db); d=max(c.drafts,key=lambda x:x.version,default=None)
    if not d: raise HTTPException(409,"No draft exists to approve")
    # One approval attempt per draft. This is the idempotency boundary that
    # prevents a later Gmail implementation from delivering duplicates.
    if db.query(EmailLog).filter_by(draft_id=d.id).first(): raise HTTPException(409,"This draft has already been approved for delivery")
    d.approved_at=dt.datetime.now(dt.UTC); c.status="Approved"; db.add(EmailLog(complaint_id=c.id,draft_id=d.id,recipient_email=d.recipient_email,status="Unavailable",error_code="GMAIL_NOT_CONFIGURED")); db.commit()
    raise HTTPException(503,"Email delivery is not configured. The draft was approved but was not sent.")
