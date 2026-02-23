import asyncio
import copy
import ipaddress
import logging
import re
import socket
import ssl
import time
from datetime import datetime, timezone
from typing import Any, Optional

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID

from models import ScanReport

logger = logging.getLogger("ciphercert.engine")

DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$",
    re.IGNORECASE,
)


class ScanFailure(Exception):
    def __init__(self, error_type: str, message: str):
        super().__init__(message)
        self.error_type = error_type


class CipherEngine:
    def __init__(self):
        self.single_scan_semaphore = asyncio.Semaphore(10)
        self.cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self.cache_lock = asyncio.Lock()

    async def close(self):
        # Kept for API symmetry.
        return None

    @staticmethod
    def normalize_target(raw: str) -> str:
        value = (raw or "").strip().lower()
        if not value:
            return ""

        value = value.replace("https://", "").replace("http://", "")
        value = value.split("/")[0]

        # IPv6 wrapped in []
        if value.startswith("[") and "]" in value:
            value = value[1 : value.index("]")]

        # host:port (not IPv6)
        if value.count(":") == 1:
            host, maybe_port = value.rsplit(":", 1)
            if maybe_port.isdigit():
                value = host

        return value.strip(".")

    @staticmethod
    def is_ip_address(value: str) -> bool:
        try:
            ipaddress.ip_address(value)
            return True
        except ValueError:
            return False

    @classmethod
    def is_valid_target(cls, value: str) -> bool:
        if not value:
            return False
        if cls.is_ip_address(value):
            return True
        return bool(DOMAIN_RE.match(value))

    def _build_runtime_options(self, options: Optional[dict[str, Any]]) -> dict[str, int]:
        incoming = options or {}

        timeout_ms = self._clamp_int(incoming.get("timeout_ms"), 1000, 30000, 5000)
        dns_timeout_ms = self._clamp_int(
            incoming.get("dns_timeout_ms", timeout_ms),
            500,
            timeout_ms,
            max(750, timeout_ms // 2),
        )
        connect_timeout_ms = self._clamp_int(
            incoming.get("connect_timeout_ms", timeout_ms),
            500,
            45000,
            timeout_ms,
        )
        tls_timeout_ms = self._clamp_int(
            incoming.get("tls_timeout_ms", timeout_ms),
            500,
            45000,
            timeout_ms,
        )

        return {
            "port": self._clamp_int(incoming.get("port"), 1, 65535, 443),
            "timeout_ms": timeout_ms,
            "dns_timeout_ms": dns_timeout_ms,
            "connect_timeout_ms": connect_timeout_ms,
            "tls_timeout_ms": tls_timeout_ms,
            "retries": self._clamp_int(incoming.get("retries"), 0, 3, 1),
            "cache_ttl_sec": self._clamp_int(incoming.get("cache_ttl_sec"), 0, 3600, 300),
            "max_concurrency": self._clamp_int(
                incoming.get("max_concurrency"), 1, 200, 50
            ),
        }

    @staticmethod
    def _clamp_int(value: Any, minimum: int, maximum: int, default: int) -> int:
        try:
            numeric = int(value)
        except (TypeError, ValueError):
            return default
        return max(minimum, min(maximum, numeric))

    async def scan_domain(self, domain: str) -> ScanReport:
        """Legacy single-target scan API used by /api/scan."""
        async with self.single_scan_semaphore:
            target = self.normalize_target(domain)
            if not self.is_valid_target(target):
                report = ScanReport(domain=target or domain.strip())
                report.error_msg = "invalid: Invalid domain or IP address"
                report.days_remaining = -1
                report.issuer = "Unknown Authority"
                self._calculate_score(report)
                return report

            result = await self.scan_target(
                target,
                options={
                    "port": 443,
                    "timeout_ms": 7000,
                    "retries": 0,
                    "cache_ttl_sec": 120,
                },
                scan_id="single",
            )
            return self.result_to_report(target, result)

    def result_to_report(self, target: str, result: dict[str, Any]) -> ScanReport:
        report = ScanReport(domain=target)
        report.scan_date = datetime.now()
        report.tls_version = result.get("tls_version", "Unknown")

        if result.get("ok"):
            cert = result.get("cert") or {}
            report.days_remaining = int(cert.get("days_left", 0) or 0)
            report.issuer = cert.get("issuer", "Unknown Authority")
            report.error_msg = None
        else:
            err = result.get("error") or {}
            err_type = err.get("type", "unknown")
            err_message = err.get("message", "Scan failed")
            report.error_msg = f"{err_type}: {err_message}"
            report.days_remaining = -1
            report.issuer = "Unknown Authority"

        self._calculate_score(report)
        return report

    async def scan_target(
        self, target: str, options: Optional[dict[str, Any]] = None, scan_id: str = "bulk"
    ) -> dict[str, Any]:
        opts = self._build_runtime_options(options)
        normalized = self.normalize_target(target)

        if not self.is_valid_target(normalized):
            return {
                "target": normalized or target,
                "ip": None,
                "port": opts["port"],
                "ok": False,
                "cached": False,
                "tls_version": "Unknown",
                "timing_ms": {"dns": 0, "connect": 0, "tls": 0, "total": 0},
                "cert": None,
                "error": {
                    "type": "invalid",
                    "message": "Invalid domain or IP address",
                },
            }

        cache_key = f"{normalized}:{opts['port']}"
        cached_result = await self._get_cached_result(cache_key)
        if cached_result is not None:
            cached = copy.deepcopy(cached_result)
            cached["cached"] = True
            cached["timing_ms"] = {"dns": 0, "connect": 0, "tls": 0, "total": 0}
            return cached

        last_result: dict[str, Any] | None = None
        max_attempts = opts["retries"] + 1

        for attempt in range(max_attempts):
            last_result = await self._scan_target_once(normalized, opts)

            if last_result.get("ok"):
                break

            if not self._should_retry(last_result):
                break

            if attempt < max_attempts - 1:
                backoff = min(1.5, 0.2 * (2**attempt))
                logger.info(
                    "scan_id=%s target=%s stage=retry wait_sec=%.2f reason=%s",
                    scan_id,
                    normalized,
                    backoff,
                    (last_result.get("error") or {}).get("type", "unknown"),
                )
                await asyncio.sleep(backoff)

        assert last_result is not None

        if last_result.get("ok") and opts["cache_ttl_sec"] > 0:
            await self._set_cached_result(cache_key, last_result, opts["cache_ttl_sec"])

        return last_result

    async def _scan_target_once(
        self, target: str, opts: dict[str, int]
    ) -> dict[str, Any]:
        timings: dict[str, int] = {"dns": 0, "connect": 0, "tls": 0, "total": 0}
        overall_start = time.perf_counter()
        resolved_ip: str | None = None

        try:
            resolved_ip, timings["dns"] = await self._resolve_target(
                target, opts["dns_timeout_ms"] / 1000
            )

            connect_ms, tls_ms, cert_obj, tls_version = await self._connect_and_get_certificate(
                target=target,
                ip=resolved_ip,
                port=opts["port"],
                connect_timeout_s=opts["connect_timeout_ms"] / 1000,
                tls_timeout_s=opts["tls_timeout_ms"] / 1000,
            )
            timings["connect"] = connect_ms
            timings["tls"] = tls_ms

            cert_payload = self._build_certificate_payload(cert_obj)

            timings["total"] = int((time.perf_counter() - overall_start) * 1000)
            return {
                "target": target,
                "ip": resolved_ip,
                "port": opts["port"],
                "ok": True,
                "cached": False,
                "tls_version": tls_version,
                "timing_ms": timings,
                "cert": cert_payload,
                "error": None,
            }

        except ScanFailure as err:
            timings["total"] = int((time.perf_counter() - overall_start) * 1000)
            return {
                "target": target,
                "ip": resolved_ip,
                "port": opts["port"],
                "ok": False,
                "cached": False,
                "tls_version": "Unknown",
                "timing_ms": timings,
                "cert": None,
                "error": {"type": err.error_type, "message": str(err)},
            }
        except Exception as err:  # defensive fallback
            timings["total"] = int((time.perf_counter() - overall_start) * 1000)
            return {
                "target": target,
                "ip": resolved_ip,
                "port": opts["port"],
                "ok": False,
                "cached": False,
                "tls_version": "Unknown",
                "timing_ms": timings,
                "cert": None,
                "error": {"type": "unknown", "message": str(err)},
            }

    async def _resolve_target(self, target: str, timeout_s: float) -> tuple[str, int]:
        loop = asyncio.get_running_loop()
        started = time.perf_counter()
        try:
            addr_info = await asyncio.wait_for(
                loop.getaddrinfo(target, None, type=socket.SOCK_STREAM), timeout=timeout_s
            )
        except asyncio.TimeoutError as exc:
            raise ScanFailure("timeout", "DNS resolution timed out") from exc
        except socket.gaierror as exc:
            if exc.errno == socket.EAI_AGAIN:
                raise ScanFailure("dns", "Temporary DNS resolution failure") from exc
            raise ScanFailure("dns", f"DNS resolution failed: {exc}") from exc

        if not addr_info:
            raise ScanFailure("dns", "No DNS records found")

        ip = addr_info[0][4][0]
        duration_ms = int((time.perf_counter() - started) * 1000)
        return ip, duration_ms

    async def _connect_and_get_certificate(
        self,
        target: str,
        ip: str,
        port: int,
        connect_timeout_s: float,
        tls_timeout_s: float,
    ) -> tuple[int, int, x509.Certificate, str]:
        loop = asyncio.get_running_loop()
        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)

        transport: Optional[asyncio.Transport] = None
        tls_transport: Optional[asyncio.Transport] = None

        connect_started = time.perf_counter()
        try:
            try:
                transport, _ = await asyncio.wait_for(
                    loop.create_connection(lambda: protocol, host=ip, port=port),
                    timeout=connect_timeout_s,
                )
            except asyncio.TimeoutError as exc:
                raise ScanFailure("timeout", "TCP connection timed out") from exc
            except ConnectionRefusedError as exc:
                raise ScanFailure("conn", f"Connection refused: {exc}") from exc
            except OSError as exc:
                raise ScanFailure("conn", f"Connection failed: {exc}") from exc

            connect_ms = int((time.perf_counter() - connect_started) * 1000)

            tls_context = ssl.create_default_context()
            tls_context.check_hostname = False
            tls_context.verify_mode = ssl.CERT_NONE
            server_hostname = target if not self.is_ip_address(target) else None

            tls_started = time.perf_counter()
            try:
                tls_transport = await asyncio.wait_for(
                    loop.start_tls(
                        transport,
                        protocol,
                        tls_context,
                        server_side=False,
                        server_hostname=server_hostname,
                    ),
                    timeout=tls_timeout_s,
                )
            except asyncio.TimeoutError as exc:
                raise ScanFailure("timeout", "TLS handshake timed out") from exc
            except ssl.SSLError as exc:
                raise ScanFailure("tls", f"TLS handshake failed: {exc}") from exc
            except OSError as exc:
                raise ScanFailure("conn", f"TLS connection error: {exc}") from exc

            tls_ms = int((time.perf_counter() - tls_started) * 1000)

            ssl_object = tls_transport.get_extra_info("ssl_object")
            if ssl_object is None:
                raise ScanFailure("tls", "No SSL object after handshake")

            cert_bin = ssl_object.getpeercert(binary_form=True)
            if not cert_bin:
                raise ScanFailure("tls", "No peer certificate received")

            try:
                cert_obj = x509.load_der_x509_certificate(cert_bin, default_backend())
            except Exception as exc:  # pragma: no cover
                raise ScanFailure("tls", f"Failed to parse certificate: {exc}") from exc

            tls_version = ssl_object.version() or "Unknown"
            return connect_ms, tls_ms, cert_obj, tls_version
        finally:
            if tls_transport is not None:
                tls_transport.close()
            elif transport is not None:
                transport.close()

    def _build_certificate_payload(self, cert: x509.Certificate) -> dict[str, Any]:
        now_utc = datetime.now(timezone.utc)
        not_before = cert.not_valid_before_utc
        not_after = cert.not_valid_after_utc
        days_left = int((not_after - now_utc).total_seconds() // 86400)

        sans: list[str] = []
        try:
            san_ext = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
            sans = list(san_ext.value.get_values_for_type(x509.DNSName))
        except x509.ExtensionNotFound:
            sans = []

        return {
            "subject": cert.subject.rfc4514_string(),
            "issuer": self._extract_name(cert.issuer),
            "not_before": not_before.isoformat(),
            "not_after": not_after.isoformat(),
            "sans": sans,
            "days_left": days_left,
        }

    @staticmethod
    def _extract_name(name: x509.Name) -> str:
        for oid in (NameOID.ORGANIZATION_NAME, NameOID.COMMON_NAME):
            attrs = name.get_attributes_for_oid(oid)
            if attrs:
                return attrs[0].value
        return "Unknown Authority"

    @staticmethod
    def _should_retry(result: dict[str, Any]) -> bool:
        error = result.get("error") or {}
        error_type = error.get("type", "")
        message = str(error.get("message", "")).lower()

        if error_type in {"timeout", "conn"}:
            return True

        if error_type == "dns" and ("temporary" in message or "again" in message):
            return True

        return False

    async def _get_cached_result(self, cache_key: str) -> Optional[dict[str, Any]]:
        now = time.monotonic()
        async with self.cache_lock:
            item = self.cache.get(cache_key)
            if item is None:
                return None
            expires_at, value = item
            if expires_at <= now:
                self.cache.pop(cache_key, None)
                return None
            return copy.deepcopy(value)

    async def _set_cached_result(
        self, cache_key: str, result: dict[str, Any], ttl_sec: int
    ) -> None:
        expires_at = time.monotonic() + ttl_sec
        to_store = copy.deepcopy(result)
        to_store["cached"] = False
        async with self.cache_lock:
            self.cache[cache_key] = (expires_at, to_store)

    def _calculate_score(self, report: ScanReport):
        score = 100
        days = report.days_remaining if report.days_remaining is not None else -1

        if report.error_msg:
            score = 0
            report.ssl_status = "Error"
        elif days < 0:
            score = 0
            report.ssl_status = "Expired"
        elif days < 7:
            score = 40
            report.ssl_status = "Critical"
        elif days < 30:
            score = 70
            report.ssl_status = "Warning"
        else:
            report.ssl_status = "Secure"

        if report.tls_version in ["TLSv1", "TLSv1.1", "Unknown"]:
            score -= 40

        report.score = max(0, score)

        if report.score >= 90:
            report.grade = "A"
        elif report.score >= 75:
            report.grade = "B"
        elif report.score >= 50:
            report.grade = "C"
        elif report.score >= 30:
            report.grade = "D"
        else:
            report.grade = "F"