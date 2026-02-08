import asyncio
import ssl
import socket
import httpx
from datetime import datetime, timezone
from cryptography import x509
from cryptography.hazmat.backends import default_backend
# --- تغییر مهم: حذف app. ---
from models import ScanReport 

class CipherEngine:
    def __init__(self):
        # Limit concurrency to avoid blocking network
        self.semaphore = asyncio.Semaphore(10)
        self.http_client = httpx.AsyncClient(verify=False, timeout=10.0)

    async def close(self):
        await self.http_client.aclose()

    async def scan_domain(self, domain: str) -> ScanReport:
        """
        Performs a full SSL and HTTP Audit on a single domain.
        """
        async with self.semaphore:
            # Clean domain input
            clean_domain = domain.strip().replace("https://", "").replace("http://", "").split("/")[0]
            report = ScanReport(domain=clean_domain)

            try:
                # Run SSL and HTTP checks concurrently
                ssl_data, http_status = await asyncio.gather(
                    self._get_ssl_details(clean_domain),
                    self._check_http_status(clean_domain),
                    return_exceptions=True
                )

                # Process SSL Data
                if isinstance(ssl_data, dict):
                    if "error_msg" in ssl_data:
                         report.error_msg = ssl_data["error_msg"]
                         report.ssl_status = "Connection Failed"
                    else:
                        for key, value in ssl_data.items():
                            if hasattr(report, key):
                                setattr(report, key, value)
                elif isinstance(ssl_data, Exception):
                    report.error_msg = str(ssl_data)

                # Process HTTP Status
                if isinstance(http_status, int):
                    # We can add a field for http_status code in models later if needed
                    pass

                # Scoring Logic
                self._calculate_score(report)

            except Exception as e:
                report.error_msg = f"Fatal Engine Error: {str(e)}"
                report.grade = "F"
                report.score = 0

            return report

    async def _get_ssl_details(self, domain: str) -> dict:
        """Low-level socket connection to retrieve Certificate."""
        data = {}
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE  # Inspect even bad certs

        try:
            # Connect with timeout
            conn = asyncio.open_connection(domain, 443, ssl=ctx)
            reader, writer = await asyncio.wait_for(conn, timeout=7.0)

            try:
                # 1. Get Socket Info
                ssock = writer.get_extra_info('ssl_object')
                if not ssock:
                    raise Exception("No SSL object found")

                cert_bin = ssock.getpeercert(binary_form=True)
                if not cert_bin:
                    raise Exception("No certificate found")

                data['tls_version'] = ssock.version()
                cipher = ssock.cipher()
                # data['cipher_suite'] = cipher[0] # Optional: Add to model if you want

                # 2. Parse Certificate
                cert = x509.load_der_x509_certificate(cert_bin, default_backend())

                # Expiry Calculation (UTC Awareness Fix)
                expiry = cert.not_valid_after_utc
                now_utc = datetime.now(timezone.utc)

                # Convert to naive for SQLite storage if needed, or keep aware
                data['expiry_date'] = expiry.replace(tzinfo=None)

                days_left = (expiry - now_utc).days
                data['days_remaining'] = days_left

                # Issuer extraction
                try:
                    subject = cert.subject.rfc4514_string()
                    data['issuer'] = subject.split(",")[0].replace("CN=", "")
                    ca_name = cert.issuer.rfc4514_string()
                    if "O=" in ca_name:
                         parts = ca_name.split(",")
                         for p in parts:
                             if p.startswith("O="):
                                 data['issuer'] = p.replace("O=", "")
                                 break
                except:
                    data['issuer'] = "Unknown Authority"

            finally:
                writer.close()
                try:
                    await writer.wait_closed()
                except:
                    pass

        except Exception as e:
            return {"error_msg": str(e)}

        return data

    async def _check_http_status(self, domain: str):
        try:
            resp = await self.http_client.get(f"https://{domain}", follow_redirects=True)
            return resp.status_code
        except:
            return 0

    def _calculate_score(self, report: ScanReport):
        score = 100
        days = report.days_remaining

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

        # Downgrade for old TLS
        if report.tls_version in ['TLSv1', 'TLSv1.1', 'Unknown']:
            score -= 40

        report.score = max(0, score)

        # Assign Grade
        if report.score >= 90: report.grade = "A"
        elif report.score >= 75: report.grade = "B"
        elif report.score >= 50: report.grade = "C"
        elif report.score >= 30: report.grade = "D"
        else: report.grade = "F"