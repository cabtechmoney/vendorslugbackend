# init_db.py
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine
from main import Base  # import your Base

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
print("✅ Tables created (or already exist).")