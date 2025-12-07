"""
用户系统数据库迁移
版本: v002
"""
MIGRATION_NAME = "User System"

SQL_COMMANDS = [
    # 创建用户表
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        avatar TEXT,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT NOT NULL DEFAULT 'active',
        last_login TIMESTAMP,
        login_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    )
    """,
    
    # 创建用户相关索引
    "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
    "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
    "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
    "CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)",
    "CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)",
    
    # 创建默认管理员用户（密码: admin123）
    """
    INSERT OR IGNORE INTO users (
        username, email, password_hash, full_name, role, status, created_at
    ) VALUES (
        'admin', 
        'admin@jianli-tanuki.com', 
        'scrypt:32768:8:1$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4/LewdBPj4', 
        '系统管理员', 
        'admin', 
        'active', 
        CURRENT_TIMESTAMP
    )
    """,
    
    # 创建用户会话表（用于JWT token管理）
    """
    CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """,
    
    # 创建会话相关索引
    "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON user_sessions(is_active)",
    
    # 创建用户活动日志表
    """
    CREATE TABLE IF NOT EXISTS user_activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """,
    
    # 创建活动日志相关索引
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON user_activity_logs(action)",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at)",
]



