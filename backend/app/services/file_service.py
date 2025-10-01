"""
文件处理服务
"""
import os
import shutil
from typing import Optional
from fastapi import UploadFile
from app.core.config import settings

class FileService:
    """文件处理服务类"""
    
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.ensure_upload_dir()
    
    def ensure_upload_dir(self):
        """确保上传目录存在"""
        os.makedirs(self.upload_dir, exist_ok=True)
    
    async def save_upload_file(self, file: UploadFile, task_id: str) -> str:
        """
        保存上传的文件
        
        Args:
            file: 上传的文件对象
            task_id: 任务ID
            
        Returns:
            保存后的文件路径
        """
        # 获取文件扩展名
        file_extension = os.path.splitext(file.filename)[1]
        saved_filename = f"{task_id}{file_extension}"
        file_path = os.path.join(self.upload_dir, saved_filename)
        
        # 保存文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path
    
    def delete_file(self, file_path: str) -> bool:
        """
        删除文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            是否删除成功
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"删除文件失败: {e}")
            return False
    
    def get_file_size(self, file_path: str) -> Optional[int]:
        """
        获取文件大小
        
        Args:
            file_path: 文件路径
            
        Returns:
            文件大小（字节）
        """
        try:
            if os.path.exists(file_path):
                return os.path.getsize(file_path)
            return None
        except Exception as e:
            print(f"获取文件大小失败: {e}")
            return None
    
    def validate_file_type(self, content_type: str) -> bool:
        """
        验证文件类型
        
        Args:
            content_type: 文件MIME类型
            
        Returns:
            是否为支持的文件类型
        """
        return content_type in settings.ALLOWED_FILE_TYPES
    
    def validate_file_size(self, file_size: int) -> bool:
        """
        验证文件大小
        
        Args:
            file_size: 文件大小（字节）
            
        Returns:
            是否在允许的大小范围内
        """
        return file_size <= settings.MAX_FILE_SIZE
