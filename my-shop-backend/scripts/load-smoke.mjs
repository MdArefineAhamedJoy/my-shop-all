import { performance } from "node:perf_hooks";
const base = process.env.API_URL || "http://127.0.0.1:4000";
const requests = Number(process.env.REQUESTS || 100);
const concurrency = Number(process.env.CONCURRENCY || 10);
if (
  !Number.isInteger(requests) ||
  requests < 1 ||
  requests > 150 ||
  !Number.isInteger(concurrency) ||
  concurrency < 1 ||
  concurrency > 30
)
  throw new Error(
    "Use 1–150 requests and 1–30 workers. Higher loads need distributed IPs/appropriate rate limits.",
  );
const times = [];
const statuses = {};
let issued = 0;
const started = performance.now();
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (issued++ < requests) {
      const at = performance.now();
      const response = await fetch(`${base}/v1/products?limit=20`, {
        signal: AbortSignal.timeout(15000),
      });
      await response.arrayBuffer();
      statuses[response.status] = (statuses[response.status] || 0) + 1;
      times.push(performance.now() - at);
    }
  }),
);
times.sort((a, b) => a - b);
const percentile = (n) =>
  Math.round(
    times[Math.min(times.length - 1, Math.ceil(times.length * n) - 1)],
  );
console.log(
  JSON.stringify(
    {
      requests,
      concurrency,
      elapsedMs: Math.round(performance.now() - started),
      statuses,
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      p99Ms: percentile(0.99),
      note: "Local smoke measurement only; dataset, hardware and shared machine load affect these values.",
    },
    null,
    2,
  ),
);
if (Object.keys(statuses).some((s) => s !== "200")) process.exitCode = 1;
