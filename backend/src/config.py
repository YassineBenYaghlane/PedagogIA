from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "postgresql://ceb:ceb@localhost:5411/ceb"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = True


settings = Settings()
