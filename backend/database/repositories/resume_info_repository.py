"""
简历信息数据访问层
"""
from typing import List, Optional, Dict, Any
from database.repositories.base_repository import BaseRepository
from database.models.resume_info import ResumeInfoModel

class ResumeInfoRepository(BaseRepository[ResumeInfoModel]):
    """简历信息数据访问层"""
    
    def __init__(self):
        super().__init__(ResumeInfoModel)
        self.table_name = "resume_info"
    
    def create(self, model: ResumeInfoModel) -> bool:
        """创建简历信息记录"""
        sql = f"""
        INSERT INTO {self.table_name} 
        (task_id, name, phone, email, address, education, experience, projects, 
         skills, languages, certifications, summary, other, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        try:
            self.connection.execute_update(sql, model.to_tuple())
            return True
        except Exception as e:
            print(f"创建简历信息失败: {e}")
            return False
    
    def get_by_id(self, id: int) -> Optional[ResumeInfoModel]:
        """根据ID获取简历信息"""
        sql = f"SELECT * FROM {self.table_name} WHERE id = ?"
        try:
            rows = self.connection.execute_query(sql, (id,))
            if rows:
                return ResumeInfoModel.from_row(rows[0])
            return None
        except Exception as e:
            print(f"获取简历信息失败: {e}")
            return None
    
    def get_by_task_id(self, task_id: str) -> Optional[ResumeInfoModel]:
        """根据任务ID获取简历信息"""
        sql = f"SELECT * FROM {self.table_name} WHERE task_id = ?"
        try:
            rows = self.connection.execute_query(sql, (task_id,))
            if rows:
                return ResumeInfoModel.from_row(rows[0])
            return None
        except Exception as e:
            print(f"根据任务ID获取简历信息失败: {e}")
            return None
    
    def get_all(self, limit: int = 100, offset: int = 0) -> List[ResumeInfoModel]:
        """获取所有简历信息"""
        sql = f"""
        SELECT * FROM {self.table_name} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
        """
        try:
            rows = self.connection.execute_query(sql, (limit, offset))
            return [ResumeInfoModel.from_row(row) for row in rows]
        except Exception as e:
            print(f"获取简历信息列表失败: {e}")
            return []
    
    def update(self, model: ResumeInfoModel) -> bool:
        """更新简历信息"""
        sql = f"""
        UPDATE {self.table_name} 
        SET task_id = ?, name = ?, phone = ?, email = ?, address = ?, 
            education = ?, experience = ?, projects = ?, skills = ?, 
            languages = ?, certifications = ?, summary = ?, other = ?, 
            updated_at = ?
        WHERE id = ?
        """
        try:
            params = (
                model.task_id, model.name, model.phone, model.email, model.address,
                model.education, model.experience, model.projects, model.skills,
                model.languages, model.certifications, model.summary, model.other,
                model.updated_at.isoformat() if model.updated_at else None,
                model.id
            )
            affected_rows = self.connection.execute_update(sql, params)
            return affected_rows > 0
        except Exception as e:
            print(f"更新简历信息失败: {e}")
            return False
    
    def delete(self, id: int) -> bool:
        """删除简历信息"""
        sql = f"DELETE FROM {self.table_name} WHERE id = ?"
        try:
            affected_rows = self.connection.execute_update(sql, (id,))
            return affected_rows > 0
        except Exception as e:
            print(f"删除简历信息失败: {e}")
            return False
    
    def delete_by_task_id(self, task_id: str) -> bool:
        """根据任务ID删除简历信息"""
        sql = f"DELETE FROM {self.table_name} WHERE task_id = ?"
        try:
            affected_rows = self.connection.execute_update(sql, (task_id,))
            return affected_rows > 0
        except Exception as e:
            print(f"根据任务ID删除简历信息失败: {e}")
            return False
    
    def count(self) -> int:
        """获取简历信息总数"""
        sql = f"SELECT COUNT(*) as count FROM {self.table_name}"
        try:
            rows = self.connection.execute_query(sql)
            return rows[0]["count"] if rows else 0
        except Exception as e:
            print(f"获取简历信息总数失败: {e}")
            return 0
    
    def search(self, filters: Dict[str, Any], limit: int = 100, offset: int = 0) -> List[ResumeInfoModel]:
        """搜索简历信息"""
        where_conditions = []
        params = []
        
        if filters.get("name"):
            where_conditions.append("name LIKE ?")
            params.append(f"%{filters['name']}%")
        
        if filters.get("phone"):
            where_conditions.append("phone LIKE ?")
            params.append(f"%{filters['phone']}%")
        
        if filters.get("email"):
            where_conditions.append("email LIKE ?")
            params.append(f"%{filters['email']}%")
        
        if filters.get("skills"):
            where_conditions.append("skills LIKE ?")
            params.append(f"%{filters['skills']}%")
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        sql = f"""
        SELECT * FROM {self.table_name} 
        {where_clause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        try:
            rows = self.connection.execute_query(sql, tuple(params))
            return [ResumeInfoModel.from_row(row) for row in rows]
        except Exception as e:
            print(f"搜索简历信息失败: {e}")
            return []
    
    def get_by_name(self, name: str, limit: int = 100, offset: int = 0) -> List[ResumeInfoModel]:
        """根据姓名搜索简历信息"""
        return self.search({"name": name}, limit, offset)
    
    def get_by_phone(self, phone: str) -> Optional[ResumeInfoModel]:
        """根据电话号码获取简历信息"""
        sql = f"SELECT * FROM {self.table_name} WHERE phone = ?"
        try:
            rows = self.connection.execute_query(sql, (phone,))
            if rows:
                return ResumeInfoModel.from_row(rows[0])
            return None
        except Exception as e:
            print(f"根据电话号码获取简历信息失败: {e}")
            return None
    
    def get_by_email(self, email: str) -> Optional[ResumeInfoModel]:
        """根据邮箱获取简历信息"""
        sql = f"SELECT * FROM {self.table_name} WHERE email = ?"
        try:
            rows = self.connection.execute_query(sql, (email,))
            if rows:
                return ResumeInfoModel.from_row(rows[0])
            return None
        except Exception as e:
            print(f"根据邮箱获取简历信息失败: {e}")
            return None
    
    def get_skills_statistics(self) -> Dict[str, int]:
        """获取技能统计信息"""
        sql = f"""
        SELECT skills FROM {self.table_name} 
        WHERE skills IS NOT NULL AND skills != ''
        """
        try:
            rows = self.connection.execute_query(sql)
            skill_counts = {}
            
            for row in rows:
                skills = row["skills"]
                if skills:
                    try:
                        import json
                        skill_list = json.loads(skills)
                    except:
                        skill_list = [skill.strip() for skill in skills.split(",") if skill.strip()]
                    
                    for skill in skill_list:
                        skill = skill.strip()
                        if skill:
                            skill_counts[skill] = skill_counts.get(skill, 0) + 1
            
            # 按出现次数排序
            sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)
            return dict(sorted_skills[:20])  # 返回前20个热门技能
            
        except Exception as e:
            print(f"获取技能统计失败: {e}")
            return {}
    
    def create_or_update_from_resume_info(self, task_id: str, resume_info_data: Dict[str, Any]) -> bool:
        """从简历信息数据创建或更新记录"""
        try:
            # 检查是否已存在
            existing = self.get_by_task_id(task_id)
            
            if existing:
                # 更新现有记录
                existing.update_info(**resume_info_data)
                return self.update(existing)
            else:
                # 创建新记录
                new_resume = ResumeInfoModel(
                    task_id=task_id,
                    **resume_info_data
                )
                return self.create(new_resume)
                
        except Exception as e:
            print(f"创建或更新简历信息失败: {e}")
            return False
