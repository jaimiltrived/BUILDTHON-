import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

def get_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite"):
        return create_engine(db_url, connect_args={"check_same_thread": False})
    try:
        eng = create_engine(db_url, pool_pre_ping=True)
        # Test connection
        with eng.connect() as conn:
            pass
        return eng
    except Exception as e:
        logger.warning(f"Could not connect to external database ({db_url}): {e}. Falling back to SQLite local database.")
        sqlite_url = "sqlite:///./financial_time_machine.db"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

