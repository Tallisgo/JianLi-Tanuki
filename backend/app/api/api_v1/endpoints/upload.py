"""
文件上传API端点
"""
import logging
import os
import uuid
from typing import Optional
from urllib.parse import quote
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Query, Form
from fastapi.responses import Response
from app.core.config import settings
from app.models.resume import UploadResponse, UploadTask, TaskStatus
from app.services.file_service import FileService
from app.services.task_service import TaskService
from app.services.resume_service import ResumeService
from app.services.database_service import db_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=UploadResponse, summary="上传简历文件")
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="简历文件"),
    force_update: bool = Query(False, description="是否强制更新已存在的候选人"),
    category: Optional[str] = Form(None, description="职位分类")
):
    """
    上传简历文件并开始解析
    
    支持的文件格式：
    - PDF文档 (.pdf)
    - Word文档 (.doc, .docx)
    - 图片文件 (.jpg, .jpeg, .png)
    
    文件大小限制：10MB
    
    参数：
    - force_update: 如果候选人已存在，是否强制更新
    """
    # 验证文件类型
    if file.content_type not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file.content_type}。支持的类型: {', '.join(settings.allowed_file_types_list)}"
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
            status=TaskStatus.UPLOADED,
            category=category
        )

        await task_service.create_task(task)

        # 后台处理文件解析，传递force_update和category参数
        resume_service = ResumeService()
        background_tasks.add_task(resume_service.process_resume, task_id, force_update, category)
        
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


@router.post("/check-duplicate", summary="检查候选人是否已存在")
async def check_duplicate(
    name: str = Query(..., description="候选人姓名"),
    phone: str = Query(None, description="电话号码"),
    email: str = Query(None, description="邮箱地址")
):
    """
    检查候选人是否已存在
    
    返回匹配的候选人列表，前端可据此决定是否更新
    """
    try:
        duplicates = db_service.candidate_repo.find_duplicates(name, phone, email)
        
        if duplicates:
            return {
                "exists": True,
                "candidates": [
                    {
                        "id": c.id,
                        "name": c.name,
                        "phone": c.phone,
                        "email": c.email,
                        "position": c.position,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                        "updated_at": c.updated_at.isoformat() if c.updated_at else None
                    }
                    for c in duplicates
                ]
            }
        else:
            return {"exists": False, "candidates": []}
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"检查候选人失败: {str(e)}"
        )


@router.get("/download/{task_id}", summary="下载简历文件")
async def download_resume(task_id: str):
    """
    下载指定任务的简历文件
    
    - **task_id**: 任务唯一标识符
    
    文件名将使用候选人姓名（如果有的话）
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
        
        # 尝试获取候选人姓名作为文件名
        candidate = db_service.get_candidate_by_task_id(task_id)
        logger.debug(f"下载请求 task_id={task_id}, 候选人={candidate.name if candidate else 'None'}")
        
        # 获取原始文件扩展名
        original_filename = task.filename or "resume"
        file_extension = os.path.splitext(original_filename)[1] or ".pdf"
        
        # 构建下载文件名
        if candidate and candidate.name:
            # 使用候选人姓名
            download_filename = f"{candidate.name}_简历{file_extension}"
            logger.info(f"使用候选人姓名作为文件名: {download_filename}")
        else:
            # 使用原始文件名
            download_filename = original_filename
            logger.warning(f"未找到候选人，使用原始文件名: {download_filename}")
        
        # 读取文件内容
        with open(task.file_path, 'rb') as f:
            file_content = f.read()
        
        # 正确编码文件名以支持中文
        # RFC 5987 编码方式
        encoded_filename = quote(download_filename, safe='')
        
        # 生成 ASCII 安全的后备文件名（用于不支持 filename* 的老客户端）
        ascii_filename = f"resume{file_extension}"
        
        # 确定媒体类型
        media_type = task.file_type or 'application/octet-stream'
        
        # 创建响应
        response = Response(
            content=file_content,
            media_type=media_type
        )
        
        # 设置Content-Disposition头
        # filename 使用 ASCII 安全的名称，filename* 使用 UTF-8 编码的中文名称
        response.headers["Content-Disposition"] = (
            f"attachment; filename=\"{ascii_filename}\"; "
            f"filename*=UTF-8''{encoded_filename}"
        )
        
        logger.debug(f"文件下载响应: ascii={ascii_filename}, utf8={download_filename}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"文件下载失败: {str(e)}"
        )


@router.put("/update/{candidate_id}", summary="更新已存在候选人的简历")
async def update_candidate_resume(
    candidate_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="新的简历文件")
):
    """
    更新已存在候选人的简历
    
    - **candidate_id**: 要更新的候选人ID
    - **file**: 新的简历文件
    """
    # 验证文件类型
    if file.content_type not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file.content_type}"
        )
    
    # 验证文件大小
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超过限制"
        )
    
    # 检查候选人是否存在
    candidate = db_service.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="候选人不存在"
        )
    
    try:
        # 生成新的任务ID
        task_id = str(uuid.uuid4())
        
        # 保存新文件
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
        
        # 后台处理，指定要更新的候选人ID
        resume_service = ResumeService()
        background_tasks.add_task(
            resume_service.process_resume_update, 
            task_id, 
            candidate_id
        )
        
        return {
            "task_id": task_id,
            "candidate_id": candidate_id,
            "filename": file.filename,
            "status": task.status.value,
            "message": f"文件上传成功，正在更新候选人 {candidate.name} 的简历..."
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"更新简历失败: {str(e)}"
        )
