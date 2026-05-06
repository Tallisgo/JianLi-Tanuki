"""
添加 category 列到 candidates 和 upload_tasks 表
版本: v004
"""
MIGRATION_NAME = "Add category column to candidates and upload_tasks"

SQL_COMMANDS = [
    "ALTER TABLE candidates ADD COLUMN category TEXT",
    "ALTER TABLE upload_tasks ADD COLUMN category TEXT",
    "CREATE INDEX IF NOT EXISTS idx_candidates_category ON candidates(category)",
]
