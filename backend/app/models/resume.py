"""
简历相关数据模型 - 带 field_validator 容错归一化 + 自定义区块支持
"""
import json
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


# ---------------------------------------------------------------------------
# 辅助归一化函数
# ---------------------------------------------------------------------------

def _coerce_string_list(v: Any) -> List[str]:
    """将 LLM 返回的各种格式统一转为 list[str]"""
    if v is None:
        return []
    if isinstance(v, str):
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return [str(item) for item in parsed if item]
        except (json.JSONDecodeError, TypeError):
            pass
        return [s.strip() for s in v.split(",") if s.strip()]
    if isinstance(v, dict):
        return [str(val) for val in v.values() if val]
    if isinstance(v, list):
        result = []
        for item in v:
            if isinstance(item, str):
                if item.strip():
                    result.append(item.strip())
            elif isinstance(item, list):
                result.extend(str(i) for i in item if i)
            elif isinstance(item, dict):
                result.extend(str(val) for val in item.values() if val)
            elif item is not None:
                result.append(str(item))
        return result
    return [str(v)]


def _coerce_text(v: Any) -> Optional[str]:
    """递归提取嵌套结构中的文本"""
    if v is None:
        return None
    if isinstance(v, str):
        return v.strip() if v.strip() else None
    if isinstance(v, list):
        parts = [_coerce_text(item) for item in v]
        text = "\n".join(p for p in parts if p)
        return text or None
    if isinstance(v, dict):
        parts = [_coerce_text(val) for val in v.values()]
        text = "\n".join(p for p in parts if p)
        return text or None
    return str(v)


def _clean_description_lines(v: Any) -> List[str]:
    """清理描述行，去除 bullet point 前缀"""
    lines = _coerce_string_list(v)
    cleaned = []
    for line in lines:
        line = line.strip()
        for prefix in ("- ", "• ", "* ", "· ", "– ", "— "):
            if line.startswith(prefix):
                line = line[len(prefix):]
                break
        if line:
            cleaned.append(line)
    return cleaned


# ---------------------------------------------------------------------------
# 枚举
# ---------------------------------------------------------------------------

class TaskStatus(str, Enum):
    """任务状态枚举"""
    UPLOADED = "uploaded"
    PARSING = "parsing"
    COMPLETED = "completed"
    FAILED = "failed"
    DUPLICATE = "duplicate"


class SectionType(str, Enum):
    """区块类型枚举"""
    ITEM_LIST = "itemList"
    STRING_LIST = "stringList"
    TEXT = "text"


# ---------------------------------------------------------------------------
# 基础信息模型（带容错 validator）
# ---------------------------------------------------------------------------

class ContactInfo(BaseModel):
    """联系方式信息"""
    phone: Optional[str] = Field(None, description="电话号码")
    email: Optional[str] = Field(None, description="邮箱地址")
    address: Optional[str] = Field(None, description="地址")

    @field_validator("phone", "email", "address", mode="before")
    @classmethod
    def coerce_to_str(cls, v):
        if v is None:
            return None
        return _coerce_text(v)


class EducationInfo(BaseModel):
    """教育背景信息"""
    degree: Optional[str] = Field(None, description="学位")
    institution: Optional[str] = Field(None, description="学校名称")
    major: Optional[str] = Field(None, description="专业")
    start_year: Optional[str] = Field(None, description="开始年份")
    end_year: Optional[str] = Field(None, description="结束年份")
    gpa: Optional[str] = Field(None, description="GPA")
    description: Optional[List[str]] = Field(default_factory=list, description="描述")

    @field_validator("degree", "institution", "major", "start_year", "end_year", "gpa", mode="before")
    @classmethod
    def coerce_to_str(cls, v):
        if v is None:
            return None
        return _coerce_text(v)

    @field_validator("description", mode="before")
    @classmethod
    def coerce_description(cls, v):
        if v is None:
            return []
        return _clean_description_lines(v)


class WorkExperience(BaseModel):
    """工作经历信息"""
    title: Optional[str] = Field(None, description="职位")
    company: Optional[str] = Field(None, description="公司名称")
    start_date: Optional[str] = Field(None, description="开始日期")
    end_date: Optional[str] = Field(None, description="结束日期")
    description: Optional[Union[str, List[str]]] = Field(None, description="工作描述")
    location: Optional[str] = Field(None, description="工作地点")

    @field_validator("title", "company", "start_date", "end_date", "location", mode="before")
    @classmethod
    def coerce_to_str(cls, v):
        if v is None:
            return None
        return _coerce_text(v)

    @field_validator("description", mode="before")
    @classmethod
    def coerce_description(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            lines = _clean_description_lines(v)
            return lines if lines else None
        return _coerce_text(v)


class ProjectInfo(BaseModel):
    """项目经验信息"""
    name: Optional[str] = Field(None, description="项目名称")
    description: Optional[str] = Field(None, description="项目描述")
    technologies: Optional[List[str]] = Field(default_factory=list, description="技术栈")
    start_date: Optional[str] = Field(None, description="开始日期")
    end_date: Optional[str] = Field(None, description="结束日期")

    @field_validator("name", "description", "start_date", "end_date", mode="before")
    @classmethod
    def coerce_to_str(cls, v):
        if v is None:
            return None
        return _coerce_text(v)

    @field_validator("technologies", mode="before")
    @classmethod
    def coerce_technologies(cls, v):
        return _coerce_string_list(v)


# ---------------------------------------------------------------------------
# sectionMeta + customSections 支持
# ---------------------------------------------------------------------------

class SectionMeta(BaseModel):
    """区块元数据，用于前端动态渲染和排序"""
    id: str = Field(..., description="区块唯一标识")
    key: str = Field(..., description="区块 key（对应 ResumeInfo 的字段名）")
    displayName: str = Field(..., description="显示名称")
    sectionType: SectionType = Field(SectionType.TEXT, description="区块类型")
    isVisible: bool = Field(True, description="是否可见")
    order: int = Field(0, description="排序顺序")


class CustomSectionItem(BaseModel):
    """自定义区块中的条目（类似工作经历的结构）"""
    id: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    years: Optional[str] = None
    description: Optional[List[str]] = Field(default_factory=list)

    @field_validator("description", mode="before")
    @classmethod
    def coerce_description(cls, v):
        return _clean_description_lines(v) if v else []


class CustomSection(BaseModel):
    """自定义区块，支持三种类型"""
    sectionType: SectionType = Field(SectionType.TEXT, description="区块类型")
    items: Optional[List[CustomSectionItem]] = Field(None, description="itemList 类型的条目")
    strings: Optional[List[str]] = Field(None, description="stringList 类型的字符串列表")
    text: Optional[str] = Field(None, description="text 类型的自由文本")

    @field_validator("strings", mode="before")
    @classmethod
    def coerce_strings(cls, v):
        if v is None:
            return None
        return _coerce_string_list(v)

    @field_validator("text", mode="before")
    @classmethod
    def coerce_text(cls, v):
        return _coerce_text(v)


# ---------------------------------------------------------------------------
# 核心简历模型
# ---------------------------------------------------------------------------

# 标准区块配置：key -> (displayName, sectionType, order)
_STANDARD_SECTIONS = {
    "contact": ("联系方式", SectionType.TEXT, 0),
    "summary": ("个人简介", SectionType.TEXT, 1),
    "experience": ("工作经历", SectionType.ITEM_LIST, 2),
    "education": ("教育背景", SectionType.ITEM_LIST, 3),
    "projects": ("项目经验", SectionType.ITEM_LIST, 4),
    "skills": ("技能", SectionType.STRING_LIST, 5),
    "languages": ("语言能力", SectionType.STRING_LIST, 6),
    "certifications": ("证书", SectionType.STRING_LIST, 7),
}


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

    # 新增：区块元数据 + 自定义区块
    sectionMeta: Optional[List[SectionMeta]] = Field(None, description="区块元数据")
    customSections: Optional[Dict[str, CustomSection]] = Field(None, description="自定义区块")

    @field_validator("name", mode="before")
    @classmethod
    def coerce_name(cls, v):
        return _coerce_text(v)

    @field_validator("skills", "languages", "certifications", mode="before")
    @classmethod
    def coerce_string_lists(cls, v):
        if v is None:
            return None
        result = _coerce_string_list(v)
        return result if result else None

    @field_validator("summary", "other", mode="before")
    @classmethod
    def coerce_text_fields(cls, v):
        return _coerce_text(v)

    @field_validator("contact", mode="before")
    @classmethod
    def coerce_contact(cls, v):
        if v is None:
            return None
        if isinstance(v, dict):
            return ContactInfo(**v)
        return v

    @field_validator("education", mode="before")
    @classmethod
    def coerce_education(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            result = []
            for item in v:
                if isinstance(item, dict):
                    result.append(EducationInfo(**item))
                elif isinstance(item, EducationInfo):
                    result.append(item)
            return result if result else None
        return v

    @field_validator("experience", mode="before")
    @classmethod
    def coerce_experience(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            result = []
            for item in v:
                if isinstance(item, dict):
                    result.append(WorkExperience(**item))
                elif isinstance(item, WorkExperience):
                    result.append(item)
            return result if result else None
        return v

    @field_validator("projects", mode="before")
    @classmethod
    def coerce_projects(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            result = []
            for item in v:
                if isinstance(item, dict):
                    result.append(ProjectInfo(**item))
                elif isinstance(item, ProjectInfo):
                    result.append(item)
            return result if result else None
        return v

    def normalize(self) -> "ResumeInfo":
        """懒迁移：自动补全缺失的 sectionMeta（读时补全策略）"""
        if self.sectionMeta is not None:
            return self

        meta_list = []
        for key, (display_name, section_type, order) in _STANDARD_SECTIONS.items():
            value = getattr(self, key, None)
            meta_list.append(SectionMeta(
                id=key,
                key=key,
                displayName=display_name,
                sectionType=section_type,
                isVisible=value is not None,
                order=order,
            ))

        if self.customSections:
            base_order = len(_STANDARD_SECTIONS)
            for idx, (key, section) in enumerate(self.customSections.items()):
                meta_list.append(SectionMeta(
                    id=key,
                    key=key,
                    displayName=key,
                    sectionType=section.sectionType,
                    isVisible=True,
                    order=base_order + idx,
                ))

        self.sectionMeta = meta_list
        if self.customSections is None:
            self.customSections = {}
        return self


# ---------------------------------------------------------------------------
# 任务 & API 响应模型
# ---------------------------------------------------------------------------

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
    original_markdown: Optional[str] = Field(None, description="原始 Markdown 文本")
    processed_data: Optional[str] = Field(None, description="结构化 JSON 数据")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")


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
