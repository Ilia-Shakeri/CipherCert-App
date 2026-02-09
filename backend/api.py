from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
# --- Direct imports from the same folder ---
from engine import CipherEngine
from models import init_db, save_report, get_all_history, clear_all_history
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime, timedelta

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