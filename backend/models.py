from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os

Base = declarative_base()

# --- 1. Data Transfer Object (DTO) ---
class ScanReport:
    def __init__(self, domain):
        self.domain = domain
        self.grade = "F"
        self.score = 0
        self.ssl_status = "Unknown"
        self.days_remaining = 0
        self.issuer = "Unknown"
        self.tls_version = "Unknown"
        self.error_msg = None
        self.scan_date = datetime.now()

# --- 2. Database Model (SQLAlchemy) ---
class ScanResult(Base):
    __tablename__ = 'scan_results'

    id = Column(Integer, primary_key=True)
    domain = Column(String, index=True)
    grade = Column(String)       # A, B, C, F
    score = Column(Integer)      # 0-100
    ssl_status = Column(String)  # Secure, Expired, etc.
    days_remaining = Column(Integer)
    issuer = Column(String)
    scan_date = Column(DateTime, default=datetime.now)
    error_msg = Column(String, nullable=True)

# --- Database Setup ---
DB_FOLDER = os.path.join(os.path.dirname(__file__), "data")
if not os.path.exists(DB_FOLDER):
    os.makedirs(DB_FOLDER)

DATABASE_URL = f"sqlite:///{os.path.join(DB_FOLDER, 'ciphercert.db')}"

# Sync Engine
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)

def init_db():
    """Create tables if they don't exist"""
    Base.metadata.create_all(bind=engine)

def save_report(report: ScanReport):
    """Converts ScanReport (DTO) to ScanResult (DB) and saves it."""
    session = SessionLocal()
    try:
        db_entry = ScanResult(
            domain=report.domain,
            grade=report.grade,
            score=report.score,
            ssl_status=report.ssl_status,
            days_remaining=report.days_remaining,
            issuer=report.issuer,
            error_msg=report.error_msg
        )
        session.add(db_entry)
        session.commit()
    except Exception as e:
        print(f"DB Error: {e}")
    finally:
        session.close()

def get_all_history():
    """Fetch all records sorted by date (newest first)"""
    session = SessionLocal()
    try:
        results = session.query(ScanResult).order_by(ScanResult.scan_date.desc()).all()
        return results
    except Exception as e:
        print(f"Fetch Error: {e}")
        return []
    finally:
        session.close()

def clear_all_history():
    """Deletes all records from the scan_results table."""
    session = SessionLocal()
    try:
        session.query(ScanResult).delete()
        session.commit()
        return True
    except Exception as e:
        print(f"Clear DB Error: {e}")
        session.rollback()
        return False
    finally:
        session.close()