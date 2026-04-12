import datetime
import uuid

from sqlalchemy import ForeignKey, String, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, server_default=text("gen_random_uuid()")
    )
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"))
    mode: Mapped[str] = mapped_column(String(20))
    started_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
    ended_at: Mapped[datetime.datetime | None] = mapped_column(default=None)


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, server_default=text("gen_random_uuid()")
    )
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id"))
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id"))
    exercise_template_id: Mapped[str | None] = mapped_column(
        ForeignKey("exercise_templates.id"), default=None
    )
    exercise_params: Mapped[dict | None] = mapped_column(JSONB, default=None)
    student_answer: Mapped[str | None] = mapped_column(default=None)
    correct_answer: Mapped[str]
    is_correct: Mapped[bool | None] = mapped_column(default=None)
    responded_at: Mapped[datetime.datetime | None] = mapped_column(default=None)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
