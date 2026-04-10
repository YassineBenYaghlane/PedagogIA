from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.exercise_template import ExerciseTemplate


class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"
    __table_args__ = (CheckConstraint("skill_id != prerequisite_id", name="no_self_prerequisite"),)

    skill_id: Mapped[str] = mapped_column(ForeignKey("skills.id"), primary_key=True)
    prerequisite_id: Mapped[str] = mapped_column(ForeignKey("skills.id"), primary_key=True)


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    label: Mapped[str] = mapped_column(String(200))
    grade: Mapped[str] = mapped_column(String(5))
    description: Mapped[str]
    mastery_threshold: Mapped[int] = mapped_column(default=3)
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())

    prerequisites: Mapped[list["Skill"]] = relationship(
        secondary="skill_prerequisites",
        primaryjoin="Skill.id == SkillPrerequisite.skill_id",
        secondaryjoin="Skill.id == SkillPrerequisite.prerequisite_id",
        lazy="selectin",
    )

    exercise_templates: Mapped[list["ExerciseTemplate"]] = relationship(
        back_populates="skill", lazy="selectin"
    )
