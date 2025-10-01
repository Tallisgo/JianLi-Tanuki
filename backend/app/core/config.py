"""
应用配置管理
"""
import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import validator

class Settings(BaseSettings):
    """应用配置类"""
    
    # 项目基本信息
    PROJECT_NAME: str = "简历解析系统"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API配置
    API_V1_STR: str = "/api/v1"
    PORT: int = 8001
    HOST: str = "127.0.0.1"
    
    # CORS配置
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8001"
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./resume_parser.db"
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png"
    ]
    
    # LLM API配置
    SILICONFLOW_API_KEY: str = ""
    SILICONFLOW_API_URL: str = "https://api.siliconflow.cn/v1/messages"
    LLM_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    MAX_TOKENS: int = 4096
    
    # OCR配置
    OCR_LANGUAGE: str = "ch"
    
    # 任务配置
    TASK_TIMEOUT: int = 300  # 5分钟超时
    POLL_INTERVAL: int = 2   # 轮询间隔（秒）
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# 创建全局配置实例
settings = Settings()
