"""
用户模型
"""
from datetime import datetime
from typing import Optional, Dict, Any
from database.models.base import BaseModel

class UserModel(BaseModel):
    """用户数据库模型"""
    
    def __init__(self,
                 id: Optional[int] = None,
                 username: str = None,
                 email: str = None,
                 password_hash: str = None,
                 full_name: Optional[str] = None,
                 avatar: Optional[str] = None,
                 phone: Optional[str] = None,
                 role: str = "user",  # user, admin
                 status: str = "active",  # active, inactive, banned
                 last_login: Optional[datetime] = None,
                 login_count: int = 0,
                 created_at: Optional[datetime] = None,
                 updated_at: Optional[datetime] = None,
                 **kwargs):
        super().__init__(**kwargs)
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.full_name = full_name
        self.avatar = avatar
        self.phone = phone
        self.role = role
        self.status = status
        self.last_login = last_login
        self.login_count = login_count
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "avatar": self.avatar,
            "phone": self.phone,
            "role": self.role,
            "status": self.status,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "login_count": self.login_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserModel':
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
        
        last_login = None
        if data.get("last_login"):
            if isinstance(data["last_login"], str):
                last_login = datetime.fromisoformat(data["last_login"])
            else:
                last_login = data["last_login"]
        
        return cls(
            id=data.get("id"),
            username=data["username"],
            email=data["email"],
            password_hash=data.get("password_hash"),
            full_name=data.get("full_name"),
            avatar=data.get("avatar"),
            phone=data.get("phone"),
            role=data.get("role", "user"),
            status=data.get("status", "active"),
            last_login=last_login,
            login_count=data.get("login_count", 0),
            created_at=created_at,
            updated_at=updated_at
        )
    
    def to_tuple(self) -> tuple:
        """转换为元组（用于数据库插入）"""
        return (
            self.username,
            self.email,
            self.password_hash,
            self.full_name,
            self.avatar,
            self.phone,
            self.role,
            self.status,
            self.last_login.isoformat() if self.last_login else None,
            self.login_count,
            self.created_at.isoformat(),
            self.updated_at.isoformat() if self.updated_at else None
        )
    
    @classmethod
    def from_row(cls, row) -> 'UserModel':
        """从数据库行创建实例"""
        return cls(
            id=row["id"],
            username=row["username"],
            email=row["email"],
            password_hash=row["password_hash"],
            full_name=row["full_name"],
            avatar=row["avatar"],
            phone=row["phone"],
            role=row["role"],
            status=row["status"],
            last_login=datetime.fromisoformat(row["last_login"]) if row["last_login"] else None,
            login_count=row["login_count"],
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else None,
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else None
        )
    
    def update_info(self, **kwargs):
        """更新用户信息"""
        for key, value in kwargs.items():
            if hasattr(self, key) and key not in ['id', 'created_at', 'password_hash']:
                setattr(self, key, value)
        self.updated_at = datetime.now()
    
    def update_password(self, password_hash: str):
        """更新密码"""
        self.password_hash = password_hash
        self.updated_at = datetime.now()
    
    def update_login_info(self):
        """更新登录信息"""
        self.last_login = datetime.now()
        self.login_count += 1
        self.updated_at = datetime.now()
    
    def is_admin(self) -> bool:
        """检查是否为管理员"""
        return self.role == "admin"
    
    def is_active(self) -> bool:
        """检查账户是否激活"""
        return self.status == "active"
    
    def get_display_name(self) -> str:
        """获取显示名称"""
        return self.full_name or self.username

