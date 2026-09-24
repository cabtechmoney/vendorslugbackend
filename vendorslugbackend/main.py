import os
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, status, Depends, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import jwt
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv
load_dotenv()

# SQLAlchemy Modules
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# --- DATABASE PIPELINE SETUP ---
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set in the backend .env file.")

# Replace asyncpg with psycopg2 if needed (for sync engine)
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL, echo=False)  # set echo=True for debugging
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Test connection on startup ---
try:
    with engine.connect() as conn:
        print("✅ Database connection successful.")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    raise

# --- SQLALCHEMY DATABASE TABLE MODELS ---

class MerchantTable(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String, nullable=False)
    whatsapp_number = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VendorTable(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProductTable(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    vendor_slug = Column(String, ForeignKey("vendors.slug"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Integer, nullable=False)
    image_url = Column(String, nullable=True)
    tag = Column(String, nullable=True)
    category = Column(String, nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- FASTAPI APP ---
app = FastAPI(title="PostgreSQL Merchant Core Engine", version="1.2.0")

@app.on_event("startup")
def create_database_tables():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS merchant_id INTEGER REFERENCES merchants(id)"
        )
        connection.exec_driver_sql(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_slug VARCHAR"
        )
        connection.exec_driver_sql(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'vendor_id'
                ) THEN
                    EXECUTE '
                        UPDATE products AS products
                        SET vendor_slug = vendors.slug
                        FROM vendors
                        WHERE products.vendor_slug IS NULL
                          AND products.vendor_id = vendors.id
                    ';
                END IF;
            END $$;
            """
        )
        connection.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_vendors_merchant_id ON vendors(merchant_id)"
        )
    print("✅ Database tables verified/created.")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Protocols
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set in .env")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
PORT = int(os.getenv("PORT", "8000"))
APP_BASE_URL = os.getenv("APP_BASE_URL", f"http://localhost:{PORT}")

# Email SMTP Setup
mail_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

# --- Pydantic Schemas ---
class SignUpSchema(BaseModel):
    shop_name: str
    whatsapp_number: str
    email: EmailStr
    password: str

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class VendorCreateSchema(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    whatsapp: Optional[str] = None
    logo_url: Optional[str] = None

class VendorUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    whatsapp: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductCreateSchema(BaseModel):
    vendor_slug: str
    name: str
    price: int
    description: Optional[str] = None
    image_url: Optional[str] = None
    tag: Optional[str] = None
    category: Optional[str] = None

class ProductUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    image_url: Optional[str] = None
    tag: Optional[str] = None
    category: Optional[str] = None
    is_available: Optional[bool] = None

# --- UTILITY CRYPTO LAYERS ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_verification_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode({"sub": email, "exp": expire, "type": "email_verification"}, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    return jwt.encode({"sub": email, "exp": expire, "type": "admin_session"}, SECRET_KEY, algorithm=ALGORITHM)

def send_verification_email(email: str, token: str, background_tasks: BackgroundTasks):
    verification_url = f"{APP_BASE_URL}/api/auth/verify-email?token={token}"
    html_content = f"""
    <html>
        <body style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; text-align: center;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155;">
                <h2 style="color: #6366f1;">Activate Merchant Vault Profile</h2>
                <p style="font-size: 14px; color: #94a3b8;">Click down below to authorize your merchant profile access domain.</p>
                <a href="{verification_url}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; margin-top: 16px;">Verify Core Vault Account</a>
            </div>
        </body>
    </html>
    """
    message = MessageSchema(subject="Verify Merchant Store Platform", recipients=[email], body=html_content, subtype=MessageType.html)
    fm = FastMail(mail_config)
    background_tasks.add_task(fm.send_message, message)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "merchant-backend"}

# --- RESPONSE HELPERS (optional, but kept for consistency) ---
def vendor_response(vendor: VendorTable, products: List[ProductTable] = None) -> dict:
    if products is None:
        products = []
    return {
        "id": vendor.id,
        "name": vendor.name,
        "slug": vendor.slug,
        "description": vendor.description,
        "whatsapp": vendor.whatsapp,
        "logo_url": vendor.logo_url,
        "is_active": vendor.is_active,
        "created_at": vendor.created_at.isoformat() if vendor.created_at else None,
        "products": [
            {
                "id": p.id,
                "vendor_slug": vendor.slug,
                "name": p.name,
                "description": p.description,
                "price": p.price,
                "image_url": p.image_url,
                "tag": p.tag,
                "category": p.category,
                "is_available": p.is_available,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in products
        ]
    }

def product_response(product: ProductTable, vendor_slug: str) -> dict:
    return {
        "id": product.id,
        "vendor_slug": vendor_slug,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "image_url": product.image_url,
        "tag": product.tag,
        "category": product.category,
        "is_available": product.is_available,
        "created_at": product.created_at.isoformat() if product.created_at else None,
    }

def get_current_merchant(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "admin_session":
            raise jwt.PyJWTError()
        email = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    merchant = db.query(MerchantTable).filter(MerchantTable.email == email).first()
    if not merchant or not merchant.is_active:
        raise HTTPException(status_code=401, detail="Merchant unavailable.")
    return merchant

# --- API ROUTES ---

@app.post("/vendors", status_code=status.HTTP_201_CREATED)
def create_vendor(
    payload: VendorCreateSchema,
    merchant: MerchantTable = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    slug = payload.slug.strip().lower()
    if not slug:
        raise HTTPException(status_code=422, detail="Vendor slug cannot be empty.")
    if db.query(VendorTable).filter(VendorTable.slug == slug).first():
        raise HTTPException(status_code=409, detail="A vendor with this slug already exists.")
    vendor = VendorTable(
        name=payload.name.strip(),
        slug=slug,
        merchant_id=merchant.id,
        description=payload.description,
        whatsapp=payload.whatsapp,
        logo_url=payload.logo_url,
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor_response(vendor)

@app.get("/vendors/{vendor_slug}")
def get_vendor(vendor_slug: str, db: Session = Depends(get_db)):
    vendor = db.query(VendorTable).filter(VendorTable.slug == vendor_slug.lower()).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")

    products = (
        db.query(ProductTable)
        .filter(
            ProductTable.is_available == True,
            (ProductTable.vendor_slug == vendor.slug) | (ProductTable.vendor_id == vendor.id),
        )
        .all()
    )
    return vendor_response(vendor, products)
@app.put("/vendors/{vendor_slug}")
def update_vendor(
    vendor_slug: str,
    payload: VendorUpdateSchema,
    merchant: MerchantTable = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    vendor = db.query(VendorTable).filter(
        VendorTable.slug == vendor_slug.lower(), VendorTable.merchant_id == merchant.id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")
    if payload.name is not None:
        vendor.name = payload.name.strip()
    if payload.description is not None:
        vendor.description = payload.description
    if payload.whatsapp is not None:
        vendor.whatsapp = payload.whatsapp
    if payload.logo_url is not None:
        vendor.logo_url = payload.logo_url
    if payload.is_active is not None:
        vendor.is_active = payload.is_active
    db.commit()
    db.refresh(vendor)
    return vendor_response(vendor)

@app.get("/products")
def list_products(vendor_slug: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ProductTable, VendorTable).join(VendorTable, ProductTable.vendor_slug == VendorTable.slug)
    query = query.filter(ProductTable.is_available.is_(True), VendorTable.is_active.is_(True))
    if vendor_slug:
        query = query.filter(VendorTable.slug == vendor_slug.strip().lower())
    return [
        product_response(product, vendor.slug)
        for product, vendor in query.all()
    ]

@app.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    result = db.query(ProductTable, VendorTable).join(
        VendorTable, ProductTable.vendor_slug == VendorTable.slug
    ).filter(
        ProductTable.id == product_id,
        ProductTable.is_available.is_(True),
        VendorTable.is_active.is_(True),
    ).first()
    if not result:
        raise HTTPException(status_code=404, detail="Product not found.")
    product, vendor = result
    return product_response(product, vendor.slug)

# --- AUTH ENDPOINTS ---
@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
async def merchant_signup(payload: SignUpSchema, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(MerchantTable).filter(MerchantTable.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Administrative profile registration already exists.")
    new_merchant = MerchantTable(
        shop_name=payload.shop_name,
        whatsapp_number=payload.whatsapp_number,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_active=False
    )
    db.add(new_merchant)
    db.commit()
    db.refresh(new_merchant)
    token = create_verification_token(payload.email)
    send_verification_email(payload.email, token, background_tasks)
    return {"status": "success", "message": "Merchant profile committed. Verification link dispatched."}

@app.get("/api/auth/verify-email")
async def verify_merchant_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")
    merchant = db.query(MerchantTable).filter(MerchantTable.email == email).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found.")
    merchant.is_active = True
    db.commit()
    return {"status": "success", "message": "Account verified."}

@app.post("/api/auth/login")
async def merchant_login(payload: LoginSchema, db: Session = Depends(get_db)):
    merchant = db.query(MerchantTable).filter(MerchantTable.email == payload.email).first()
    if not merchant or not verify_password(payload.password, merchant.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not merchant.is_active:
        raise HTTPException(status_code=403, detail="Account inactive. Verify your email.")
    token = create_access_token(merchant.email)
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "merchant_profile": {
            "id": merchant.id,
            "shop_name": merchant.shop_name,
            "whatsapp_number": merchant.whatsapp_number,
            "email": merchant.email,
            "is_active": merchant.is_active,
        }
    }

@app.get("/api/auth/me")
async def get_current_merchant_profile(merchant: MerchantTable = Depends(get_current_merchant)):
    return {
        "id": merchant.id,
        "shop_name": merchant.shop_name,
        "whatsapp_number": merchant.whatsapp_number,
        "email": merchant.email,
        "is_active": merchant.is_active,
    }