from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.api.routers import auth, financial, simulations, war_room, ai, memory, ledger, users, organizations, risk, audit, documents, reconciliation, ml_models

# ---------------------------------------------------------------------------
# Security Headers Middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Injects OWASP-recommended security headers on every response.
    Prevents clickjacking, MIME-sniffing, and cross-site data leakage.
    """
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if settings.API_ENV != "development":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return response


app = FastAPI(
    title="Financial Time Machine API",
    description="AI Decision Twin for Enterprise Finance - Local-First Architecture",
    version="2.0.0",
    # Hide the docs in production
    docs_url="/docs" if settings.API_ENV == "development" else None,
    redoc_url="/redoc" if settings.API_ENV == "development" else None,
)

# Apply security headers on every response
app.add_middleware(SecurityHeadersMiddleware)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
_allowed_dev_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]

cors_origins = list(_allowed_dev_origins)
if settings.CORS_ORIGINS:
    for origin in settings.CORS_ORIGINS.split(","):
        trimmed = origin.strip()
        if trimmed and trimmed not in cors_origins:
            cors_origins.append(trimmed)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    # Only use the regex fallback in development; tighten for production
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?" if settings.API_ENV == "development" else None,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
    expose_headers=["X-Total-Count"],
)


# ---------------------------------------------------------------------------
# CORS headers helper (for error responses before CORS middleware runs)
# ---------------------------------------------------------------------------
def _get_cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin", "")
    allowed = origin if origin in cors_origins else (cors_origins[0] if cors_origins else "*")
    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    }


@app.exception_handler(HTTPException)
async def fastapi_http_exception_handler(request: Request, exc: HTTPException):
    headers = _get_cors_headers(request)
    if exc.headers:
        headers.update(exc.headers)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    headers = _get_cors_headers(request)
    if exc.headers:
        headers.update(exc.headers)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers=_get_cors_headers(request),
    )


@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
        headers=_get_cors_headers(request),
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(financial.router, prefix="/api/data", tags=["data"])
app.include_router(simulations.router, prefix="/api/simulations", tags=["simulations"])
app.include_router(war_room.router, prefix="/api/war-room", tags=["war-room"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(ledger.router, prefix="/api/ledger", tags=["ledger"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(organizations.router, prefix="/api/organizations", tags=["organizations"])
app.include_router(risk.router, prefix="/api/risk", tags=["risk"])
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(reconciliation.router, prefix="/api/reconciliation", tags=["reconciliation"])
app.include_router(ml_models.router, prefix="/api/ml", tags=["ml"])


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
from app.models import Base
from app.core.database import engine


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root_endpoint():
    """Root endpoint welcoming API clients and pointing to docs and frontend."""
    return {
        "service": "Financial Time Machine API",
        "status": "online",
        "version": "2.0.0",
        "frontend_ui": "http://127.0.0.1:5173",
        "api_docs": "/docs" if settings.API_ENV == "development" else "hidden_in_production",
        "health_check": "/api/health"
    }


@app.get("/api/health", include_in_schema=settings.API_ENV == "development")
def health_check():
    """Basic liveness probe — intentionally minimal in production."""
    return {"status": "healthy", "version": "2.0.0"}
