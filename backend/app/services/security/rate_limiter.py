"""
🔐 Yasmin Rate Limiter
Advanced rate limiting with Redis backend
"""
import os
import time
import hashlib
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import redis


class RateLimitStrategy(Enum):
    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"


@dataclass
class RateLimitConfig:
    requests: int = 100
    window: int = 60  # seconds
    strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW
    block_duration: int = 300  # seconds to block after exceeded
    key_prefix: str = "ratelimit"


class RateLimiter:
    """Advanced rate limiter with multiple strategies."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_redis()
        return cls._instance

    def _init_redis(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(redis_url, decode_responses=True)

        # Default configs per endpoint type
        self.configs = {
            "default": RateLimitConfig(requests=100, window=60),
            "auth": RateLimitConfig(requests=5, window=300, block_duration=600),
            "api": RateLimitConfig(requests=1000, window=60),
            "upload": RateLimitConfig(requests=10, window=60),
            "search": RateLimitConfig(requests=50, window=60),
            "chat": RateLimitConfig(requests=200, window=60),
            "deploy": RateLimitConfig(requests=5, window=300),
        }

    def _get_key(self, identifier: str, endpoint_type: str = "default") -> str:
        """Generate Redis key for rate limiting."""
        config = self.configs.get(endpoint_type, self.configs["default"])
        return f"{config.key_prefix}:{endpoint_type}:{identifier}"

    def _get_block_key(self, identifier: str, endpoint_type: str = "default") -> str:
        """Generate block key."""
        return f"{self._get_key(identifier, endpoint_type)}:blocked"

    def is_blocked(self, identifier: str, endpoint_type: str = "default") -> Tuple[bool, int]:
        """Check if identifier is blocked."""
        block_key = self._get_block_key(identifier, endpoint_type)
        ttl = self.redis.ttl(block_key)

        if ttl > 0:
            return True, ttl
        return False, 0

    def check_rate_limit(self, identifier: str, endpoint_type: str = "default") -> Tuple[bool, Dict]:
        """Check if request is within rate limit."""
        # Check if blocked
        is_blocked, block_ttl = self.is_blocked(identifier, endpoint_type)
        if is_blocked:
            return False, {
                "allowed": False,
                "blocked": True,
                "retry_after": block_ttl,
                "limit": self.configs.get(endpoint_type, self.configs["default"]).requests,
                "remaining": 0
            }

        config = self.configs.get(endpoint_type, self.configs["default"])
        key = self._get_key(identifier, endpoint_type)
        now = time.time()

        if config.strategy == RateLimitStrategy.SLIDING_WINDOW:
            return self._check_sliding_window(key, identifier, config, now)
        elif config.strategy == RateLimitStrategy.TOKEN_BUCKET:
            return self._check_token_bucket(key, identifier, config, now)
        else:
            return self._check_fixed_window(key, identifier, config, now)

    def _check_sliding_window(self, key: str, identifier: str, config: RateLimitConfig, now: float) -> Tuple[bool, Dict]:
        """Sliding window rate limit."""
        window_start = now - config.window

        # Remove old entries
        self.redis.zremrangebyscore(key, 0, window_start)

        # Count current requests
        current = self.redis.zcard(key)

        if current >= config.requests:
            # Block the identifier
            block_key = self._get_block_key(identifier, "default")
            self.redis.setex(block_key, config.block_duration, "1")

            return False, {
                "allowed": False,
                "limit": config.requests,
                "remaining": 0,
                "reset": int(now + config.window),
                "retry_after": config.block_duration
            }

        # Add current request
        self.redis.zadd(key, {str(now): now})
        self.redis.expire(key, config.window)

        return True, {
            "allowed": True,
            "limit": config.requests,
            "remaining": config.requests - current - 1,
            "reset": int(now + config.window)
        }

    def _check_fixed_window(self, key: str, identifier: str, config: RateLimitConfig, now: float) -> Tuple[bool, Dict]:
        """Fixed window rate limit."""
        window_key = f"{key}:{int(now // config.window)}"
        current = self.redis.incr(window_key)

        if current == 1:
            self.redis.expire(window_key, config.window)

        if current > config.requests:
            block_key = self._get_block_key(identifier, "default")
            self.redis.setex(block_key, config.block_duration, "1")

            return False, {
                "allowed": False,
                "limit": config.requests,
                "remaining": 0,
                "reset": int((int(now // config.window) + 1) * config.window)
            }

        return True, {
            "allowed": True,
            "limit": config.requests,
            "remaining": config.requests - current,
            "reset": int((int(now // config.window) + 1) * config.window)
        }

    def _check_token_bucket(self, key: str, identifier: str, config: RateLimitConfig, now: float) -> Tuple[bool, Dict]:
        """Token bucket rate limit."""
        bucket_key = f"{key}:bucket"
        last_update_key = f"{key}:last_update"

        # Get current state
        tokens = float(self.redis.get(bucket_key) or config.requests)
        last_update = float(self.redis.get(last_update_key) or now)

        # Add tokens based on time passed
        time_passed = now - last_update
        tokens = min(config.requests, tokens + time_passed * (config.requests / config.window))

        if tokens < 1:
            return False, {
                "allowed": False,
                "limit": config.requests,
                "remaining": 0,
                "retry_after": int((1 - tokens) * config.window / config.requests)
            }

        # Consume token
        tokens -= 1
        self.redis.set(bucket_key, tokens)
        self.redis.set(last_update_key, now)
        self.redis.expire(bucket_key, config.window)
        self.redis.expire(last_update_key, config.window)

        return True, {
            "allowed": True,
            "limit": config.requests,
            "remaining": int(tokens)
        }

    def get_rate_limit_headers(self, identifier: str, endpoint_type: str = "default") -> Dict[str, str]:
        """Get rate limit headers for response."""
        allowed, info = self.check_rate_limit(identifier, endpoint_type)
        return {
            "X-RateLimit-Limit": str(info["limit"]),
            "X-RateLimit-Remaining": str(info.get("remaining", 0)),
            "X-RateLimit-Reset": str(info.get("reset", "")),
            "X-RateLimit-Retry-After": str(info.get("retry_after", "")),
        }


rate_limiter = RateLimiter()
