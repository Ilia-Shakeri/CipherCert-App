from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
# --- Direct imports from the same folder ---
from engine import CipherEngine
from models import init_db, save_report, get_all_history, clear_all_history
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime, timedelta
import os
import smtplib
from email.message import EmailMessage
import anyio

# Initialize DB
init_db()

app = FastAPI()

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine_instance = CipherEngine()

class ScanRequest(BaseModel):
    domain: str

def format_result(report):
    status_map = {
        "Secure": "secure",
        "Expired": "expired",
        "Warning": "warning",
        "Critical": "expired", 
        "Connection Failed": "expired",
        "Error": "expired"
    }
    
    # Format Expiry Date
    try:
        if hasattr(report, 'days_remaining') and report.days_remaining is not None:
            expiry_date_str = (datetime.now() + timedelta(days=report.days_remaining)).strftime("%b %d, %Y")
        else:
            expiry_date_str = "Unknown"
    except:
        expiry_date_str = "Unknown"

    scan_time = "Just now"
    if hasattr(report, 'scan_date') and report.scan_date:
        scan_time = report.scan_date.strftime("%Y-%m-%d %H:%M:%S")

    return {
        "id": getattr(report, 'id', str(datetime.now().timestamp())), 
        "domain": report.domain,
        "status": status_map.get(report.ssl_status, "warning"),
        "issuer": report.issuer,
        "expiryDate": expiry_date_str,
        "grade": report.grade,
        "score": report.score,
        "timestamp": scan_time 
    }

class EmailTestRequest(BaseModel):
    to: list[str]
    subject: str
    body: str

def _send_email_smtp(to: list[str], subject: str, body: str):
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587").strip())
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASS", "").strip()
    from_addr = os.getenv("SMTP_FROM", user).strip()

    use_tls = os.getenv("SMTP_TLS", "true").lower() in ("1", "true", "yes")
    use_ssl = os.getenv("SMTP_SSL", "false").lower() in ("1", "true", "yes")

    if not host or not from_addr:
        raise Exception("SMTP is not configured (set SMTP_HOST and SMTP_FROM/SMTP_USER).")

    msg = EmailMessage()
    msg["From"] = from_addr
    msg["To"] = ", ".join(to)
    msg["Subject"] = subject
    msg.set_content(body)

    if use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=15) as server:
            if user:
                server.login(user, password)
            server.send_message(msg)
    else:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            if use_tls:
                server.starttls()
                server.ehlo()
            if user:
                server.login(user, password)
            server.send_message(msg)

@app.post("/api/notifications/email/test")
async def send_test_email(req: EmailTestRequest):
    if not req.to:
        raise HTTPException(status_code=400, detail="No recipients provided")
    try:
        # Run blocking SMTP in a thread
        await anyio.to_thread.run_sync(_send_email_smtp, req.to, req.subject, req.body)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan")
async def scan_domain(request: ScanRequest):
    print(f"Scanning domain: {request.domain}") # Debug Log
    try:
        report = await engine_instance.scan_domain(request.domain)
        save_report(report)
        return format_result(report)
    except Exception as e:
        print(f"Scan Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history():
    results = get_all_history()
    return [format_result(r) for r in results]

@app.delete("/api/history")
def clear_history():
    """Clears the entire scan history."""
    success = clear_all_history()
    if success:
        return {"message": "History cleared successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to clear history")

@app.on_event("shutdown")
async def shutdown_event():
    await engine_instance.close()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)