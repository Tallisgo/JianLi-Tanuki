"""
任务管理API端点
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.resume import TaskResponse, ErrorResponse
from app.services.task_service import TaskService

router = APIRouter()

@router.get("/", response_model=List[TaskResponse], summary="获取所有任务")
async def get_all_tasks(
    limit: int = Query(100, ge=1, le=1000, description="返回任务数量限制"),
    offset: int = Query(0, ge=0, description="偏移量")
):
    """
    获取所有任务列表
    
    - **limit**: 返回任务数量限制 (1-1000)
    - **offset**: 偏移量，用于分页
    """
    try:
        task_service = TaskService()
        tasks = await task_service.get_all_tasks(limit=limit, offset=offset)
        
        return [
            TaskResponse(
                task_id=task.id,
                filename=task.filename,
                status=task.status,
                progress=task.progress,
                result=task.result.dict() if task.result else None,
                error=task.error,
                created_at=task.created_at.isoformat(),
                updated_at=task.updated_at.isoformat() if task.updated_at else None,
                completed_at=task.completed_at.isoformat() if task.completed_at else None
            )
            for task in tasks
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取任务列表失败: {str(e)}"
        )

@router.get("/{task_id}", response_model=TaskResponse, summary="获取任务详情")
async def get_task(task_id: str):
    """
    根据任务ID获取任务详情
    
    - **task_id**: 任务唯一标识符
    """
    try:
        task_service = TaskService()
        task = await task_service.get_task(task_id)
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="任务不存在"
            )
        
        return TaskResponse(
            task_id=task.id,
            filename=task.filename,
            status=task.status,
            progress=task.progress,
            result=task.result.dict() if task.result else None,
            error=task.error,
            created_at=task.created_at.isoformat(),
            updated_at=task.updated_at.isoformat() if task.updated_at else None,
            completed_at=task.completed_at.isoformat() if task.completed_at else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取任务详情失败: {str(e)}"
        )

@router.delete("/{task_id}", summary="删除任务")
async def delete_task(task_id: str):
    """
    删除指定任务及其相关文件
    
    - **task_id**: 任务唯一标识符
    """
    try:
        task_service = TaskService()
        success = await task_service.delete_task(task_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="任务不存在"
            )
        
        return {"message": "任务删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"删除任务失败: {str(e)}"
        )
