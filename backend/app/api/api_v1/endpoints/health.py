"""
健康检查API端点
"""
from fastapi import APIRouter
from app.models.resume import ErrorResponse

router = APIRouter()

@router.get("/", summary="健康检查")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "message": "简历解析系统运行正常",
        "timestamp": "2024-01-01T00:00:00Z"
    }

@router.get("/ping", summary="Ping测试")
async def ping():
    """简单的ping测试"""
    return {"message": "pong"}
