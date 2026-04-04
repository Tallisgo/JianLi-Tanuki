"""
简历解析后端应用主入口
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.services.database_service import db_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理（替代已弃用的 on_event）"""
    db_service.init_database()
    print(f"{settings.PROJECT_NAME} v{settings.VERSION} 启动成功")
    print(f"API文档: http://localhost:{settings.PORT}/docs")
    yield


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
            "api": settings.API_V1_STR
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
        reload=settings.DEBUG
    )
