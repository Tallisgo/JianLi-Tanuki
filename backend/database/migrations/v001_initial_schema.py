"""
初始数据库架构迁移
版本: v001
"""
MIGRATION_NAME = "Initial Database Schema"

SQL_COMMANDS = [
    # 创建上传任务表
    """
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
    """,
    
    # 创建简历信息表
    """
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
        updated_at TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES upload_tasks (id) ON DELETE CASCADE
    )
    """,
    
    # 创建候选人表
    """
    CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        name TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        position TEXT,
        experience_years INTEGER,
        education_level TEXT,
        school TEXT,
        major TEXT,
        skills TEXT,
        languages TEXT,
        certifications TEXT,
        summary TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES upload_tasks (id) ON DELETE CASCADE
    )
    """,
    
    # 创建索引
    "CREATE INDEX IF NOT EXISTS idx_tasks_status ON upload_tasks(status)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON upload_tasks(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_resume_task_id ON resume_info(task_id)",
    "CREATE INDEX IF NOT EXISTS idx_candidates_task_id ON candidates(task_id)",
    "CREATE INDEX IF NOT EXISTS idx_candidates_name ON candidates(name)",
    "CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status)",
    "CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at)",
    
    # 创建触发器 - 自动更新 updated_at 字段
    """
    CREATE TRIGGER IF NOT EXISTS update_upload_tasks_timestamp 
    AFTER UPDATE ON upload_tasks
    BEGIN
        UPDATE upload_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    """,
    
    """
    CREATE TRIGGER IF NOT EXISTS update_resume_info_timestamp 
    AFTER UPDATE ON resume_info
    BEGIN
        UPDATE resume_info SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    """,
    
    """
    CREATE TRIGGER IF NOT EXISTS update_candidates_timestamp 
    AFTER UPDATE ON candidates
    BEGIN
        UPDATE candidates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    """
]
