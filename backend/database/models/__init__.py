"""
数据库模型包
"""
from .base import BaseModel
from .upload_task import UploadTaskModel
from .resume_info import ResumeInfoModel
from .candidate import CandidateModel

__all__ = [
    "BaseModel",
    "UploadTaskModel", 
    "ResumeInfoModel",
    "CandidateModel"
]
