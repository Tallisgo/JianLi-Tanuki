"""
数据库配置管理
支持多种数据库类型
"""
import os
from enum import Enum
from typing import Dict, Any
from app.core.config import settings

class DatabaseType(str, Enum):
    """数据库类型枚举"""
    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"

class DatabaseConfig:
    """数据库配置类"""
    
    def __init__(self):
        self.db_type = self._get_database_type()
        self.config = self._get_database_config()
    
    def _get_database_type(self) -> DatabaseType:
        """获取数据库类型"""
        db_url = settings.DATABASE_URL.lower()
        
        if db_url.startswith("sqlite"):
            return DatabaseType.SQLITE
        elif db_url.startswith("postgresql"):
            return DatabaseType.POSTGRESQL
        elif db_url.startswith("mysql"):
            return DatabaseType.MYSQL
        else:
            # 默认使用SQLite
            return DatabaseType.SQLITE
    
    def _get_database_config(self) -> Dict[str, Any]:
        """获取数据库配置"""
        if self.db_type == DatabaseType.SQLITE:
            return self._get_sqlite_config()
        elif self.db_type == DatabaseType.POSTGRESQL:
            return self._get_postgresql_config()
        elif self.db_type == DatabaseType.MYSQL:
            return self._get_mysql_config()
        else:
            return self._get_sqlite_config()
    
    def _get_sqlite_config(self) -> Dict[str, Any]:
        """SQLite配置"""
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        
        # 确保数据目录存在
        data_dir = os.path.dirname(db_path)
        if data_dir and not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)
        
        return {
            "database": db_path,
            "echo": settings.DEBUG,
            "pool_pre_ping": True,
            "connect_args": {
                "check_same_thread": False,
                "timeout": 30
            }
        }
    
    def _get_postgresql_config(self) -> Dict[str, Any]:
        """PostgreSQL配置"""
        return {
            "database_url": settings.DATABASE_URL,
            "echo": settings.DEBUG,
            "pool_size": 10,
            "max_overflow": 20,
            "pool_pre_ping": True,
            "pool_recycle": 3600
        }
    
    def _get_mysql_config(self) -> Dict[str, Any]:
        """MySQL配置"""
        return {
            "database_url": settings.DATABASE_URL,
            "echo": settings.DEBUG,
            "pool_size": 10,
            "max_overflow": 20,
            "pool_pre_ping": True,
            "pool_recycle": 3600,
            "charset": "utf8mb4"
        }
    
    def get_connection_string(self) -> str:
        """获取连接字符串"""
        return settings.DATABASE_URL
    
    def is_sqlite(self) -> bool:
        """是否为SQLite数据库"""
        return self.db_type == DatabaseType.SQLITE
    
    def is_postgresql(self) -> bool:
        """是否为PostgreSQL数据库"""
        return self.db_type == DatabaseType.POSTGRESQL
    
    def is_mysql(self) -> bool:
        """是否为MySQL数据库"""
        return self.db_type == DatabaseType.MYSQL

# 全局数据库配置实例
db_config = DatabaseConfig()
