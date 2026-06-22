"""
🔒 Content Security Policy Middleware
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class CSPMiddleware(BaseHTTPMiddleware):
    """Content Security Policy middleware."""

    def __init__(self, app, policy: dict = None):
        super().__init__(app)
        self.policy = policy or {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
            "img-src": ["'self'", "data:", "blob:", "https:"],
            "connect-src": ["'self'", "https://api.yasmin.ai", "wss://ws.yasmin.ai"],
            "media-src": ["'self'", "blob:", "https:"],
            "frame-src": ["'self'"],
            "worker-src": ["'self'", "blob:"],
            "manifest-src": ["'self'"],
            "base-uri": ["'self'"],
            "form-action": ["'self'"],
        }

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Build CSP header
        csp = "; ".join(
            f"{key} {' '.join(values)}"
            for key, values in self.policy.items()
        )

        response.headers["Content-Security-Policy"] = csp
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        return response
