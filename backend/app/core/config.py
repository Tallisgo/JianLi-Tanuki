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
    # pydantic-settings 对 List 类型会尝试 json.loads，逗号分隔字符串会失败
    BACKEND_CORS_ORIGINS: str = "*"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    # 数据库配置
    DATABASE_URL: str = "sqlite:///./data/resume_parser.db"

    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
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
    LOG_FILE: str = "logs/jianli-tanuki.log"
    LOG_MAX_SIZE: int = 10  # MB
    LOG_BACKUP_COUNT: int = 5

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
