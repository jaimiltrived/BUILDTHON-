import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine
from app.models import Base
from app.models.organization import Organization
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash

from sqlalchemy import text

def seed_demo_users():
    print("Ensuring database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE users MODIFY COLUMN role VARCHAR(50)"))
        db.commit()
    except Exception as e:
        print(f"Note on ALTER TABLE: {e}")
        db.rollback()
    
    # 1. Organization
    org = db.query(Organization).filter(Organization.name == "NOVA COMMERCE").first()
    if not org:
        org = Organization(name="NOVA COMMERCE")
        db.add(org)
        db.commit()
        db.refresh(org)
        print(f"Created Org: {org.id}")
    else:
        print(f"Found Org: {org.name} ({org.id})")

    # 2. Demo Users list matching LoginPage.tsx
    demo_users = [
        {
            "email": "cfo@nova.com",
            "password": "nova123",
            "full_name": "Aarav Sharma",
            "role": RoleEnum.CFO,
            "organization_id": org.id
        },
        {
            "email": "analyst@nova.com",
            "password": "nova123",
            "full_name": "Priya Patel",
            "role": RoleEnum.BUSINESS_ANALYST,
            "organization_id": org.id
        },
        {
            "email": "exec@nova.com",
            "password": "nova123",
            "full_name": "Vikram Malhotra",
            "role": RoleEnum.EXECUTIVE,
            "organization_id": org.id
        },
        {
            "email": "auditor@nova.com",
            "password": "nova123",
            "full_name": "Ananya Roy",
            "role": RoleEnum.AUDITOR,
            "organization_id": org.id
        },
        {
            "email": "admin@nova.com",
            "password": "admin123",
            "full_name": "Rohan Verma",
            "role": RoleEnum.ORG_ADMIN,
            "organization_id": org.id
        },
        {
            "email": "superadmin@ftm.com",
            "password": "super123",
            "full_name": "Platform Administrator",
            "role": RoleEnum.SUPER_ADMIN,
            "organization_id": None
        }
    ]

    for u_data in demo_users:
        existing = db.query(User).filter(User.email == u_data["email"]).first()
        if existing:
            existing.hashed_password = get_password_hash(u_data["password"])
            existing.full_name = u_data["full_name"]
            existing.role = u_data["role"]
            existing.organization_id = u_data["organization_id"]
            existing.is_active = True
            print(f"Updated user: {u_data['email']} ({u_data['role'].value})")
        else:
            new_u = User(
                email=u_data["email"],
                hashed_password=get_password_hash(u_data["password"]),
                full_name=u_data["full_name"],
                role=u_data["role"],
                organization_id=u_data["organization_id"],
                is_active=True
            )
            db.add(new_u)
            print(f"Created user: {u_data['email']} ({u_data['role'].value})")

    db.commit()
    db.close()
    print("Demo users seeded successfully!")

if __name__ == "__main__":
    seed_demo_users()
