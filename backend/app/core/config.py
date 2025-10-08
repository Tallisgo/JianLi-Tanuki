"""
应用配置管理 - 从.env文件读取配置
"""
import os
from typing import List
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

class Settings:
    """应用配置类 - 从环境变量读取所有配置"""
    
    # 项目基本信息
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "JianLi Tanuki (简狸) - 智能简历解析系统")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # API配置
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    PORT: int = int(os.getenv("PORT", "8001"))
    HOST: str = os.getenv("HOST", "0.0.0.0")  # 允许外部访问
    
    # CORS配置 - 允许所有来源（生产环境建议限制具体域名）
    BACKEND_CORS_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv(
            "BACKEND_CORS_ORIGINS",
            "*"  # 临时允许所有来源，生产环境请限制具体域名
        ).split(",") if origin.strip()
    ]
    
    # 数据库配置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/resume_parser.db")
    
    # 文件上传配置
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    ALLOWED_FILE_TYPES: List[str] = os.getenv(
        "ALLOWED_FILE_TYPES",
        "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/jpg,image/png"
    ).split(",")
    
    # LLM API配置
    SILICONFLOW_API_KEY: str = os.getenv("SILICONFLOW_API_KEY", "")
    SILICONFLOW_API_URL: str = os.getenv("SILICONFLOW_API_URL", "https://api.siliconflow.cn/v1/messages")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "Qwen/Qwen2.5-7B-Instruct")
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "4096"))
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "1.2"))
    LLM_TOP_P: float = float(os.getenv("LLM_TOP_P", "0.9"))
    
    # JWT配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # OCR配置
    OCR_LANGUAGE: str = os.getenv("OCR_LANGUAGE", "ch")
    
    # 任务配置
    TASK_TIMEOUT: int = int(os.getenv("TASK_TIMEOUT", "300"))  # 5分钟超时
    POLL_INTERVAL: int = int(os.getenv("POLL_INTERVAL", "2"))   # 轮询间隔（秒）
    MAX_CONCURRENT_TASKS: int = int(os.getenv("MAX_CONCURRENT_TASKS", "5"))  # 最大并发任务数
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/jianli-tanuki.log")
    LOG_MAX_SIZE: int = int(os.getenv("LOG_MAX_SIZE", "10"))  # MB
    LOG_BACKUP_COUNT: int = int(os.getenv("LOG_BACKUP_COUNT", "5"))
    
    # 安全配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ACCESS_TOKEN_EXPIRE_HOURS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))
    
    # 缓存配置
    CACHE_SIZE: int = int(os.getenv("CACHE_SIZE", "100"))  # MB
    CACHE_EXPIRE: int = int(os.getenv("CACHE_EXPIRE", "3600"))  # 秒
    
    # 监控配置
    ENABLE_HEALTH_CHECK: bool = os.getenv("ENABLE_HEALTH_CHECK", "true").lower() == "true"
    HEALTH_CHECK_INTERVAL: int = int(os.getenv("HEALTH_CHECK_INTERVAL", "30"))
    ENABLE_METRICS: bool = os.getenv("ENABLE_METRICS", "false").lower() == "true"
    
    # 部署环境配置
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG_MODE: bool = os.getenv("DEBUG_MODE", "true").lower() == "true"
    ENABLE_DOCS: bool = os.getenv("ENABLE_DOCS", "true").lower() == "true"
    DOCS_URL: str = os.getenv("DOCS_URL", "/docs")
    REDOC_URL: str = os.getenv("REDOC_URL", "/redoc")

# 创建全局配置实例
settings = Settings()