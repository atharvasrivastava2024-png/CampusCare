from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator
Category = Literal["Library", "Student Welfare", "Hostel", "Proctor", "Gym", "Food & Mess"]
Urgency = Literal["Low", "Medium", "High"]
Status = Literal["Draft", "Processing", "Awaiting Approval", "Approved", "Sent", "Failed"]
class Classification(BaseModel):
    category: Optional[Category] = None; subcategory: Optional[str] = Field(None, max_length=120); urgency: Optional[Urgency] = None; classification_reason: str = Field(..., min_length=1, max_length=500); needs_clarification: bool = False; clarification_question: Optional[str] = Field(None, max_length=500)
    @model_validator(mode="after")
    def valid(self):
        if self.needs_clarification and not self.clarification_question: raise ValueError("clarification question required")
        if not self.needs_clarification and (not self.category or not self.urgency): raise ValueError("category and urgency required")
        return self
class StudentComplaintClassificationRequest(BaseModel):
    description: str = Field(..., min_length=20, max_length=4000); clarification: Optional[str] = Field(None, max_length=1000); category_hint: Optional[Category] = None
class ComplaintCreate(BaseModel): title: Optional[str] = Field(None, max_length=200); description: str = Field(..., min_length=20, max_length=4000)
class ComplaintUpdate(BaseModel): title: Optional[str] = Field(None, min_length=1, max_length=200); description: Optional[str] = Field(None, min_length=20, max_length=4000)
class LetterDraftEdit(BaseModel): subject: Optional[str] = Field(None, min_length=1, max_length=300); body: Optional[str] = Field(None, min_length=1, max_length=10000)
class LetterOut(BaseModel):
    id: str; version: int; recipient_name: str; recipient_email: str; subject: str; body: str; approved_at: Optional[datetime] = None; created_at: datetime; updated_at: datetime
    class Config: from_attributes = True
class ComplaintOut(BaseModel):
    id: str; title: str; description: str; category: Optional[Category] = None; subcategory: Optional[str] = None; urgency: Optional[Urgency] = None; classification_reason: Optional[str] = None; needs_clarification: bool; clarification_question: Optional[str] = None; status: Status; created_at: datetime; updated_at: datetime; current_draft: Optional[LetterOut] = None
class PaginatedComplaints(BaseModel): items: list[ComplaintOut]; total: int; offset: int; limit: int
