import json
import logging
import os
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from typing import Any, Optional

import anyio
import uvicorn
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from bulk_manager import BulkScanManager
from engine import CipherEngine
from models import clear_all_history, get_all_history, init_db, save_report

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("ciphercert.api")

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


class BulkScanOptionsModel(BaseModel):
    port: int = Field(default=443, ge=1, le=65535)
    timeout_ms: int = Field(default=5000, ge=1000, le=30000)
    max_concurrency: int = Field(default=50, ge=1, le=200)
    retries: int = Field(default=1, ge=0, le=3)
    cache_ttl_sec: int = Field(default=300, ge=0, le=3600)


class BulkScanRequest(BaseModel):
    targets: list[str]
    options: Optional[BulkScanOptionsModel] = None


class EmailTestRequest(BaseModel):
    to: list[str]
    subject: str
    body: str


async def _persist_bulk_result(result: dict[str, Any]):
    report = engine_instance.result_to_report(result.get("target", "unknown"), result)
    await anyio.to_thread.run_sync(save_report, report)


bulk_manager = BulkScanManager(engine=engine_instance, persist_result=_persist_bulk_result)


def _log_event(
    stage: str,
    scan_id: Optional[str] = None,
    target: Optional[str] = None,
    duration_ms: Optional[int] = None,
    error_type: Optional[str] = None,
    **extra: Any,
):
    payload: dict[str, Any] = {
        "scan_id": scan_id,
        "target": target,
        "stage": stage,
        "duration_ms": duration_ms,
        "error_type": error_type,
    }
    payload.update(extra)
    logger.info(json.dumps(payload, default=str))


def format_result(report):
    status_map = {
        "Secure": "secure",
        "Expired": "expired",
        "Warning": "warning",
        "Critical": "expired",
        "Connection Failed": "expired",
        "Error": "expired",
    }

    # Format Expiry Date
    try:
        if hasattr(report, "days_remaining") and report.days_remaining is not None:
            expiry_date_str = (
                datetime.now() + timedelta(days=report.days_remaining)
            ).strftime("%b %d, %Y")
        else:
            expiry_date_str = "Unknown"
    except Exception:
        expiry_date_str = "Unknown"

    scan_time = "Just now"
    if hasattr(report, "scan_date") and report.scan_date:
        scan_time = report.scan_date.strftime("%Y-%m-%d %H:%M:%S")

    return {
        "id": getattr(report, "id", str(datetime.now().timestamp())),
        "domain": report.domain,
        "status": status_map.get(report.ssl_status, "warning"),
        "issuer": report.issuer,
        "expiryDate": expiry_date_str,
        "grade": report.grade,
        "score": report.score,
        "timestamp": scan_time,
    }


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
        await anyio.to_thread.run_sync(_send_email_smtp, req.to, req.subject, req.body)
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/scan")
async def scan_domain(request: ScanRequest):
    started = datetime.now()
    _log_event(stage="single_scan_started", target=request.domain)
    try:
        report = await engine_instance.scan_domain(request.domain)
        save_report(report)
        duration_ms = int((datetime.now() - started).total_seconds() * 1000)
        _log_event(
            stage="single_scan_finished",
            target=request.domain,
            duration_ms=duration_ms,
            error_type=("scan_error" if report.error_msg else None),
        )
        return format_result(report)
    except Exception as exc:
        _log_event(
            stage="single_scan_failed",
            target=request.domain,
            error_type="exception",
            message=str(exc),
        )
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/scan/bulk")
async def create_bulk_scan(request: BulkScanRequest):
    try:
        created = await bulk_manager.create_job(
            raw_targets=request.targets,
            options=request.options.model_dump() if request.options else None,
        )
        _log_event(
            stage="bulk_scan_created",
            scan_id=created["scan_id"],
            accepted=created["accepted"],
            deduped=created["deduped"],
        )
        return created
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=429, detail=str(exc))


@app.get("/api/scan/bulk/{scan_id}/status")
async def get_bulk_scan_status(scan_id: str):
    status = await bulk_manager.get_status(scan_id)
    if status is None:
        raise HTTPException(status_code=404, detail="scan_id not found")
    return status


@app.get("/api/scan/bulk/{scan_id}/results")
async def get_bulk_scan_results(
    scan_id: str,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=2000),
):
    payload = await bulk_manager.get_results(scan_id=scan_id, offset=offset, limit=limit)
    if payload is None:
        raise HTTPException(status_code=404, detail="scan_id not found")
    return payload


@app.get("/api/scan/bulk/{scan_id}/events")
async def stream_bulk_scan_events(
    scan_id: str,
    request: Request,
    offset: Optional[int] = Query(default=None, ge=0),
):
    status = await bulk_manager.get_status(scan_id)
    if status is None:
        raise HTTPException(status_code=404, detail="scan_id not found")

    header_event_id = request.headers.get("last-event-id")
    if offset is not None:
        last_event_id = offset - 1
    elif header_event_id is not None and header_event_id.isdigit():
        last_event_id = int(header_event_id)
    else:
        last_event_id = -1

    async def event_generator():
        async for chunk in bulk_manager.iter_events(scan_id, last_event_id=last_event_id):
            if await request.is_disconnected():
                break
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/scan/bulk/{scan_id}/cancel")
async def cancel_bulk_scan(scan_id: str):
    state = await bulk_manager.cancel_job(scan_id)
    if state is None:
        raise HTTPException(status_code=404, detail="scan_id not found")
    return {"scan_id": scan_id, "state": state}


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
    raise HTTPException(status_code=500, detail="Failed to clear history")


@app.on_event("shutdown")
async def shutdown_event():
    await engine_instance.close()


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)