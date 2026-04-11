from pydantic import BaseModel, ConfigDict


class SkillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    grade: str
    description: str
    mastery_threshold: int
    prerequisite_ids: list[str] = []
