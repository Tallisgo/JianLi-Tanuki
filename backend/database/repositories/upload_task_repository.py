"""
上传任务数据访问层
"""
from typing import List, Optional, Dict, Any
from database.repositories.base_repository import BaseRepository
from database.models.upload_task import UploadTaskModel
from app.models.resume import TaskStatus

class UploadTaskRepository(BaseRepository[UploadTaskModel]):
    """上传任务数据访问层"""
    
    def __init__(self):
        super().__init__(UploadTaskModel)
        self.table_name = "upload_tasks"
    
    def create(self, model: UploadTaskModel) -> bool:
        """创建任务记录"""
        sql = f"""
        INSERT INTO {self.table_name} 
        (id, filename, file_path, file_size, file_type, status, progress, result, error, created_at, updated_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        try:
            self.connection.execute_update(sql, model.to_tuple())
            return True
        except Exception as e:
            print(f"创建任务失败: {e}")
            return False
    
    def get_by_id(self, id: str) -> Optional[UploadTaskModel]:
        """根据ID获取任务"""
        sql = f"SELECT * FROM {self.table_name} WHERE id = ?"
        try:
            rows = self.connection.execute_query(sql, (id,))
            if rows:
                return UploadTaskModel.from_row(rows[0])
            return None
        except Exception as e:
            print(f"获取任务失败: {e}")
            return None
    
    def get_all(self, limit: int = 100, offset: int = 0) -> List[UploadTaskModel]:
        """获取所有任务"""
        sql = f"""
        SELECT * FROM {self.table_name} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
        """
        try:
            rows = self.connection.execute_query(sql, (limit, offset))
            return [UploadTaskModel.from_row(row) for row in rows]
        except Exception as e:
            print(f"获取任务列表失败: {e}")
            return []
    
    def update(self, model: UploadTaskModel) -> bool:
        """更新任务"""
        sql = f"""
        UPDATE {self.table_name} 
        SET filename = ?, file_path = ?, file_size = ?, file_type = ?, 
            status = ?, progress = ?, result = ?, error = ?, 
            updated_at = ?, completed_at = ?
        WHERE id = ?
        """
        try:
            params = (
                model.filename, model.file_path, model.file_size, model.file_type,
                model.status, model.progress, model.result, model.error,
                model.updated_at.isoformat() if model.updated_at else None,
                model.completed_at.isoformat() if model.completed_at else None,
                model.id
            )
            affected_rows = self.connection.execute_update(sql, params)
            return affected_rows > 0
        except Exception as e:
            print(f"更新任务失败: {e}")
            return False
    
    def delete(self, id: str) -> bool:
        """删除任务"""
        sql = f"DELETE FROM {self.table_name} WHERE id = ?"
        try:
            affected_rows = self.connection.execute_update(sql, (id,))
            return affected_rows > 0
        except Exception as e:
            print(f"删除任务失败: {e}")
            return False
    
    def count(self) -> int:
        """获取任务总数"""
        sql = f"SELECT COUNT(*) as count FROM {self.table_name}"
        try:
            rows = self.connection.execute_query(sql)
            return rows[0]["count"] if rows else 0
        except Exception as e:
            print(f"获取任务总数失败: {e}")
            return 0
    
    def search(self, filters: Dict[str, Any], limit: int = 100, offset: int = 0) -> List[UploadTaskModel]:
        """搜索任务"""
        where_conditions = []
        params = []
        
        if filters.get("status"):
            where_conditions.append("status = ?")
            params.append(filters["status"])
        
        if filters.get("filename"):
            where_conditions.append("filename LIKE ?")
            params.append(f"%{filters['filename']}%")
        
        if filters.get("file_type"):
            where_conditions.append("file_type = ?")
            params.append(filters["file_type"])
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        sql = f"""
        SELECT * FROM {self.table_name} 
        {where_clause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        try:
            rows = self.connection.execute_query(sql, tuple(params))
            return [UploadTaskModel.from_row(row) for row in rows]
        except Exception as e:
            print(f"搜索任务失败: {e}")
            return []
    
    def get_by_status(self, status: TaskStatus, limit: int = 100, offset: int = 0) -> List[UploadTaskModel]:
        """根据状态获取任务"""
        return self.search({"status": status.value}, limit, offset)
    
    def get_completed_tasks(self, limit: int = 100, offset: int = 0) -> List[UploadTaskModel]:
        """获取已完成的任务"""
        return self.get_by_status(TaskStatus.COMPLETED, limit, offset)
    
    def get_failed_tasks(self, limit: int = 100, offset: int = 0) -> List[UploadTaskModel]:
        """获取失败的任务"""
        return self.get_by_status(TaskStatus.FAILED, limit, offset)
    
    def get_processing_tasks(self, limit: int = 100, offset: int = 0) -> List[UploadTaskModel]:
        """获取处理中的任务"""
        sql = f"""
        SELECT * FROM {self.table_name} 
        WHERE status IN (?, ?)
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
        """
        try:
            rows = self.connection.execute_query(sql, (
                TaskStatus.UPLOADED.value, 
                TaskStatus.PARSING.value, 
                limit, 
                offset
            ))
            return [UploadTaskModel.from_row(row) for row in rows]
        except Exception as e:
            print(f"获取处理中任务失败: {e}")
            return []
    
    def update_status(self, id: str, status: TaskStatus, progress: int = None, 
                     result: str = None, error: str = None) -> bool:
        """更新任务状态"""
        task = self.get_by_id(id)
        if not task:
            return False
        
        task.update_status(status.value, progress, result, error)
        return self.update(task)
    
    def get_statistics(self) -> Dict[str, int]:
        """获取任务统计信息"""
        sql = f"""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END) as processing
        FROM {self.table_name}
        """
        try:
            rows = self.connection.execute_query(sql, (
                TaskStatus.COMPLETED.value,
                TaskStatus.FAILED.value,
                TaskStatus.UPLOADED.value,
                TaskStatus.PARSING.value
            ))
            
            if rows:
                row = rows[0]
                total = row["total"] or 0
                completed = row["completed"] or 0
                failed = row["failed"] or 0
                processing = row["processing"] or 0
                
                return {
                    "total": total,
                    "completed": completed,
                    "failed": failed,
                    "processing": processing,
                    "success_rate": round(completed / total * 100, 2) if total > 0 else 0
                }
            
            return {"total": 0, "completed": 0, "failed": 0, "processing": 0, "success_rate": 0}
            
        except Exception as e:
            print(f"获取任务统计失败: {e}")
            return {"total": 0, "completed": 0, "failed": 0, "processing": 0, "success_rate": 0}
