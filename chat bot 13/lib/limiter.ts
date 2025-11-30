
const WINDOW_MS = 60_000; // 1 min
const MAX_REQ = 30;
const buckets = new Map<string, number[]>();

export function rateLimitCheck(ip = "unknown") {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const arr = buckets.get(ip) || [];
  const recent = arr.filter((t) => t > windowStart);
  recent.push(now);
  buckets.set(ip, recent);
  const remaining = Math.max(0, MAX_REQ - recent.length);
  return { allowed: recent.length <= MAX_REQ, remaining };
}
