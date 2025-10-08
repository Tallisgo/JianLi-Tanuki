"""
简历信息模型
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from database.models.base import BaseModel

class ResumeInfoModel(BaseModel):
    """简历信息数据库模型"""
    
    def __init__(self,
                 id: Optional[int] = None,
                 task_id: str = None,
                 name: Optional[str] = None,
                 phone: Optional[str] = None,
                 email: Optional[str] = None,
                 address: Optional[str] = None,
                 education: Optional[str] = None,
                 experience: Optional[str] = None,
                 projects: Optional[str] = None,
                 skills: Optional[str] = None,
                 languages: Optional[str] = None,
                 certifications: Optional[str] = None,
                 summary: Optional[str] = None,
                 other: Optional[str] = None,
                 created_at: Optional[datetime] = None,
                 updated_at: Optional[datetime] = None,
                 **kwargs):
        super().__init__(**kwargs)
        self.id = id
        self.task_id = task_id
        self.name = name
        self.phone = phone
        self.email = email
        self.address = address
        self.education = education
        self.experience = experience
        self.projects = projects
        self.skills = skills
        self.languages = languages
        self.certifications = certifications
        self.summary = summary
        self.other = other
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "task_id": self.task_id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "education": self.education,
            "experience": self.experience,
            "projects": self.projects,
            "skills": self.skills,
            "languages": self.languages,
            "certifications": self.certifications,
            "summary": self.summary,
            "other": self.other,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ResumeInfoModel':
        """从字典创建实例"""
        # 处理时间字段
        created_at = None
        if data.get("created_at"):
            if isinstance(data["created_at"], str):
                created_at = datetime.fromisoformat(data["created_at"])
            else:
                created_at = data["created_at"]
        
        updated_at = None
        if data.get("updated_at"):
            if isinstance(data["updated_at"], str):
                updated_at = datetime.fromisoformat(data["updated_at"])
            else:
                updated_at = data["updated_at"]
        
        return cls(
            id=data.get("id"),
            task_id=data["task_id"],
            name=data.get("name"),
            phone=data.get("phone"),
            email=data.get("email"),
            address=data.get("address"),
            education=data.get("education"),
            experience=data.get("experience"),
            projects=data.get("projects"),
            skills=data.get("skills"),
            languages=data.get("languages"),
            certifications=data.get("certifications"),
            summary=data.get("summary"),
            other=data.get("other"),
            created_at=created_at,
            updated_at=updated_at
        )
    
    def to_tuple(self) -> tuple:
        """转换为元组（用于数据库插入）"""
        return (
            self.task_id,
            self.name,
            self.phone,
            self.email,
            self.address,
            self.education,
            self.experience,
            self.projects,
            self.skills,
            self.languages,
            self.certifications,
            self.summary,
            self.other,
            self.created_at.isoformat(),
            self.updated_at.isoformat() if self.updated_at else None
        )
    
    @classmethod
    def from_row(cls, row) -> 'ResumeInfoModel':
        """从数据库行创建实例"""
        return cls(
            id=row["id"],
            task_id=row["task_id"],
            name=row["name"],
            phone=row["phone"],
            email=row["email"],
            address=row["address"],
            education=row["education"],
            experience=row["experience"],
            projects=row["projects"],
            skills=row["skills"],
            languages=row["languages"],
            certifications=row["certifications"],
            summary=row["summary"],
            other=row["other"],
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else None,
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else None
        )
    
    def update_info(self, **kwargs):
        """更新简历信息"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.now()
    
    def get_skills_list(self) -> List[str]:
        """获取技能列表"""
        if not self.skills:
            return []
        try:
            import json
            return json.loads(self.skills)
        except:
            return [skill.strip() for skill in self.skills.split(",") if skill.strip()]
    
    def set_skills_list(self, skills: List[str]):
        """设置技能列表"""
        import json
        self.skills = json.dumps(skills, ensure_ascii=False)
    
    def get_languages_list(self) -> List[str]:
        """获取语言列表"""
        if not self.languages:
            return []
        try:
            import json
            return json.loads(self.languages)
        except:
            return [lang.strip() for lang in self.languages.split(",") if lang.strip()]
    
    def set_languages_list(self, languages: List[str]):
        """设置语言列表"""
        import json
        self.languages = json.dumps(languages, ensure_ascii=False)
