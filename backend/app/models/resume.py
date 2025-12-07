"""
简历相关数据模型
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    """任务状态枚举"""
    UPLOADED = "uploaded"
    PARSING = "parsing"
    COMPLETED = "completed"
    FAILED = "failed"
    DUPLICATE = "duplicate"  # 发现重复候选人

class ContactInfo(BaseModel):
    """联系方式信息"""
    phone: Optional[str] = Field(None, description="电话号码")
    email: Optional[str] = Field(None, description="邮箱地址")
    address: Optional[str] = Field(None, description="地址")

class EducationInfo(BaseModel):
    """教育背景信息"""
    degree: Optional[str] = Field(None, description="学位")
    institution: Optional[str] = Field(None, description="学校名称")
    major: Optional[str] = Field(None, description="专业")
    start_year: Optional[str] = Field(None, description="开始年份")
    end_year: Optional[str] = Field(None, description="结束年份")
    gpa: Optional[str] = Field(None, description="GPA")

class WorkExperience(BaseModel):
    """工作经历信息"""
    title: Optional[str] = Field(None, description="职位")
    company: Optional[str] = Field(None, description="公司名称")
    start_date: Optional[str] = Field(None, description="开始日期")
    end_date: Optional[str] = Field(None, description="结束日期")
    description: Optional[str] = Field(None, description="工作描述")
    location: Optional[str] = Field(None, description="工作地点")

class ProjectInfo(BaseModel):
    """项目经验信息"""
    name: Optional[str] = Field(None, description="项目名称")
    description: Optional[str] = Field(None, description="项目描述")
    technologies: Optional[List[str]] = Field(None, description="技术栈")
    start_date: Optional[str] = Field(None, description="开始日期")
    end_date: Optional[str] = Field(None, description="结束日期")

class ResumeInfo(BaseModel):
    """简历信息模型"""
    name: Optional[str] = Field(None, description="姓名")
    contact: Optional[ContactInfo] = Field(None, description="联系方式")
    education: Optional[List[EducationInfo]] = Field(None, description="教育背景")
    experience: Optional[List[WorkExperience]] = Field(None, description="工作经历")
    projects: Optional[List[ProjectInfo]] = Field(None, description="项目经验")
    skills: Optional[List[str]] = Field(None, description="技能")
    languages: Optional[List[str]] = Field(None, description="语言能力")
    certifications: Optional[List[str]] = Field(None, description="证书")
    summary: Optional[str] = Field(None, description="个人简介")
    other: Optional[str] = Field(None, description="其他信息")

class UploadTask(BaseModel):
    """上传任务模型"""
    id: str = Field(..., description="任务ID")
    filename: str = Field(..., description="文件名")
    file_path: str = Field(..., description="文件路径")
    file_size: Optional[int] = Field(None, description="文件大小")
    file_type: Optional[str] = Field(None, description="文件类型")
    status: TaskStatus = Field(TaskStatus.UPLOADED, description="任务状态")
    progress: int = Field(0, description="进度百分比")
    result: Optional[ResumeInfo] = Field(None, description="解析结果")
    error: Optional[str] = Field(None, description="错误信息")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")

# API响应模型
class TaskResponse(BaseModel):
    """任务响应模型"""
    task_id: str = Field(..., description="任务ID")
    filename: str = Field(..., description="文件名")
    status: str = Field(..., description="任务状态")
    progress: int = Field(0, description="进度百分比")
    result: Optional[Dict[str, Any]] = Field(None, description="解析结果")
    error: Optional[str] = Field(None, description="错误信息")
    created_at: str = Field(..., description="创建时间")
    updated_at: Optional[str] = Field(None, description="更新时间")
    completed_at: Optional[str] = Field(None, description="完成时间")

class UploadResponse(BaseModel):
    """上传响应模型"""
    task_id: str = Field(..., description="任务ID")
    filename: str = Field(..., description="文件名")
    status: str = Field(..., description="任务状态")
    message: str = Field(..., description="响应消息")

class ErrorResponse(BaseModel):
    """错误响应模型"""
    detail: str = Field(..., description="错误详情")
    error_code: Optional[str] = Field(None, description="错误代码")
