import os
os.environ['PGPASSWORD'] = 'wander123'

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://wander:wander123@localhost:5432/wandermap"

engine = create_engine(
    DATABASE_URL,
    connect_args={"options": "-c client_encoding=utf8"}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()