"""
用户数据访问层
"""
from typing import List, Optional, Dict, Any
from database.repositories.base_repository import BaseRepository
from database.models.user import UserModel
from database.config.connection import db_connection

class UserRepository(BaseRepository[UserModel]):
    """用户数据访问层"""
    
    def __init__(self):
        super().__init__(UserModel)
        self.table_name = "users"
    
    def create(self, user: UserModel) -> Optional[UserModel]:
        """创建用户"""
        try:
            # 检查用户名和邮箱是否已存在
            if self.get_by_username(user.username):
                raise ValueError("用户名已存在")
            
            if self.get_by_email(user.email):
                raise ValueError("邮箱已存在")
            
            # 插入用户数据
            user_id = db_connection.execute_insert(f"""
                INSERT INTO {self.table_name} (
                    username, email, password_hash, full_name, avatar, phone,
                    role, status, last_login, login_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, user.to_tuple())
            
            user.id = user_id
            return user
        except Exception as e:
            print(f"创建用户失败: {e}")
            return None
    
    def get_by_id(self, user_id: int) -> Optional[UserModel]:
        """根据ID获取用户"""
        try:
            rows = db_connection.execute_query(f"SELECT * FROM {self.table_name} WHERE id = ?", (user_id,))
            
            if rows:
                return UserModel.from_row(dict(rows[0]))
            return None
        except Exception as e:
            print(f"获取用户失败: {e}")
            return None
    
    def get_by_username(self, username: str) -> Optional[UserModel]:
        """根据用户名获取用户"""
        try:
            rows = db_connection.execute_query(f"SELECT * FROM {self.table_name} WHERE username = ?", (username,))
            
            if rows:
                return UserModel.from_row(dict(rows[0]))
            return None
        except Exception as e:
            print(f"根据用户名获取用户失败: {e}")
            return None
    
    def get_by_email(self, email: str) -> Optional[UserModel]:
        """根据邮箱获取用户"""
        try:
            rows = db_connection.execute_query(f"SELECT * FROM {self.table_name} WHERE email = ?", (email,))
            
            if rows:
                return UserModel.from_row(dict(rows[0]))
            return None
        except Exception as e:
            print(f"根据邮箱获取用户失败: {e}")
            return None
    
    def get_all(self, limit: int = 100, offset: int = 0) -> List[UserModel]:
        """获取所有用户"""
        try:
            rows = db_connection.execute_query(f"""
                SELECT * FROM {self.table_name} 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            """, (limit, offset))
            
            users = []
            for row in rows:
                user = UserModel.from_row(dict(row))
                users.append(user)
            
            return users
        except Exception as e:
            print(f"获取用户列表失败: {e}")
            return []
    
    def update(self, user: UserModel) -> bool:
        """更新用户"""
        try:
            affected_rows = db_connection.execute_update(f"""
                UPDATE {self.table_name} SET
                    username = ?, email = ?, password_hash = ?, full_name = ?,
                    avatar = ?, phone = ?, role = ?, status = ?, last_login = ?,
                    login_count = ?, updated_at = ?
                WHERE id = ?
            """, (
                user.username, user.email, user.password_hash, user.full_name,
                user.avatar, user.phone, user.role, user.status,
                user.last_login.isoformat() if user.last_login else None,
                user.login_count, user.updated_at.isoformat(), user.id
            ))
            
            return affected_rows > 0
        except Exception as e:
            print(f"更新用户失败: {e}")
            return False
    
    def delete(self, user_id: int) -> bool:
        """删除用户"""
        try:
            affected_rows = db_connection.execute_update(f"DELETE FROM {self.table_name} WHERE id = ?", (user_id,))
            return affected_rows > 0
        except Exception as e:
            print(f"删除用户失败: {e}")
            return False
    
    def search(self, query: str, limit: int = 100, offset: int = 0) -> List[UserModel]:
        """搜索用户"""
        try:
            search_query = f"%{query}%"
            rows = db_connection.execute_query(f"""
                SELECT * FROM {self.table_name} 
                WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            """, (search_query, search_query, search_query, limit, offset))
            
            users = []
            for row in rows:
                user = UserModel.from_row(dict(row))
                users.append(user)
            
            return users
        except Exception as e:
            print(f"搜索用户失败: {e}")
            return []
    
    def get_by_role(self, role: str, limit: int = 100, offset: int = 0) -> List[UserModel]:
        """根据角色获取用户"""
        try:
            rows = db_connection.execute_query(f"""
                SELECT * FROM {self.table_name} 
                WHERE role = ?
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            """, (role, limit, offset))
            
            users = []
            for row in rows:
                user = UserModel.from_row(dict(row))
                users.append(user)
            
            return users
        except Exception as e:
            print(f"根据角色获取用户失败: {e}")
            return []
    
    def get_active_users(self, limit: int = 100, offset: int = 0) -> List[UserModel]:
        """获取活跃用户"""
        try:
            rows = db_connection.execute_query(f"""
                SELECT * FROM {self.table_name} 
                WHERE status = 'active'
                ORDER BY last_login DESC, created_at DESC 
                LIMIT ? OFFSET ?
            """, (limit, offset))
            
            users = []
            for row in rows:
                user = UserModel.from_row(dict(row))
                users.append(user)
            
            return users
        except Exception as e:
            print(f"获取活跃用户失败: {e}")
            return []
    
    def count(self) -> int:
        """获取用户总数"""
        try:
            rows = db_connection.execute_query(f"SELECT COUNT(*) as count FROM {self.table_name}")
            return rows[0]['count'] if rows else 0
        except Exception as e:
            print(f"获取用户总数失败: {e}")
            return 0
    
    def count_by_role(self, role: str) -> int:
        """根据角色获取用户数量"""
        try:
            rows = db_connection.execute_query(f"SELECT COUNT(*) as count FROM {self.table_name} WHERE role = ?", (role,))
            return rows[0]['count'] if rows else 0
        except Exception as e:
            print(f"根据角色获取用户数量失败: {e}")
            return 0