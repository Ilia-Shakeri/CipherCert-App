from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
# --- ایمپورت‌های مستقیم از همین پوشه ---
from engine import CipherEngine
from models import init_db, save_report, get_all_history
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime, timedelta

# راه‌اندازی دیتابیس
init_db()

app = FastAPI()

# تنظیم CORS
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
        "Connection Failed": "expired"
    }
    
    # هندل کردن تاریخ انقضا برای نمایش
    try:
        expiry_date_str = (datetime.now() + timedelta(days=report.days_remaining)).strftime("%b %d, %Y")
    except:
        expiry_date_str = "Unknown"

    return {
        "id": str(report.domain) + str(datetime.now().timestamp()), # ID یونیک
        "domain": report.domain,
        "status": status_map.get(report.ssl_status, "warning"),
        "issuer": report.issuer,
        "expiryDate": expiry_date_str,
        "grade": report.grade,
        "score": report.score
    }

@app.post("/api/scan")
async def scan_domain(request: ScanRequest):
    print(f"Scanning domain: {request.domain}") # لاگ برای دیباگ
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

@app.on_event("shutdown")
async def shutdown_event():
    await engine_instance.close()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)