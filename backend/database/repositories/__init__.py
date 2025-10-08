"""
数据访问层包
"""
from .base_repository import BaseRepository
from .upload_task_repository import UploadTaskRepository
from .resume_info_repository import ResumeInfoRepository
from .candidate_repository import CandidateRepository

__all__ = [
    "BaseRepository",
    "UploadTaskRepository",
    "ResumeInfoRepository", 
    "CandidateRepository"
]
