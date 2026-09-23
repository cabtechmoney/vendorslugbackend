import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Add columns to vendors
    conn.execute(text("ALTER TABLE vendors ADD COLUMN IF NOT EXISTS whatsapp VARCHAR"))
    conn.execute(text("ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url VARCHAR"))
    conn.execute(text("ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
    
    # Add columns to products
    conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR"))
    conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS tag VARCHAR"))
    conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR"))
    conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
    
    # Add to merchants
    conn.execute(text("ALTER TABLE merchants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
    
    conn.commit()
    print("✅ All columns added successfully!")