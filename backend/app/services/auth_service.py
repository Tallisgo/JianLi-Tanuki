"""
用户认证服务
"""
import jwt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.core.config import Settings
from app.services.user_service import UserService

class AuthService:
    """用户认证服务"""
    
    def __init__(self):
        self.user_service = UserService()
        self.secret_key = Settings.SECRET_KEY if hasattr(Settings, 'SECRET_KEY') else "your-secret-key-here"
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 7
    
    def create_access_token(self, user_id: int, username: str, role: str) -> str:
        """创建访问令牌"""
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        payload = {
            "user_id": user_id,
            "username": username,
            "role": role,
            "type": "access",
            "exp": expire,
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user_id: int) -> str:
        """创建刷新令牌"""
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        payload = {
            "user_id": user_id,
            "type": "refresh",
            "exp": expire,
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """验证令牌"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """刷新访问令牌"""
        payload = self.verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        
        user_id = payload.get("user_id")
        user = self.user_service.get_user_by_id(user_id)
        if not user or not user.is_active():
            return None
        
        return self.create_access_token(user.id, user.username, user.role)
    
    def authenticate_user(self, username_or_email: str, password: str) -> Dict[str, Any]:
        """用户认证并生成令牌"""
        auth_result = self.user_service.authenticate_user(username_or_email, password)
        
        if not auth_result["success"]:
            return auth_result
        
        user_data = auth_result["user"]
        user_id = user_data["id"]
        username = user_data["username"]
        role = user_data["role"]
        
        # 生成令牌
        access_token = self.create_access_token(user_id, username, role)
        refresh_token = self.create_refresh_token(user_id)
        
        return {
            "success": True,
            "message": "登录成功",
            "user": user_data,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60
        }
    
    def get_current_user(self, token: str) -> Optional[Dict[str, Any]]:
        """从令牌获取当前用户信息"""
        payload = self.verify_token(token)
        if not payload or payload.get("type") != "access":
            return None
        
        user_id = payload.get("user_id")
        user = self.user_service.get_user_by_id(user_id)
        if not user or not user.is_active():
            return None
        
        return user.to_dict()
    
    def logout_user(self, token: str) -> bool:
        """用户登出"""
        # 在实际应用中，这里可以将令牌加入黑名单
        # 或者从数据库中删除会话记录
        return True
    
    def is_admin(self, token: str) -> bool:
        """检查用户是否为管理员"""
        payload = self.verify_token(token)
        if not payload:
            return False
        
        return payload.get("role") == "admin"
    
    def require_auth(self, token: str) -> Optional[Dict[str, Any]]:
        """要求认证（装饰器辅助函数）"""
        if not token:
            return None
        
        # 移除Bearer前缀
        if token.startswith("Bearer "):
            token = token[7:]
        
        return self.get_current_user(token)
    
    def require_admin(self, token: str) -> Optional[Dict[str, Any]]:
        """要求管理员权限（装饰器辅助函数）"""
        user = self.require_auth(token)
        if not user or user.get("role") != "admin":
            return None
        
        return user



