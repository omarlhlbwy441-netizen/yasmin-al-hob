"""
FastAPI i18n Middleware
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class I18nMiddleware(BaseHTTPMiddleware):
    """Middleware to detect and set language from request headers."""

    async def dispatch(self, request: Request, call_next):
        accept_lang = request.headers.get("Accept-Language", "en")
        lang = accept_lang.split(",")[0].split(";")[0].strip().lower()

        supported = {"ar", "en", "fr", "es", "de", "tr", "fa", "ur", "zh", "ja", "ko", "ru"}
        if lang not in supported:
            lang = "en"

        request.state.lang = lang
        response = await call_next(request)
        response.headers["Content-Language"] = lang
        return response
