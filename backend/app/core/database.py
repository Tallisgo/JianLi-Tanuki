"""
数据库连接和操作
"""
import sqlite3
import os
from typing import Optional, List
from contextlib import contextmanager
from app.core.config import settings
from app.models.resume import ResumeInfo, UploadTask, TaskStatus
import json
from datetime import datetime

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or settings.DATABASE_URL.replace("sqlite:///", "")
        self.init_database()
    
    def init_database(self):
        """初始化数据库表"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 创建任务表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS upload_tasks (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_size INTEGER,
                    file_type TEXT,
                    status TEXT NOT NULL DEFAULT 'uploaded',
                    progress INTEGER DEFAULT 0,
                    result TEXT,
                    error TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP,
                    completed_at TIMESTAMP
                )
            ''')
            
            # 创建简历信息表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS resume_info (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT NOT NULL,
                    name TEXT,
                    phone TEXT,
                    email TEXT,
                    address TEXT,
                    education TEXT,
                    experience TEXT,
                    projects TEXT,
                    skills TEXT,
                    languages TEXT,
                    certifications TEXT,
                    summary TEXT,
                    other TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (task_id) REFERENCES upload_tasks (id)
                )
            ''')
            
            # 创建索引
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_status ON upload_tasks(status)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON upload_tasks(created_at)')
            
            conn.commit()
    
    @contextmanager
    def get_connection(self):
        """获取数据库连接上下文管理器"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 使结果可以按列名访问
        try:
            yield conn
        finally:
            conn.close()
    
    def save_task(self, task: UploadTask) -> bool:
        """保存任务到数据库"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                result_json = None
                if task.result:
                    result_json = task.result.json()
                
                cursor.execute('''
                    INSERT OR REPLACE INTO upload_tasks 
                    (id, filename, file_path, file_size, file_type, status, progress, result, error, created_at, updated_at, completed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    task.id,
                    task.filename,
                    task.file_path,
                    task.file_size,
                    task.file_type,
                    task.status,
                    task.progress,
                    result_json,
                    task.error,
                    task.created_at.isoformat(),
                    task.updated_at.isoformat() if task.updated_at else None,
                    task.completed_at.isoformat() if task.completed_at else None
                ))
                
                conn.commit()
                return True
        except Exception as e:
            print(f"保存任务失败: {e}")
            return False
    
    def get_task(self, task_id: str) -> Optional[UploadTask]:
        """从数据库获取任务"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM upload_tasks WHERE id = ?
                ''', (task_id,))
                
                row = cursor.fetchone()
                if not row:
                    return None
                
                return self._row_to_task(row)
        except Exception as e:
            print(f"获取任务失败: {e}")
            return None
    
    def get_all_tasks(self, limit: int = 100, offset: int = 0) -> List[UploadTask]:
        """获取所有任务"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM upload_tasks 
                    ORDER BY created_at DESC 
                    LIMIT ? OFFSET ?
                ''', (limit, offset))
                
                rows = cursor.fetchall()
                return [self._row_to_task(row) for row in rows]
        except Exception as e:
            print(f"获取任务列表失败: {e}")
            return []
    
    def update_task_status(self, task_id: str, status: str, progress: int = None, 
                          result: ResumeInfo = None, error: str = None) -> bool:
        """更新任务状态"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                result_json = None
                if result:
                    result_json = result.json()
                
                completed_at = datetime.now().isoformat() if status in ['completed', 'failed'] else None
                
                cursor.execute('''
                    UPDATE upload_tasks 
                    SET status = ?, progress = ?, result = ?, error = ?, updated_at = ?, completed_at = ?
                    WHERE id = ?
                ''', (status, progress, result_json, error, datetime.now().isoformat(), completed_at, task_id))
                
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"更新任务状态失败: {e}")
            return False
    
    def delete_task(self, task_id: str) -> bool:
        """删除任务"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('DELETE FROM upload_tasks WHERE id = ?', (task_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"删除任务失败: {e}")
            return False
    
    def _row_to_task(self, row) -> UploadTask:
        """将数据库行转换为UploadTask对象"""
        result = None
        if row['result']:
            try:
                result_data = json.loads(row['result'])
                result = ResumeInfo(**result_data)
            except Exception as e:
                print(f"解析结果数据失败: {e}")
        
        return UploadTask(
            id=row['id'],
            filename=row['filename'],
            file_path=row['file_path'],
            file_size=row['file_size'],
            file_type=row['file_type'],
            status=TaskStatus(row['status']),
            progress=row['progress'],
            result=result,
            error=row['error'],
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else None,
            completed_at=datetime.fromisoformat(row['completed_at']) if row['completed_at'] else None
        )

# 创建全局数据库管理器实例
db_manager = DatabaseManager()

def init_db():
    """初始化数据库"""
    db_manager.init_database()
