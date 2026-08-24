from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.api.routers import auth, financial, simulations, war_room, ai, memory, ledger, users, organizations, risk, audit, documents

app = FastAPI(
    title="Financial Time Machine API",
    description="AI Decision Twin for Enterprise Finance - Local-First Architecture",
    version="2.0.0"
)

# Setup CORS enabled origins
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]
if settings.CORS_ORIGINS:
    for origin in settings.CORS_ORIGINS.split(","):
        trimmed = origin.strip()
        if trimmed and trimmed not in cors_origins:
            cors_origins.append(trimmed)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def _get_cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin", "")
    return {
        "Access-Control-Allow-Origin": origin or "http://localhost:5173",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "*",
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

from app.models import Base
from app.core.database import engine

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Financial Time Machine API",
        "version": "2.0.0",
        "ai_engine": "LLaMA 3 (Local-First via Ollama)",
        "deterministic_engine": "Active"
    }
