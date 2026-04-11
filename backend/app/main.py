from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import exercises, sessions, skills, students
from app.schemas.health import HealthResponse

app = FastAPI(title="PedagogIA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(skills.router)
app.include_router(students.router)
app.include_router(sessions.router)
app.include_router(exercises.router)


@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok"}
