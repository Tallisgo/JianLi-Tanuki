"""
数据库迁移管理器
"""
import os
from typing import List, Dict, Any
from database.config.connection import db_connection

class MigrationManager:
    """数据库迁移管理器"""
    
    def __init__(self):
        self.connection = db_connection
        self.init_migration_table()
    
    def init_migration_table(self):
        """初始化迁移记录表"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            checksum VARCHAR(64)
        )
        """
        self.connection.execute_update(create_table_sql)
    
    def get_applied_migrations(self) -> List[str]:
        """获取已应用的迁移版本"""
        query = "SELECT version FROM migrations ORDER BY version"
        rows = self.connection.execute_query(query)
        return [row["version"] for row in rows]
    
    def record_migration(self, version: str, name: str, checksum: str = None):
        """记录迁移应用"""
        insert_sql = """
        INSERT INTO migrations (version, name, checksum)
        VALUES (?, ?, ?)
        """
        self.connection.execute_update(insert_sql, (version, name, checksum))
    
    def run_migration(self, version: str, name: str, sql_commands: List[str]):
        """运行迁移"""
        print(f"执行迁移: {version} - {name}")
        
        try:
            # 开始事务
            with self.connection.begin_transaction() as conn:
                cursor = conn.cursor()
                
                # 执行所有SQL命令
                for sql in sql_commands:
                    if sql.strip():
                        cursor.execute(sql)
                
                # 记录迁移
                cursor.execute(
                    "INSERT INTO migrations (version, name) VALUES (?, ?)",
                    (version, name)
                )
                
                conn.commit()
                print(f"✅ 迁移 {version} 执行成功")
                
        except Exception as e:
            print(f"❌ 迁移 {version} 执行失败: {e}")
            raise e
    
    def run_all_migrations(self):
        """运行所有未应用的迁移"""
        applied_migrations = set(self.get_applied_migrations())
        
        # 获取所有迁移文件
        migration_dir = os.path.dirname(__file__)
        migration_files = []
        
        for filename in os.listdir(migration_dir):
            if filename.startswith("v") and filename.endswith(".py"):
                version = filename.replace(".py", "")
                if version not in applied_migrations:
                    migration_files.append((version, filename))
        
        # 按版本号排序
        migration_files.sort(key=lambda x: x[0])
        
        if not migration_files:
            print("✅ 所有迁移已是最新版本")
            return
        
        print(f"发现 {len(migration_files)} 个待执行迁移")
        
        for version, filename in migration_files:
            try:
                # 动态导入迁移模块
                module_name = filename.replace(".py", "")
                module = __import__(f"database.migrations.{module_name}", fromlist=[module_name])
                
                # 获取迁移信息
                migration_name = getattr(module, "MIGRATION_NAME", f"Migration {version}")
                sql_commands = getattr(module, "SQL_COMMANDS", [])
                
                # 执行迁移
                self.run_migration(version, migration_name, sql_commands)
                
            except Exception as e:
                print(f"❌ 迁移 {version} 执行失败: {e}")
                break
    
    def get_migration_status(self) -> Dict[str, Any]:
        """获取迁移状态"""
        applied_migrations = self.get_applied_migrations()
        
        # 获取所有迁移文件
        migration_dir = os.path.dirname(__file__)
        all_migrations = []
        
        for filename in os.listdir(migration_dir):
            if filename.startswith("v") and filename.endswith(".py"):
                version = filename.replace(".py", "")
                all_migrations.append(version)
        
        all_migrations.sort()
        
        return {
            "total_migrations": len(all_migrations),
            "applied_migrations": len(applied_migrations),
            "pending_migrations": len(all_migrations) - len(applied_migrations),
            "applied": applied_migrations,
            "pending": [v for v in all_migrations if v not in applied_migrations]
        }
