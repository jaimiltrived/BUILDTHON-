# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Enum
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class RoleEnum(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ORG_ADMIN = "ORG_ADMIN"
    CFO = "CFO"
    BUSINESS_ANALYST = "BUSINESS_ANALYST"
    EXECUTIVE = "EXECUTIVE"
    AUDITOR = "AUDITOR"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    role = Column(String(50), default="EXECUTIVE")
    
    organization_id = Column(String(36), ForeignKey("organizations.id"))
    organization = relationship("Organization", back_populates="users")

    @property
    def role_str(self) -> str:
        if hasattr(self.role, "value"):
            return str(self.role.value)
        return str(self.role) if self.role else "EXECUTIVE"

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
