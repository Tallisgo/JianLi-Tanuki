"""
用户业务逻辑服务
"""
import hashlib
import secrets
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from database.models.user import UserModel
from database.repositories.user_repository import UserRepository

class UserService:
    """用户业务逻辑服务"""
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def hash_password(self, password: str) -> str:
        """密码哈希"""
        # 使用scrypt算法进行密码哈希
        salt = secrets.token_hex(8)  # 减少salt长度
        password_hash = hashlib.scrypt(
            password.encode('utf-8'),
            salt=salt.encode('utf-8'),
            n=16384,  # 减少CPU/内存成本参数
            r=8,      # 块大小参数
            p=1,      # 并行化参数
            dklen=32  # 输出长度
        )
        return f"scrypt:16384:8:1${salt}${password_hash.hex()}"
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """验证密码"""
        try:
            # 解析哈希格式: scrypt:n:r:p$salt$hash
            parts = password_hash.split('$')
            if len(parts) != 3:
                return False
            
            algorithm_part = parts[0]
            salt = parts[1]
            stored_hash = parts[2]
            
            # 解析算法参数
            algo_parts = algorithm_part.split(':')
            if len(algo_parts) != 4 or algo_parts[0] != 'scrypt':
                return False
            
            n = int(algo_parts[1])
            r = int(algo_parts[2])
            p = int(algo_parts[3])
            
            # 计算密码哈希
            computed_hash = hashlib.scrypt(
                password.encode('utf-8'),
                salt=salt.encode('utf-8'),
                n=n,
                r=r,
                p=p,
                dklen=32
            )
            
            return computed_hash.hex() == stored_hash
        except Exception:
            return False
    
    def validate_username(self, username: str) -> bool:
        """验证用户名格式"""
        if not username or len(username) < 3 or len(username) > 20:
            return False
        
        # 用户名只能包含字母、数字、下划线
        pattern = r'^[a-zA-Z0-9_]+$'
        return bool(re.match(pattern, username))
    
    def validate_email(self, email: str) -> bool:
        """验证邮箱格式"""
        if not email:
            return False
        
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def validate_password(self, password: str) -> bool:
        """验证密码强度"""
        if not password or len(password) < 6:
            return False
        
        # 密码必须包含至少一个字母和一个数字
        has_letter = bool(re.search(r'[a-zA-Z]', password))
        has_digit = bool(re.search(r'\d', password))
        
        return has_letter and has_digit
    
    def register_user(self, username: str, email: str, password: str, 
                     full_name: Optional[str] = None, phone: Optional[str] = None) -> Dict[str, Any]:
        """用户注册"""
        try:
            # 验证输入
            if not self.validate_username(username):
                return {"success": False, "message": "用户名格式不正确（3-20位字母、数字、下划线）"}
            
            if not self.validate_email(email):
                return {"success": False, "message": "邮箱格式不正确"}
            
            if not self.validate_password(password):
                return {"success": False, "message": "密码强度不够（至少6位，包含字母和数字）"}
            
            # 检查用户名是否已存在
            if self.user_repo.get_by_username(username):
                return {"success": False, "message": "用户名已存在"}
            
            # 检查邮箱是否已存在
            if self.user_repo.get_by_email(email):
                return {"success": False, "message": "邮箱已被注册"}
            
            # 创建用户
            user = UserModel(
                username=username,
                email=email,
                password_hash=self.hash_password(password),
                full_name=full_name,
                phone=phone,
                role="user",
                status="active"
            )
            
            created_user = self.user_repo.create(user)
            if created_user:
                return {
                    "success": True,
                    "message": "注册成功",
                    "user": created_user.to_dict()
                }
            else:
                return {"success": False, "message": "注册失败，请重试"}
                
        except Exception as e:
            return {"success": False, "message": f"注册失败: {str(e)}"}
    
    def authenticate_user(self, username_or_email: str, password: str) -> Dict[str, Any]:
        """用户认证"""
        try:
            # 根据用户名或邮箱查找用户
            user = self.user_repo.get_by_username(username_or_email)
            if not user:
                user = self.user_repo.get_by_email(username_or_email)
            
            if not user:
                return {"success": False, "message": "用户不存在"}
            
            # 验证密码
            if not self.verify_password(password, user.password_hash):
                return {"success": False, "message": "密码错误"}
            
            # 检查账户状态
            if not user.is_active():
                return {"success": False, "message": "账户已被禁用"}
            
            # 更新登录信息
            user.update_login_info()
            self.user_repo.update(user)
            
            return {
                "success": True,
                "message": "登录成功",
                "user": user.to_dict()
            }
            
        except Exception as e:
            return {"success": False, "message": f"登录失败: {str(e)}"}
    
    def get_user_by_id(self, user_id: int) -> Optional[UserModel]:
        """根据ID获取用户"""
        return self.user_repo.get_by_id(user_id)
    
    def get_user_by_username(self, username: str) -> Optional[UserModel]:
        """根据用户名获取用户"""
        return self.user_repo.get_by_username(username)
    
    def get_user_by_email(self, email: str) -> Optional[UserModel]:
        """根据邮箱获取用户"""
        return self.user_repo.get_by_email(email)
    
    def update_user_profile(self, user_id: int, **kwargs) -> Dict[str, Any]:
        """更新用户资料"""
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return {"success": False, "message": "用户不存在"}
            
            # 验证邮箱格式（如果提供）
            if 'email' in kwargs and not self.validate_email(kwargs['email']):
                return {"success": False, "message": "邮箱格式不正确"}
            
            # 检查邮箱是否已被其他用户使用
            if 'email' in kwargs and kwargs['email'] != user.email:
                existing_user = self.user_repo.get_by_email(kwargs['email'])
                if existing_user and existing_user.id != user_id:
                    return {"success": False, "message": "邮箱已被其他用户使用"}
            
            # 更新用户信息
            user.update_info(**kwargs)
            
            if self.user_repo.update(user):
                return {
                    "success": True,
                    "message": "资料更新成功",
                    "user": user.to_dict()
                }
            else:
                return {"success": False, "message": "资料更新失败"}
                
        except Exception as e:
            return {"success": False, "message": f"更新失败: {str(e)}"}
    
    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        """修改密码"""
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return {"success": False, "message": "用户不存在"}
            
            # 验证旧密码
            if not self.verify_password(old_password, user.password_hash):
                return {"success": False, "message": "原密码错误"}
            
            # 验证新密码
            if not self.validate_password(new_password):
                return {"success": False, "message": "新密码强度不够（至少6位，包含字母和数字）"}
            
            # 更新密码
            user.update_password(self.hash_password(new_password))
            
            if self.user_repo.update(user):
                return {"success": True, "message": "密码修改成功"}
            else:
                return {"success": False, "message": "密码修改失败"}
                
        except Exception as e:
            return {"success": False, "message": f"密码修改失败: {str(e)}"}
    
    def get_all_users(self, limit: int = 100, offset: int = 0) -> List[UserModel]:
        """获取所有用户"""
        return self.user_repo.get_all(limit, offset)
    
    def search_users(self, query: str, limit: int = 100, offset: int = 0) -> List[UserModel]:
        """搜索用户"""
        return self.user_repo.search(query, limit, offset)
    
    def get_users_by_role(self, role: str, limit: int = 100, offset: int = 0) -> List[UserModel]:
        """根据角色获取用户"""
        return self.user_repo.get_by_role(role, limit, offset)
    
    def get_active_users(self, limit: int = 100, offset: int = 0) -> List[UserModel]:
        """获取活跃用户"""
        return self.user_repo.get_active_users(limit, offset)
    
    def update_user_status(self, user_id: int, status: str) -> Dict[str, Any]:
        """更新用户状态"""
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return {"success": False, "message": "用户不存在"}
            
            if status not in ['active', 'inactive', 'banned']:
                return {"success": False, "message": "无效的状态值"}
            
            user.status = status
            user.updated_at = datetime.now()
            
            if self.user_repo.update(user):
                return {
                    "success": True,
                    "message": "状态更新成功",
                    "user": user.to_dict()
                }
            else:
                return {"success": False, "message": "状态更新失败"}
                
        except Exception as e:
            return {"success": False, "message": f"状态更新失败: {str(e)}"}
    
    def update_user_role(self, user_id: int, role: str) -> Dict[str, Any]:
        """更新用户角色"""
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return {"success": False, "message": "用户不存在"}
            
            if role not in ['user', 'admin']:
                return {"success": False, "message": "无效的角色值"}
            
            user.role = role
            user.updated_at = datetime.now()
            
            if self.user_repo.update(user):
                return {
                    "success": True,
                    "message": "角色更新成功",
                    "user": user.to_dict()
                }
            else:
                return {"success": False, "message": "角色更新失败"}
                
        except Exception as e:
            return {"success": False, "message": f"角色更新失败: {str(e)}"}
    
    def delete_user(self, user_id: int) -> Dict[str, Any]:
        """删除用户"""
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return {"success": False, "message": "用户不存在"}
            
            if self.user_repo.delete(user_id):
                return {"success": True, "message": "用户删除成功"}
            else:
                return {"success": False, "message": "用户删除失败"}
                
        except Exception as e:
            return {"success": False, "message": f"用户删除失败: {str(e)}"}
    
    def get_user_statistics(self) -> Dict[str, Any]:
        """获取用户统计信息"""
        try:
            total_users = self.user_repo.count()
            admin_users = self.user_repo.count_by_role('admin')
            regular_users = self.user_repo.count_by_role('user')
            
            return {
                "total_users": total_users,
                "admin_users": admin_users,
                "regular_users": regular_users,
                "user_ratio": {
                    "admin": round(admin_users / total_users * 100, 2) if total_users > 0 else 0,
                    "regular": round(regular_users / total_users * 100, 2) if total_users > 0 else 0
                }
            }
        except Exception as e:
            return {
                "total_users": 0,
                "admin_users": 0,
                "regular_users": 0,
                "user_ratio": {"admin": 0, "regular": 0}
            }
