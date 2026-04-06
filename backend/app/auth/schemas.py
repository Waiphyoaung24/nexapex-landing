from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    name: str
    company: str | None = None
    industry: str | None = None


class SignupResponse(BaseModel):
    id: str
    email: str
    name: str
    token: str
    demos_remaining: dict[str, int]
