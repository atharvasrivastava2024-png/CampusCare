import datetime as dt
import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

def uuid4(): return str(uuid.uuid4())
def utcnow(): return dt.datetime.now(dt.UTC)
class StudentProfile(Base):
    __tablename__ = "student_profiles"
    id = Column(String(36), primary_key=True, default=uuid4); auth_user_id = Column(String(128), unique=True, nullable=False, index=True)
    full_name = Column(String(200)); institutional_email = Column(String(320)); created_at = Column(DateTime, default=utcnow, nullable=False); updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    complaints = relationship("StudentComplaint", back_populates="student", cascade="all, delete-orphan")
class StudentComplaint(Base):
    __tablename__ = "student_complaints"
    id = Column(String(36), primary_key=True, default=uuid4); student_id = Column(String(36), ForeignKey("student_profiles.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False); description = Column(Text, nullable=False); category = Column(String(32)); subcategory = Column(String(120)); urgency = Column(String(10)); classification_reason = Column(String(500)); needs_clarification = Column(Boolean, default=False, nullable=False); clarification_question = Column(String(500)); status = Column(String(32), default="Draft", nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False); updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    student = relationship("StudentProfile", back_populates="complaints"); drafts = relationship("LetterDraft", back_populates="complaint", cascade="all, delete-orphan")
class LetterDraft(Base):
    __tablename__ = "letter_drafts"
    id = Column(String(36), primary_key=True, default=uuid4); complaint_id = Column(String(36), ForeignKey("student_complaints.id"), nullable=False, index=True); version = Column(Integer, nullable=False, default=1)
    recipient_name = Column(String(200), nullable=False); recipient_email = Column(String(320), nullable=False); subject = Column(String(300), nullable=False); body = Column(Text, nullable=False); approved_at = Column(DateTime); created_at = Column(DateTime, default=utcnow, nullable=False); updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    complaint = relationship("StudentComplaint", back_populates="drafts"); __table_args__ = (UniqueConstraint("complaint_id", "version", name="uq_draft_version"),)
class AuthorityMapping(Base):
    __tablename__ = "authority_mappings"
    id = Column(String(36), primary_key=True, default=uuid4); category = Column(String(32), unique=True, nullable=False); authority_name = Column(String(200), nullable=False); official_email = Column(String(320), nullable=False); is_active = Column(Boolean, default=True, nullable=False); created_at = Column(DateTime, default=utcnow, nullable=False); updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
class EmailLog(Base):
    __tablename__ = "email_logs"
    id = Column(String(36), primary_key=True, default=uuid4); complaint_id = Column(String(36), ForeignKey("student_complaints.id"), nullable=False, index=True); draft_id = Column(String(36), ForeignKey("letter_drafts.id"), nullable=False); recipient_email = Column(String(320), nullable=False); provider_message_id = Column(String(300)); status = Column(String(32), nullable=False); error_code = Column(String(120)); created_at = Column(DateTime, default=utcnow, nullable=False); sent_at = Column(DateTime)
