# Bulk Scan Performance Notes

## Goals
- Handle 1000+ targets without UI freeze.
- Keep scans cancelable and observable in real time.
- Improve reliability under DNS/TCP/TLS failures.

## Backend Design
- `POST /api/scan/bulk` creates an async job and returns `scan_id` immediately.
- `GET /api/scan/bulk/{scan_id}/status` returns state, progress, and aggregated stats.
- `GET /api/scan/bulk/{scan_id}/events` streams `result` and `progress` SSE events.
- `GET /api/scan/bulk/{scan_id}/results` supports polling with `offset/limit`.
- `POST /api/scan/bulk/{scan_id}/cancel` marks the job canceled.

### Reliability Controls
- Per-target timeout split:
  - DNS timeout
  - TCP connect timeout
  - TLS handshake timeout
- Retry policy:
  - Retries transient `timeout` / `conn` and temporary DNS errors.
  - Exponential backoff.
- Adaptive batch concurrency:
  - Decreases when timeout/error rate spikes.
  - Increases back toward configured max when stable.
- In-memory TTL cache:
  - Key: `target:port`
  - Value: scan result payload
  - Default TTL: `300s`

### Structured Logging
Each target/job log includes:
- `scan_id`
- `target`
- `stage`
- `duration_ms`
- `error_type`

## Frontend Design
- Pre-validation and dedupe of targets before submission.
- Chunked submission (`500` targets per chunk).
- Streaming-first ingest:
  - SSE for low-latency updates.
  - Polling fallback for Electron/network disconnects.
- Virtualized results table rendering.
- Controls:
  - Cancel active scan.
  - Filter: all/success/failed/expiring.
  - Sort: input order/days left/status.
  - Search by target/issuer/error text.

## Recommended Defaults
- `max_concurrency`: `50` (allow user override in range `10-200`)
- `timeout_ms`: `5000`
- `retries`: `1`
- `cache_ttl_sec`: `300`

## Local Benchmark
Script: `backend/benchmark_bulk_scan.py`

Example:

```bash
python backend/benchmark_bulk_scan.py --targets 1000 --concurrency 25,50,100
```

Optional:

```bash
python backend/benchmark_bulk_scan.py \
  --base-url http://127.0.0.1:8000 \
  --targets 1500 \
  --concurrency 25,50,75,100 \
  --timeout-ms 5000 \
  --retries 1 \
  --cache-ttl-sec 300
```

The script prints elapsed time, throughput, and error/cached counters per run.

## QA Checklist
1. Mixed valid/invalid targets do not crash the job.
2. Very slow/unreachable targets do not block full scan completion.
3. Cancel transitions running scan to `canceled` state quickly.
4. Re-run same target set within TTL shows increased cache hits.
5. UI remains responsive while result count grows past 1000 rows.
