"""
API v1 路由汇总
"""
from fastapi import APIRouter
from app.api.api_v1.endpoints import upload, tasks, health, inspiration, candidates

api_router = APIRouter()

# 注册各个路由
api_router.include_router(health.router, prefix="/health", tags=["健康检查"])
api_router.include_router(upload.router, prefix="/upload", tags=["文件上传"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["任务管理"])
api_router.include_router(candidates.router, prefix="/candidates", tags=["候选人管理"])
api_router.include_router(inspiration.router, prefix="/inspiration", tags=["激励语"])
