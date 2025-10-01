"""
简历解析后端应用主入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.core.database import init_db

def create_app() -> FastAPI:
    """创建FastAPI应用实例"""
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="智能简历解析系统后端API",
        openapi_url="/openapi.json"
    )
    
    # 配置CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 添加根路径
    @app.get("/")
    async def root():
        return {
            "message": "简历解析系统API服务运行中",
            "version": settings.VERSION,
            "docs": "/docs",
            "api": settings.API_V1_STR
        }
    
    # 注册API路由
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    # 初始化数据库
    @app.on_event("startup")
    async def startup_event():
        """应用启动时初始化"""
        init_db()
        print(f"🚀 {settings.PROJECT_NAME} v{settings.VERSION} 启动成功")
        print(f"📊 API文档: http://localhost:{settings.PORT}/docs")
    
    return app

# 创建应用实例
app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
