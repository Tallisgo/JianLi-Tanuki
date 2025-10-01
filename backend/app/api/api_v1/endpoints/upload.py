"""
文件上传API端点
"""
import os
import uuid
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.core.config import settings
from app.models.resume import UploadResponse, ErrorResponse, UploadTask, TaskStatus
from app.services.file_service import FileService
from app.services.task_service import TaskService
from app.services.resume_service import ResumeService

router = APIRouter()

@router.post("/", response_model=UploadResponse, summary="上传简历文件")
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="简历文件")
):
    """
    上传简历文件并开始解析
    
    支持的文件格式：
    - PDF文档 (.pdf)
    - Word文档 (.doc, .docx)
    - 图片文件 (.jpg, .jpeg, .png)
    
    文件大小限制：10MB
    """
    # 验证文件类型
    if file.content_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file.content_type}。支持的类型: {', '.join(settings.ALLOWED_FILE_TYPES)}"
        )
    
    # 验证文件大小
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超过限制。最大允许: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # 生成唯一任务ID
        task_id = str(uuid.uuid4())
        
        # 保存文件
        file_service = FileService()
        file_path = await file_service.save_upload_file(file, task_id)
        
        # 创建任务记录
        task_service = TaskService()
        task = UploadTask(
            id=task_id,
            filename=file.filename,
            file_path=file_path,
            file_size=file.size,
            file_type=file.content_type,
            status=TaskStatus.UPLOADED
        )
        
        await task_service.create_task(task)
        
        # 后台处理文件解析
        resume_service = ResumeService()
        background_tasks.add_task(resume_service.process_resume, task_id)
        
        return UploadResponse(
            task_id=task_id,
            filename=file.filename,
            status=task.status,
            message="文件上传成功，开始解析..."
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"文件上传失败: {str(e)}"
        )

@router.get("/download/{task_id}", summary="下载简历文件")
async def download_resume(task_id: str):
    """
    下载指定任务的简历文件
    
    - **task_id**: 任务唯一标识符
    """
    try:
        # 获取任务信息
        task_service = TaskService()
        task = await task_service.get_task(task_id)
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="任务不存在"
            )
        
        # 检查文件是否存在
        if not os.path.exists(task.file_path):
            raise HTTPException(
                status_code=404,
                detail="文件不存在"
            )
        
        # 返回文件
        return FileResponse(
            path=task.file_path,
            filename=task.filename,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"文件下载失败: {str(e)}"
        )
