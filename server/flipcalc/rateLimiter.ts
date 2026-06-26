import type { RateLimitResult, RateLimiter } from './types'

interface Bucket {
  count: number
  resetAt: number
}

export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>()

  constructor(private readonly maxBuckets = 2_000) {}

  check(key: string, limit: number, windowMs: number, nowMs: number): RateLimitResult {
    this.cleanup(nowMs)

    const bucket = this.buckets.get(key)

    if (bucket === undefined || bucket.resetAt <= nowMs) {
      this.setBucket(key, { count: 1, resetAt: nowMs + windowMs })

      return { allowed: true }
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - nowMs) / 1000))
      }
    }

    bucket.count += 1
    this.buckets.set(key, bucket)

    return { allowed: true }
  }

  private setBucket(key: string, bucket: Bucket) {
    if (this.buckets.size >= this.maxBuckets) {
      const oldestKey = this.buckets.keys().next().value as string | undefined

      if (oldestKey !== undefined) {
        this.buckets.delete(oldestKey)
      }
    }

    this.buckets.set(key, bucket)
  }

  private cleanup(nowMs: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= nowMs) {
        this.buckets.delete(key)
      }
    }
  }
}
