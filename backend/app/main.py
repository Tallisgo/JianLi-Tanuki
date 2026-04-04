"""
简历解析后端应用主入口
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.api.api_v1.api import api_router
from app.services.database_service import db_service

logger = logging.getLogger(__name__)


def _ensure_data_dirs():
    """确保 DATA_DIR 下的子目录都存在"""
    for sub in ("db", "uploads", "logs"):
        os.makedirs(os.path.join(settings.DATA_DIR, sub), exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    _ensure_data_dirs()
    setup_logging()
    db_service.init_database()
    logger.info(
        "%s v%s 启动成功 | API文档: http://localhost:%s/docs",
        settings.PROJECT_NAME, settings.VERSION, settings.PORT,
    )
    yield
    logger.info("应用关闭")


def create_app() -> FastAPI:
    """创建FastAPI应用实例"""

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="智能简历解析系统后端API",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )

    @app.get("/")
    async def root():
        return {
            "message": "简历解析系统API服务运行中",
            "version": settings.VERSION,
            "docs": "/docs",
            "api": settings.API_V1_STR,
        }

    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )
