from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.skill import Skill


class ExerciseTemplate(Base):
    __tablename__ = "exercise_templates"
    __table_args__ = (CheckConstraint("difficulty BETWEEN 1 AND 3", name="valid_difficulty"),)

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id"))
    difficulty: Mapped[int] = mapped_column(default=1)
    template: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())

    skill: Mapped["Skill"] = relationship(back_populates="exercise_templates")
