"""
应用配置管理 - 基于 pydantic-settings，自动从 .env 文件加载配置
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置类 - 基于 pydantic-settings 自动读取环境变量和 .env"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # 项目基本信息
    PROJECT_NAME: str = "JianLi Tanuki (简狸) - 智能简历解析系统"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API配置
    API_V1_STR: str = "/api/v1"
    PORT: int = 8001
    HOST: str = "0.0.0.0"

    # CORS配置 - 存为原始字符串，通过 property 返回列表
    BACKEND_CORS_ORIGINS: str = "*"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    # ==========================================================
    # 统一数据目录 - Docker 部署时只需挂载此目录
    # 目录结构: DATA_DIR/db/  DATA_DIR/uploads/  DATA_DIR/logs/
    # ==========================================================
    DATA_DIR: str = "./data"

    # 数据库配置（默认基于 DATA_DIR）
    DATABASE_URL: str = "sqlite:///./data/db/resume_parser.db"

    # 文件上传目录（默认基于 DATA_DIR）
    UPLOAD_DIR: str = "./data/uploads"

    # 日志目录（默认基于 DATA_DIR）
    LOG_DIR: str = "./data/logs"

    # 文件上传限制
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_FILE_TYPES: str = (
        "application/pdf,application/msword,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
        "image/jpeg,image/jpg,image/png"
    )

    @property
    def allowed_file_types_list(self) -> List[str]:
        return [t.strip() for t in self.ALLOWED_FILE_TYPES.split(",") if t.strip()]

    # LLM API配置
    SILICONFLOW_API_KEY: str = ""
    SILICONFLOW_API_URL: str = "https://api.siliconflow.cn/v1/messages"
    LLM_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    MAX_TOKENS: int = 4096
    LLM_TEMPERATURE: float = 0.2
    LLM_TOP_P: float = 0.9

    # JWT配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OCR配置
    OCR_LANGUAGE: str = "ch"

    # 任务配置
    TASK_TIMEOUT: int = 300
    POLL_INTERVAL: int = 2
    MAX_CONCURRENT_TASKS: int = 5

    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "jianli-tanuki.log"
    LOG_BACKUP_COUNT: int = 30  # 按日轮转保留天数

    # 缓存配置
    CACHE_SIZE: int = 100  # MB
    CACHE_EXPIRE: int = 3600  # 秒

    # 监控配置
    ENABLE_HEALTH_CHECK: bool = True
    HEALTH_CHECK_INTERVAL: int = 30
    ENABLE_METRICS: bool = False

    # 部署环境配置
    ENVIRONMENT: str = "development"
    DEBUG_MODE: bool = True
    ENABLE_DOCS: bool = True
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"


# 创建全局配置实例
settings = Settings()
