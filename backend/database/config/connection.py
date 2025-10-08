"""
数据库连接管理
支持多种数据库的连接和会话管理
"""
import sqlite3
from contextlib import contextmanager
from typing import Generator, Optional
from database.config.database_config import db_config, DatabaseType

class DatabaseConnection:
    """数据库连接管理器"""
    
    def __init__(self):
        self.config = db_config
    
    @contextmanager
    def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """获取数据库连接（SQLite）"""
        if not self.config.is_sqlite():
            raise NotImplementedError("当前只支持SQLite数据库")
        
        conn = sqlite3.connect(
            self.config.config["database"],
            **self.config.config["connect_args"]
        )
        conn.row_factory = sqlite3.Row  # 使结果可以按列名访问
        conn.execute("PRAGMA foreign_keys = ON")  # 启用外键约束
        conn.execute("PRAGMA journal_mode = WAL")  # 启用WAL模式
        conn.execute("PRAGMA synchronous = NORMAL")  # 优化性能
        
        try:
            yield conn
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def execute_query(self, query: str, params: tuple = ()) -> list:
        """执行查询并返回结果"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchall()
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        """执行更新操作并返回影响的行数"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount
    
    def execute_insert(self, query: str, params: tuple = ()) -> int:
        """执行插入操作并返回插入的ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.lastrowid
    
    def execute_many(self, query: str, params_list: list) -> int:
        """批量执行操作"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany(query, params_list)
            conn.commit()
            return cursor.rowcount
    
    def begin_transaction(self):
        """开始事务"""
        return self.get_connection()
    
    def check_connection(self) -> bool:
        """检查数据库连接是否正常"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                return True
        except Exception as e:
            print(f"数据库连接检查失败: {e}")
            return False
    
    def get_database_info(self) -> dict:
        """获取数据库信息"""
        if self.config.is_sqlite():
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT sqlite_version()")
                version = cursor.fetchone()[0]
                
                cursor.execute("PRAGMA database_list")
                databases = cursor.fetchall()
                
                return {
                    "type": "SQLite",
                    "version": version,
                    "databases": [dict(db) for db in databases],
                    "path": self.config.config["database"]
                }
        else:
            return {
                "type": self.config.db_type.value,
                "url": self.config.get_connection_string()
            }

# 全局数据库连接实例
db_connection = DatabaseConnection()
