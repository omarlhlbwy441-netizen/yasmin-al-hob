"""
🛡️ Middleware Setup
"""
from fastapi import FastAPI
from app.services.i18n.middleware import I18nMiddleware
from app.services.security.csp import CSPMiddleware


def setup_middleware(app: FastAPI):
    """Setup all middleware."""
    app.add_middleware(I18nMiddleware)
    app.add_middleware(CSPMiddleware)
