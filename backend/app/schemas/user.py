from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import RoleEnum

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: RoleEnum = RoleEnum.EXECUTIVE

class UserCreate(UserBase):
    password: str
    organization_id: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[RoleEnum] = None

class UserInDB(UserBase):
    id: str
    is_active: bool
    organization_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class OTPRequest(BaseModel):
    email: EmailStr
    phone: Optional[str] = None

class OTPVerifyAndRegister(BaseModel):
    email: EmailStr
    otp: str
    password: str
    full_name: Optional[str] = None
    role: RoleEnum = RoleEnum.CFO
    organization_id: Optional[str] = None

class OTPResponse(BaseModel):
    message: str
    expires_in_seconds: int
    cooldown_seconds: int
    dev_otp: Optional[str] = None

