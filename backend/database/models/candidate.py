"""
候选人模型
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from database.models.base import BaseModel

class CandidateModel(BaseModel):
    """候选人数据库模型"""
    
    def __init__(self,
                 id: Optional[int] = None,
                 task_id: str = None,
                 name: Optional[str] = None,
                 phone: Optional[str] = None,
                 email: Optional[str] = None,
                 address: Optional[str] = None,
                 position: Optional[str] = None,
                 experience_years: Optional[int] = None,
                 education_level: Optional[str] = None,
                 school: Optional[str] = None,
                 major: Optional[str] = None,
                 skills: Optional[str] = None,
                 languages: Optional[str] = None,
                 certifications: Optional[str] = None,
                 summary: Optional[str] = None,
                 status: str = "active",
                 notes: Optional[str] = None,
                 rating: Optional[int] = None,
                 tags: Optional[str] = None,
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
        self.position = position
        self.experience_years = experience_years
        self.education_level = education_level
        self.school = school
        self.major = major
        self.skills = skills
        self.languages = languages
        self.certifications = certifications
        self.summary = summary
        self.status = status
        self.notes = notes
        self.rating = rating
        self.tags = tags
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
            "position": self.position,
            "experience_years": self.experience_years,
            "education_level": self.education_level,
            "school": self.school,
            "major": self.major,
            "skills": self.skills,
            "languages": self.languages,
            "certifications": self.certifications,
            "summary": self.summary,
            "status": self.status,
            "notes": self.notes,
            "rating": self.rating,
            "tags": self.tags,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CandidateModel':
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
            position=data.get("position"),
            experience_years=data.get("experience_years"),
            education_level=data.get("education_level"),
            school=data.get("school"),
            major=data.get("major"),
            skills=data.get("skills"),
            languages=data.get("languages"),
            certifications=data.get("certifications"),
            summary=data.get("summary"),
            status=data.get("status", "active"),
            notes=data.get("notes"),
            rating=data.get("rating"),
            tags=data.get("tags"),
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
            self.position,
            self.experience_years,
            self.education_level,
            self.school,
            self.major,
            self.skills,
            self.languages,
            self.certifications,
            self.summary,
            self.status,
            self.notes,
            self.rating,
            self.tags,
            self.created_at.isoformat(),
            self.updated_at.isoformat() if self.updated_at else None
        )
    
    @classmethod
    def from_row(cls, row) -> 'CandidateModel':
        """从数据库行创建实例"""
        return cls(
            id=row["id"],
            task_id=row["task_id"],
            name=row["name"],
            phone=row["phone"],
            email=row["email"],
            address=row["address"],
            position=row["position"],
            experience_years=row["experience_years"],
            education_level=row["education_level"],
            school=row["school"],
            major=row["major"],
            skills=row["skills"],
            languages=row["languages"],
            certifications=row["certifications"],
            summary=row["summary"],
            status=row["status"],
            notes=row["notes"],
            rating=row["rating"],
            tags=row["tags"],
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else None,
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else None
        )
    
    def update_info(self, **kwargs):
        """更新候选人信息"""
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
    
    def get_tags_list(self) -> List[str]:
        """获取标签列表"""
        if not self.tags:
            return []
        try:
            import json
            return json.loads(self.tags)
        except:
            return [tag.strip() for tag in self.tags.split(",") if tag.strip()]
    
    def set_tags_list(self, tags: List[str]):
        """设置标签列表"""
        import json
        self.tags = json.dumps(tags, ensure_ascii=False)
    
    def get_rating_stars(self) -> str:
        """获取评分星级"""
        if not self.rating:
            return "☆☆☆☆☆"
        return "★" * self.rating + "☆" * (5 - self.rating)
