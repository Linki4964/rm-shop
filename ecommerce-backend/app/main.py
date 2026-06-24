from contextlib import asynccontextmanager
from urllib.parse import unquote

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.core.database import close_db, get_db, init_db


def contains_path_traversal(candidate: str) -> bool:
    normalized = candidate

    for _ in range(3):
        decoded = unquote(normalized)
        if decoded == normalized:
            break
        normalized = decoded

    normalized = normalized.replace("\\", "/").lower()

    if "\x00" in normalized:
        return True

    segments = [segment for segment in normalized.split("/") if segment]
    if any(segment == "." or segment.startswith("..") for segment in segments):
        return True

    return "/../" in normalized or normalized.startswith("../") or "/./" in normalized


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    await init_db()
    print(get_db.__name__)
    yield
    print("Application shutting down...")
    await close_db()


app = FastAPI(
    title="E-commerce API",
    description="EasyShop backend API",
    version="0.1.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)


@app.middleware("http")
async def block_path_traversal(request: Request, call_next):
    raw_path = request.scope.get("raw_path", b"")
    raw_candidate = raw_path.decode("latin-1", errors="ignore") if isinstance(raw_path, bytes) else str(raw_path)

    if contains_path_traversal(raw_candidate) or contains_path_traversal(request.url.path):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "E-commerce API is running"}
