from pydantic import BaseModel, EmailStr


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    email: str
    role: str


class LeadRow(BaseModel):
    id: str
    email: str
    name: str
    company: str | None
    industry: str | None
    is_approved: bool
    created_at: str


class LeadsListResponse(BaseModel):
    leads: list[LeadRow]
    total: int
