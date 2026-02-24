import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Optional

from engine import CipherEngine

logger = logging.getLogger("ciphercert.bulk")

DEFAULT_OPTIONS = {
    "port": 443,
    "timeout_ms": 5000,
    "max_concurrency": 50,
    "retries": 1,
    "cache_ttl_sec": 300,
}

TERMINAL_STATES = {"done", "canceled", "error"}


def utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class BulkScanJob:
    scan_id: str
    targets: list[str]
    options: dict[str, int]
    state: str = "running"
    started_at: str = field(default_factory=utc_iso)
    updated_at: str = field(default_factory=utc_iso)
    progress_done: int = 0
    progress_total: int = 0
    stats: dict[str, int] = field(
        default_factory=lambda: {
            "success": 0,
            "failed": 0,
            "cached": 0,
            "timeout": 0,
            "dns_error": 0,
            "tls_error": 0,
            "conn_error": 0,
            "unknown_error": 0,
            "invalid_error": 0,
        }
    )
    metrics: dict[str, int] = field(
        default_factory=lambda: {
            "total_duration_ms": 0,
            "success": 0,
            "fail": 0,
            "timeout": 0,
            "dns_error": 0,
            "tls_error": 0,
        }
    )
    error_message: Optional[str] = None
    results: list[dict[str, Any]] = field(default_factory=list)
    events: list[dict[str, Any]] = field(default_factory=list)
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)
    event_condition: asyncio.Condition = field(default_factory=asyncio.Condition)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    task: Optional[asyncio.Task] = None


class BulkScanManager:
    MAX_TARGETS_PER_JOB = 5000

    def __init__(
        self,
        engine: CipherEngine,
        persist_result: Optional[Callable[[dict[str, Any]], Awaitable[None]]] = None,
        max_running_jobs: int = 4,
    ):
        self.engine = engine
        self.persist_result = persist_result
        self.max_running_jobs = max_running_jobs
        self.jobs: dict[str, BulkScanJob] = {}
        self.jobs_lock = asyncio.Lock()

    async def create_job(
        self, raw_targets: list[str], options: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        if not isinstance(raw_targets, list):
            raise ValueError("targets must be a list")

        if len(raw_targets) > self.MAX_TARGETS_PER_JOB:
            raise ValueError(
                f"Too many targets. Maximum allowed is {self.MAX_TARGETS_PER_JOB}"
            )

        normalized_targets: list[str] = []
        for raw in raw_targets:
            normalized = self.engine.normalize_target(str(raw))
            if not normalized:
                continue
            if self.engine.is_valid_target(normalized):
                normalized_targets.append(normalized)

        accepted = len(normalized_targets)
        if accepted == 0:
            raise ValueError("No valid targets were provided")

        deduped_targets: list[str] = []
        seen: set[str] = set()
        for target in normalized_targets:
            if target in seen:
                continue
            seen.add(target)
            deduped_targets.append(target)

        scan_id = str(uuid.uuid4())
        runtime_options = self._sanitize_options(options or {})

        job = BulkScanJob(
            scan_id=scan_id,
            targets=deduped_targets,
            options=runtime_options,
            progress_total=len(deduped_targets),
        )

        async with self.jobs_lock:
            self._cleanup_old_jobs_locked()
            running_jobs = sum(1 for item in self.jobs.values() if item.state == "running")
            if running_jobs >= self.max_running_jobs:
                raise RuntimeError("Too many bulk scans are currently running")
            self.jobs[scan_id] = job

        await self._emit_event(
            job,
            "progress",
            {
                "scan_id": scan_id,
                "state": job.state,
                "progress": {"done": 0, "total": job.progress_total},
                "stats": job.stats,
                "started_at": job.started_at,
                "updated_at": job.updated_at,
            },
        )

        logger.info(
            self._log_json(
                scan_id=scan_id,
                target=None,
                stage="job_created",
                duration_ms=0,
                error_type=None,
                accepted=accepted,
                deduped=len(deduped_targets),
                options=runtime_options,
            )
        )

        job.task = asyncio.create_task(self._run_job(job), name=f"bulk-scan-{scan_id}")

        return {
            "scan_id": scan_id,
            "accepted": accepted,
            "deduped": len(deduped_targets),
        }

    async def get_status(self, scan_id: str) -> Optional[dict[str, Any]]:
        job = await self._get_job(scan_id)
        if job is None:
            return None

        async with job.lock:
            return self._status_payload(job)

    async def get_results(
        self, scan_id: str, offset: int = 0, limit: int = 200
    ) -> Optional[dict[str, Any]]:
        job = await self._get_job(scan_id)
        if job is None:
            return None

        safe_offset = max(0, offset)
        safe_limit = max(1, min(2000, limit))

        async with job.lock:
            items = job.results[safe_offset : safe_offset + safe_limit]
            return {
                "scan_id": scan_id,
                "offset": safe_offset,
                "limit": safe_limit,
                "total": len(job.results),
                "results": items,
                "state": job.state,
            }

    async def cancel_job(self, scan_id: str) -> Optional[str]:
        job = await self._get_job(scan_id)
        if job is None:
            return None

        async with job.lock:
            if job.state in TERMINAL_STATES:
                return job.state
            job.cancel_event.set()
            job.updated_at = utc_iso()

        await self._emit_event(
            job,
            "cancel_requested",
            {
                "scan_id": scan_id,
                "state": "running",
                "message": "Cancellation requested",
            },
        )
        return "canceling"

    async def iter_events(self, scan_id: str, last_event_id: int = -1):
        job = await self._get_job(scan_id)
        if job is None:
            return

        next_index = max(0, last_event_id + 1)

        while True:
            async with job.lock:
                pending = job.events[next_index:]
                state = job.state

            for event in pending:
                next_index = event["id"] + 1
                yield self._format_sse(event)

            if state in TERMINAL_STATES:
                async with job.lock:
                    if next_index >= len(job.events):
                        break

            try:
                async with job.event_condition:
                    await asyncio.wait_for(job.event_condition.wait(), timeout=15)
            except asyncio.TimeoutError:
                yield "event: ping\ndata: {}\n\n"

    async def _run_job(self, job: BulkScanJob):
        started = time.perf_counter()
        current_concurrency = max(1, min(job.options["max_concurrency"], 200))
        cursor = 0

        try:
            while cursor < len(job.targets):
                if job.cancel_event.is_set():
                    break

                batch_targets = job.targets[cursor : cursor + current_concurrency]
                cursor += len(batch_targets)

                batch_error_count = 0
                batch_timeout_count = 0

                tasks = [
                    asyncio.create_task(self._scan_and_record(job, target))
                    for target in batch_targets
                ]

                for future in asyncio.as_completed(tasks):
                    if job.cancel_event.is_set():
                        break

                    result, duration_ms = await future
                    error_type = ((result.get("error") or {}).get("type")) if not result.get("ok") else None
                    if error_type:
                        batch_error_count += 1
                    if error_type == "timeout":
                        batch_timeout_count += 1

                    logger.info(
                        self._log_json(
                            scan_id=job.scan_id,
                            target=result.get("target"),
                            stage="target_done",
                            duration_ms=duration_ms,
                            error_type=error_type,
                            cached=result.get("cached", False),
                            ok=result.get("ok", False),
                        )
                    )

                if job.cancel_event.is_set():
                    for pending in tasks:
                        if not pending.done():
                            pending.cancel()
                    await asyncio.gather(*tasks, return_exceptions=True)
                    break

                current_concurrency = self._adjust_concurrency(
                    current=current_concurrency,
                    configured_max=job.options["max_concurrency"],
                    batch_size=max(1, len(batch_targets)),
                    error_count=batch_error_count,
                    timeout_count=batch_timeout_count,
                )

            async with job.lock:
                job.updated_at = utc_iso()
                job.metrics["total_duration_ms"] = int((time.perf_counter() - started) * 1000)
                if job.cancel_event.is_set():
                    job.state = "canceled"
                else:
                    job.state = "done"

            final_payload = self._status_payload(job)
            await self._emit_event(job, job.state, final_payload)
            await self._emit_event(job, "done", final_payload)

            logger.info(
                self._log_json(
                    scan_id=job.scan_id,
                    target=None,
                    stage="job_done",
                    duration_ms=job.metrics["total_duration_ms"],
                    error_type=None,
                    state=job.state,
                    stats=job.stats,
                    metrics=job.metrics,
                )
            )
        except Exception as exc:
            async with job.lock:
                job.state = "error"
                job.error_message = str(exc)
                job.updated_at = utc_iso()
                job.metrics["total_duration_ms"] = int((time.perf_counter() - started) * 1000)

            payload = self._status_payload(job)
            await self._emit_event(job, "error", payload)
            logger.exception(
                self._log_json(
                    scan_id=job.scan_id,
                    target=None,
                    stage="job_error",
                    duration_ms=job.metrics["total_duration_ms"],
                    error_type="exception",
                    message=str(exc),
                )
            )

    async def _scan_and_record(
        self, job: BulkScanJob, target: str
    ) -> tuple[dict[str, Any], int]:
        started = time.perf_counter()
        result = await self.engine.scan_target(target, job.options, scan_id=job.scan_id)
        duration_ms = int((time.perf_counter() - started) * 1000)

        if self.persist_result is not None:
            try:
                await self.persist_result(result)
            except Exception as exc:
                logger.warning(
                    self._log_json(
                        scan_id=job.scan_id,
                        target=target,
                        stage="persist_warning",
                        duration_ms=0,
                        error_type="db",
                        message=str(exc),
                    )
                )

        await self._record_result(job, result)
        return result, duration_ms

    async def _record_result(self, job: BulkScanJob, result: dict[str, Any]):
        error_type = (result.get("error") or {}).get("type")

        async with job.lock:
            job.results.append(result)
            job.progress_done += 1
            job.updated_at = utc_iso()

            if result.get("cached"):
                job.stats["cached"] += 1

            if result.get("ok"):
                job.stats["success"] += 1
                job.metrics["success"] += 1
            else:
                job.stats["failed"] += 1
                job.metrics["fail"] += 1

                if error_type == "timeout":
                    job.stats["timeout"] += 1
                    job.metrics["timeout"] += 1
                elif error_type == "dns":
                    job.stats["dns_error"] += 1
                    job.metrics["dns_error"] += 1
                elif error_type == "tls":
                    job.stats["tls_error"] += 1
                    job.metrics["tls_error"] += 1
                elif error_type == "conn":
                    job.stats["conn_error"] += 1
                elif error_type == "invalid":
                    job.stats["invalid_error"] += 1
                else:
                    job.stats["unknown_error"] += 1

            status_payload = self._status_payload(job)

        await self._emit_event(job, "result", result)
        await self._emit_event(job, "progress", status_payload)

    def _adjust_concurrency(
        self,
        current: int,
        configured_max: int,
        batch_size: int,
        error_count: int,
        timeout_count: int,
    ) -> int:
        error_rate = error_count / max(1, batch_size)
        timeout_rate = timeout_count / max(1, batch_size)
        minimum = 10 if configured_max >= 10 else 1

        if error_rate > 0.35 or timeout_rate > 0.20:
            return max(minimum, current - 5)

        if error_rate < 0.10 and timeout_rate < 0.05:
            return min(configured_max, current + 5)

        return current

    async def _emit_event(self, job: BulkScanJob, event_type: str, data: dict[str, Any]):
        async with job.lock:
            event_id = len(job.events)
            event = {
                "id": event_id,
                "type": event_type,
                "data": data,
                "created_at": utc_iso(),
            }
            job.events.append(event)

        async with job.event_condition:
            job.event_condition.notify_all()

    def _format_sse(self, event: dict[str, Any]) -> str:
        payload = json.dumps(event["data"], default=str)
        return f"id: {event['id']}\nevent: {event['type']}\ndata: {payload}\n\n"

    async def _get_job(self, scan_id: str) -> Optional[BulkScanJob]:
        async with self.jobs_lock:
            return self.jobs.get(scan_id)

    def _status_payload(self, job: BulkScanJob) -> dict[str, Any]:
        payload = {
            "scan_id": job.scan_id,
            "state": job.state,
            "progress": {"done": job.progress_done, "total": job.progress_total},
            "stats": job.stats,
            "started_at": job.started_at,
            "updated_at": job.updated_at,
        }
        if job.error_message:
            payload["error"] = job.error_message
        return payload

    def _sanitize_options(self, options: dict[str, Any]) -> dict[str, int]:
        merged = {**DEFAULT_OPTIONS, **(options or {})}
        timeout_ms = self._clamp_int(merged.get("timeout_ms"), 1000, 30000, 5000)

        return {
            "port": self._clamp_int(merged.get("port"), 1, 65535, 443),
            "timeout_ms": timeout_ms,
            "max_concurrency": self._clamp_int(
                merged.get("max_concurrency"), 1, 200, 50
            ),
            "retries": self._clamp_int(merged.get("retries"), 0, 3, 1),
            "cache_ttl_sec": self._clamp_int(
                merged.get("cache_ttl_sec"), 0, 3600, 300
            ),
            "dns_timeout_ms": self._clamp_int(
                merged.get("dns_timeout_ms", max(750, timeout_ms // 2)),
                500,
                timeout_ms,
                max(750, timeout_ms // 2),
            ),
            "connect_timeout_ms": self._clamp_int(
                merged.get("connect_timeout_ms", timeout_ms),
                500,
                45000,
                timeout_ms,
            ),
            "tls_timeout_ms": self._clamp_int(
                merged.get("tls_timeout_ms", timeout_ms),
                500,
                45000,
                timeout_ms,
            ),
        }

    @staticmethod
    def _clamp_int(value: Any, minimum: int, maximum: int, default: int) -> int:
        try:
            numeric = int(value)
        except (TypeError, ValueError):
            return default
        return max(minimum, min(maximum, numeric))

    @staticmethod
    def _log_json(
        scan_id: Optional[str],
        target: Optional[str],
        stage: str,
        duration_ms: int,
        error_type: Optional[str],
        **extra: Any,
    ) -> str:
        payload = {
            "scan_id": scan_id,
            "target": target,
            "stage": stage,
            "duration_ms": duration_ms,
            "error_type": error_type,
        }
        payload.update(extra)
        return json.dumps(payload, default=str)

    def _cleanup_old_jobs_locked(self):
        cutoff = datetime.now(timezone.utc).timestamp() - (60 * 60)
        remove_keys: list[str] = []
        for scan_id, job in self.jobs.items():
            if job.state not in TERMINAL_STATES:
                continue
            updated = datetime.fromisoformat(job.updated_at).timestamp()
            if updated < cutoff:
                remove_keys.append(scan_id)

        for key in remove_keys:
            self.jobs.pop(key, None)