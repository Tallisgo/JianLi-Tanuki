"""
任务管理服务
"""
from typing import List, Optional
from app.models.resume import UploadTask, TaskStatus
from app.services.database_service import db_service
from app.services.file_service import FileService

class TaskService:
    """任务管理服务类"""
    
    def __init__(self):
        self.db_service = db_service
        self.file_service = FileService()
    
    async def create_task(self, task: UploadTask) -> bool:
        """
        创建新任务
        
        Args:
            task: 任务对象
            
        Returns:
            是否创建成功
        """
        return self.db_service.create_task(task)
    
    async def get_task(self, task_id: str) -> Optional[UploadTask]:
        """
        获取任务详情
        
        Args:
            task_id: 任务ID
            
        Returns:
            任务对象
        """
        return self.db_service.get_task(task_id)
    
    async def get_all_tasks(self, limit: int = 100, offset: int = 0) -> List[UploadTask]:
        """
        获取所有任务列表
        
        Args:
            limit: 返回数量限制
            offset: 偏移量
            
        Returns:
            任务列表
        """
        return self.db_service.get_all_tasks(limit=limit, offset=offset)
    
    async def update_task_status(self, task_id: str, status: TaskStatus, 
                                progress: int = None, result=None, error: str = None) -> bool:
        """
        更新任务状态
        
        Args:
            task_id: 任务ID
            status: 新状态
            progress: 进度
            result: 解析结果
            error: 错误信息
            
        Returns:
            是否更新成功
        """
        return self.db_service.update_task_status(task_id, status, progress, result, error)
    
    async def delete_task(self, task_id: str) -> bool:
        """
        删除任务及其相关文件
        
        Args:
            task_id: 任务ID
            
        Returns:
            是否删除成功
        """
        # 获取任务信息
        task = await self.get_task(task_id)
        if not task:
            return False
        
        # 删除文件
        if task.file_path:
            self.file_service.delete_file(task.file_path)
        
        # 删除数据库记录（包括相关的简历信息和候选人记录）
        return self.db_service.delete_task(task_id)
    
    async def get_task_statistics(self) -> dict:
        """
        获取任务统计信息
        
        Returns:
            统计信息字典
        """
        return self.db_service.get_task_statistics()
