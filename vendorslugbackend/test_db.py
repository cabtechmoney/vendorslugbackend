# test_db.py
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text

url = os.getenv("DATABASE_URL")
engine = create_engine(url)
with engine.connect() as conn:
    print(conn.execute(text("SELECT 1")).fetchone())