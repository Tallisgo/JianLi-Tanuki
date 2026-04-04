"""
数据库包
"""
from .config.database_config import db_config
from .config.connection import db_connection
from .migrations.migration_manager import MigrationManager
from .repositories import (
    UploadTaskRepository,
    ResumeInfoRepository,
    CandidateRepository,
    UserRepository
)
import logging

logger = logging.getLogger(__name__)

# 创建全局实例
migration_manager = MigrationManager()
upload_task_repo = UploadTaskRepository()
resume_info_repo = ResumeInfoRepository()
candidate_repo = CandidateRepository()
user_repo = UserRepository()

def init_database():
    """初始化数据库"""
    logger.info("初始化数据库...")
    
    # 检查数据库连接
    if not db_connection.check_connection():
        logger.error("数据库连接失败")
        return False
    
    # 运行迁移
    try:
        migration_manager.run_all_migrations()
        logger.info("数据库初始化完成")
        return True
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        return False

def get_database_info():
    """获取数据库信息"""
    return db_connection.get_database_info()

def get_migration_status():
    """获取迁移状态"""
    return migration_manager.get_migration_status()

__all__ = [
    "db_config",
    "db_connection", 
    "migration_manager",
    "upload_task_repo",
    "resume_info_repo",
    "candidate_repo",
    "init_database",
    "get_database_info",
    "get_migration_status"
]
