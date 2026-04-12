from pydantic import BaseModel


class ExerciseResponse(BaseModel):
    template_id: str
    skill_id: str
    difficulty: int
    type: str
    prompt: str
    answer: float | int | str
    params: dict
