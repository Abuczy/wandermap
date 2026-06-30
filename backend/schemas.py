from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class DestinationBase(BaseModel):
    name: str
    country: str
    description: Optional[str] = None
    status: str = "planned"
    visit_date: Optional[date] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None


class DestinationCreate(DestinationBase):
    pass


class DestinationUpdate(DestinationBase):
    pass


class DestinationOut(DestinationBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True
