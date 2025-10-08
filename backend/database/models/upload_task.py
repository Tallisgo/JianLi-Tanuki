"""
上传任务模型
"""
from datetime import datetime
from typing import Optional, Dict, Any
from database.models.base import BaseModel
from app.models.resume import TaskStatus

class UploadTaskModel(BaseModel):
    """上传任务数据库模型"""
    
    def __init__(self, 
                 id: str,
                 filename: str,
                 file_path: str,
                 file_size: Optional[int] = None,
                 file_type: Optional[str] = None,
                 status: str = TaskStatus.UPLOADED,
                 progress: int = 0,
                 result: Optional[str] = None,
                 error: Optional[str] = None,
                 created_at: Optional[datetime] = None,
                 updated_at: Optional[datetime] = None,
                 completed_at: Optional[datetime] = None,
                 **kwargs):
        super().__init__(**kwargs)
        self.id = id
        self.filename = filename
        self.file_path = file_path
        self.file_size = file_size
        self.file_type = file_type
        self.status = status
        self.progress = progress
        self.result = result
        self.error = error
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at
        self.completed_at = completed_at
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "filename": self.filename,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "file_type": self.file_type,
            "status": self.status,
            "progress": self.progress,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UploadTaskModel':
        """从字典创建实例"""
        # 处理时间字段
        created_at = None
        if data.get("created_at"):
            if isinstance(data["created_at"], str):
                created_at = datetime.fromisoformat(data["created_at"])
            else:
                created_at = data["created_at"]
        
        updated_at = None
        if data.get("updated_at"):
            if isinstance(data["updated_at"], str):
                updated_at = datetime.fromisoformat(data["updated_at"])
            else:
                updated_at = data["updated_at"]
        
        completed_at = None
        if data.get("completed_at"):
            if isinstance(data["completed_at"], str):
                completed_at = datetime.fromisoformat(data["completed_at"])
            else:
                completed_at = data["completed_at"]
        
        return cls(
            id=data["id"],
            filename=data["filename"],
            file_path=data["file_path"],
            file_size=data.get("file_size"),
            file_type=data.get("file_type"),
            status=data.get("status", TaskStatus.UPLOADED),
            progress=data.get("progress", 0),
            result=data.get("result"),
            error=data.get("error"),
            created_at=created_at,
            updated_at=updated_at,
            completed_at=completed_at
        )
    
    def to_tuple(self) -> tuple:
        """转换为元组（用于数据库插入）"""
        return (
            self.id,
            self.filename,
            self.file_path,
            self.file_size,
            self.file_type,
            self.status,
            self.progress,
            self.result,
            self.error,
            self.created_at.isoformat(),
            self.updated_at.isoformat() if self.updated_at else None,
            self.completed_at.isoformat() if self.completed_at else None
        )
    
    @classmethod
    def from_row(cls, row) -> 'UploadTaskModel':
        """从数据库行创建实例"""
        return cls(
            id=row["id"],
            filename=row["filename"],
            file_path=row["file_path"],
            file_size=row["file_size"],
            file_type=row["file_type"],
            status=row["status"],
            progress=row["progress"],
            result=row["result"],
            error=row["error"],
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else None,
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else None,
            completed_at=datetime.fromisoformat(row["completed_at"]) if row["completed_at"] else None
        )
    
    def update_status(self, status: str, progress: int = None, 
                     result: str = None, error: str = None):
        """更新任务状态"""
        self.status = status
        if progress is not None:
            self.progress = progress
        if result is not None:
            self.result = result
        if error is not None:
            self.error = error
        
        self.updated_at = datetime.now()
        
        if status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
            self.completed_at = datetime.now()
