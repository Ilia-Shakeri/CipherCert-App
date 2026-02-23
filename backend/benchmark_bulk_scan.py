import argparse
import asyncio
import statistics
import time
from typing import Any

import httpx

DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_CONCURRENCY_SERIES = [25, 50, 100]
DEFAULT_TARGET_COUNT = 1000

BASE_TARGETS = [
    "google.com",
    "github.com",
    "microsoft.com",
    "cloudflare.com",
    "openai.com",
    "python.org",
    "stackoverflow.com",
    "amazon.com",
    "apple.com",
    "netflix.com",
    "8.8.8.8",
    "1.1.1.1",
]


def build_targets(count: int) -> list[str]:
    targets: list[str] = []
    index = 0
    while len(targets) < count:
        if index < len(BASE_TARGETS):
            targets.append(BASE_TARGETS[index])
        else:
            # Synthetic valid-domain format targets used for load testing.
            targets.append(f"bench-{index}.example.com")
        index += 1
    return targets


async def create_bulk_job(
    client: httpx.AsyncClient,
    targets: list[str],
    *,
    max_concurrency: int,
    timeout_ms: int,
    retries: int,
    cache_ttl_sec: int,
) -> dict[str, Any]:
    response = await client.post(
        "/api/scan/bulk",
        json={
            "targets": targets,
            "options": {
                "port": 443,
                "timeout_ms": timeout_ms,
                "max_concurrency": max_concurrency,
                "retries": retries,
                "cache_ttl_sec": cache_ttl_sec,
            },
        },
    )
    response.raise_for_status()
    return response.json()


async def wait_for_completion(
    client: httpx.AsyncClient, scan_id: str, poll_interval: float
) -> dict[str, Any]:
    while True:
        response = await client.get(f"/api/scan/bulk/{scan_id}/status")
        response.raise_for_status()
        payload = response.json()
        if payload["state"] in {"done", "canceled", "error"}:
            return payload
        await asyncio.sleep(poll_interval)


async def run_benchmark(
    base_url: str,
    targets: list[str],
    concurrency_values: list[int],
    timeout_ms: int,
    retries: int,
    cache_ttl_sec: int,
    poll_interval: float,
):
    timeout = httpx.Timeout(connect=5.0, read=30.0, write=10.0, pool=5.0)
    async with httpx.AsyncClient(base_url=base_url, timeout=timeout) as client:
        rows: list[dict[str, Any]] = []

        for value in concurrency_values:
            print(f"\n[run] max_concurrency={value}, targets={len(targets)}")
            started = time.perf_counter()
            created = await create_bulk_job(
                client,
                targets,
                max_concurrency=value,
                timeout_ms=timeout_ms,
                retries=retries,
                cache_ttl_sec=cache_ttl_sec,
            )
            scan_id = created["scan_id"]
            status = await wait_for_completion(client, scan_id, poll_interval)
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            progress = status["progress"]
            stats = status["stats"]
            total = progress["total"]
            done = progress["done"]
            throughput = (done / max(1, elapsed_ms)) * 1000

            row = {
                "concurrency": value,
                "scan_id": scan_id,
                "elapsed_ms": elapsed_ms,
                "state": status["state"],
                "done": done,
                "total": total,
                "throughput_tps": round(throughput, 2),
                "success": stats.get("success", 0),
                "failed": stats.get("failed", 0),
                "cached": stats.get("cached", 0),
                "timeout": stats.get("timeout", 0),
                "dns_error": stats.get("dns_error", 0),
                "tls_error": stats.get("tls_error", 0),
                "conn_error": stats.get("conn_error", 0),
            }
            rows.append(row)

            print(
                f"  finished state={row['state']} elapsed={elapsed_ms}ms "
                f"throughput={row['throughput_tps']} target/s cached={row['cached']}"
            )

        return rows


def print_summary(rows: list[dict[str, Any]]):
    if not rows:
        print("No benchmark data.")
        return

    print("\n=== Benchmark Summary ===")
    header = (
        "concurrency | elapsed_ms | throughput/s | success | failed | cached | "
        "timeout | dns | tls | conn"
    )
    print(header)
    print("-" * len(header))

    for row in rows:
        print(
            f"{row['concurrency']:>11} | "
            f"{row['elapsed_ms']:>10} | "
            f"{row['throughput_tps']:>12} | "
            f"{row['success']:>7} | "
            f"{row['failed']:>6} | "
            f"{row['cached']:>6} | "
            f"{row['timeout']:>7} | "
            f"{row['dns_error']:>3} | "
            f"{row['tls_error']:>3} | "
            f"{row['conn_error']:>4}"
        )

    elapsed = [row["elapsed_ms"] for row in rows]
    print("\nElapsed ms median:", int(statistics.median(elapsed)))
    print("Best elapsed ms:", min(elapsed))
    print("Worst elapsed ms:", max(elapsed))


def parse_args():
    parser = argparse.ArgumentParser(description="Benchmark /api/scan/bulk performance")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--targets", type=int, default=DEFAULT_TARGET_COUNT)
    parser.add_argument("--concurrency", default="25,50,100")
    parser.add_argument("--timeout-ms", type=int, default=5000)
    parser.add_argument("--retries", type=int, default=1)
    parser.add_argument("--cache-ttl-sec", type=int, default=300)
    parser.add_argument("--poll-interval", type=float, default=0.5)
    return parser.parse_args()


async def main():
    args = parse_args()
    concurrency_values = [
        int(value.strip())
        for value in args.concurrency.split(",")
        if value.strip().isdigit()
    ]
    targets = build_targets(max(1, args.targets))
    rows = await run_benchmark(
        base_url=args.base_url,
        targets=targets,
        concurrency_values=concurrency_values,
        timeout_ms=args.timeout_ms,
        retries=args.retries,
        cache_ttl_sec=args.cache_ttl_sec,
        poll_interval=args.poll_interval,
    )
    print_summary(rows)


if __name__ == "__main__":
    asyncio.run(main())
