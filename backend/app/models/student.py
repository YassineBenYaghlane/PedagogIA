import datetime
import uuid

from sqlalchemy import ForeignKey, String, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, server_default=text("gen_random_uuid()")
    )
    display_name: Mapped[str] = mapped_column(String(100))
    grade: Mapped[str] = mapped_column(String(5))
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())


class StudentSkillState(Base):
    __tablename__ = "student_skill_state"

    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id"), primary_key=True)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id"), primary_key=True)
    mastery_level: Mapped[float] = mapped_column(default=0.0)
    consecutive_correct: Mapped[int] = mapped_column(default=0)
    total_attempts: Mapped[int] = mapped_column(default=0)
    last_practiced_at: Mapped[datetime.datetime | None] = mapped_column(default=None)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
