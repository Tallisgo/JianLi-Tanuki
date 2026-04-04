"""
JSON 存储迁移 - 添加 original_markdown 和 processed_data 列
版本: v003
"""
MIGRATION_NAME = "JSON Storage - original_markdown and processed_data"

SQL_COMMANDS = [
    # 添加 original_markdown 列：保存文档转换后的原始 Markdown 文本
    """
    ALTER TABLE upload_tasks ADD COLUMN original_markdown TEXT
    """,

    # 添加 processed_data 列：保存 LLM 输出的完整结构化 JSON
    """
    ALTER TABLE upload_tasks ADD COLUMN processed_data TEXT
    """,
]
