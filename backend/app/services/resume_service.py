"""
简历解析服务
"""
import asyncio
from app.models.resume import UploadTask, TaskStatus, ResumeInfo
from app.services.task_service import TaskService
from app.utils.resume_parser import ResumeParser

class ResumeService:
    """简历解析服务类"""
    
    def __init__(self):
        self.task_service = TaskService()
        self.parser = ResumeParser()
    
    async def process_resume(self, task_id: str):
        """
        处理简历解析任务
        
        Args:
            task_id: 任务ID
        """
        try:
            # 获取任务信息
            task = await self.task_service.get_task(task_id)
            if not task:
                print(f"任务不存在: {task_id}")
                return
            
            # 更新状态为解析中
            await self.task_service.update_task_status(
                task_id, TaskStatus.PARSING, progress=0
            )
            
            print(f"开始解析任务: {task_id}")
            
            # 解析文件
            result = await self.parser.parse_file(task.file_path)

            print(result)
            
            # 更新任务状态为完成
            await self.task_service.update_task_status(
                task_id, TaskStatus.COMPLETED, progress=100, result=result
            )
            
            print(f"任务解析完成: {task_id}")
            
        except Exception as e:
            print(f"任务解析失败 {task_id}: {e}")
            
            # 更新任务状态为失败
            await self.task_service.update_task_status(
                task_id, TaskStatus.FAILED, error=str(e)
            )
