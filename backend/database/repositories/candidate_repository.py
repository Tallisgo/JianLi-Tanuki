"""
候选人数据访问层
"""
from typing import List, Optional, Dict, Any
from database.repositories.base_repository import BaseRepository
from database.models.candidate import CandidateModel

class CandidateRepository(BaseRepository[CandidateModel]):
    """候选人数据访问层"""
    
    def __init__(self):
        super().__init__(CandidateModel)
        self.table_name = "candidates"
    
    def create(self, model: CandidateModel) -> bool:
        """创建候选人记录"""
        sql = f"""
        INSERT INTO {self.table_name} 
        (task_id, name, phone, email, address, position, experience_years, 
         education_level, school, major, skills, languages, certifications, 
         summary, status, notes, rating, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        try:
            self.connection.execute_update(sql, model.to_tuple())
            return True
        except Exception as e:
            print(f"创建候选人失败: {e}")
            return False
    
    def get_by_id(self, id: int) -> Optional[CandidateModel]:
        """根据ID获取候选人"""
        sql = f"SELECT * FROM {self.table_name} WHERE id = ?"
        try:
            rows = self.connection.execute_query(sql, (id,))
            if rows:
                return CandidateModel.from_row(rows[0])
            return None
        except Exception as e:
            print(f"获取候选人失败: {e}")
            return None
    
    def get_by_task_id(self, task_id: str) -> Optional[CandidateModel]:
        """根据任务ID获取候选人"""
        sql = f"SELECT * FROM {self.table_name} WHERE task_id = ?"
        try:
            rows = self.connection.execute_query(sql, (task_id,))
            if rows:
                return CandidateModel.from_row(rows[0])
            return None
        except Exception as e:
            print(f"根据任务ID获取候选人失败: {e}")
            return None
    
    def get_all(self, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """获取所有候选人"""
        sql = f"""
        SELECT * FROM {self.table_name} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
        """
        try:
            rows = self.connection.execute_query(sql, (limit, offset))
            return [CandidateModel.from_row(row) for row in rows]
        except Exception as e:
            print(f"获取候选人列表失败: {e}")
            return []
    
    def update(self, model: CandidateModel) -> bool:
        """更新候选人"""
        sql = f"""
        UPDATE {self.table_name} 
        SET task_id = ?, name = ?, phone = ?, email = ?, address = ?, 
            position = ?, experience_years = ?, education_level = ?, 
            school = ?, major = ?, skills = ?, languages = ?, 
            certifications = ?, summary = ?, status = ?, notes = ?, 
            rating = ?, tags = ?, updated_at = ?
        WHERE id = ?
        """
        try:
            params = (
                model.task_id, model.name, model.phone, model.email, model.address,
                model.position, model.experience_years, model.education_level,
                model.school, model.major, model.skills, model.languages,
                model.certifications, model.summary, model.status, model.notes,
                model.rating, model.tags, model.updated_at.isoformat() if model.updated_at else None,
                model.id
            )
            affected_rows = self.connection.execute_update(sql, params)
            return affected_rows > 0
        except Exception as e:
            print(f"更新候选人失败: {e}")
            return False
    
    def delete(self, id: int) -> bool:
        """删除候选人"""
        sql = f"DELETE FROM {self.table_name} WHERE id = ?"
        try:
            affected_rows = self.connection.execute_update(sql, (id,))
            return affected_rows > 0
        except Exception as e:
            print(f"删除候选人失败: {e}")
            return False
    
    def delete_by_task_id(self, task_id: str) -> bool:
        """根据任务ID删除候选人"""
        sql = f"DELETE FROM {self.table_name} WHERE task_id = ?"
        try:
            affected_rows = self.connection.execute_update(sql, (task_id,))
            return affected_rows > 0
        except Exception as e:
            print(f"根据任务ID删除候选人失败: {e}")
            return False
    
    def count(self) -> int:
        """获取候选人总数"""
        sql = f"SELECT COUNT(*) as count FROM {self.table_name}"
        try:
            rows = self.connection.execute_query(sql)
            return rows[0]["count"] if rows else 0
        except Exception as e:
            print(f"获取候选人总数失败: {e}")
            return 0
    
    def search(self, filters: Dict[str, Any], limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """搜索候选人"""
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
        
        if filters.get("position"):
            where_conditions.append("position LIKE ?")
            params.append(f"%{filters['position']}%")
        
        if filters.get("status"):
            where_conditions.append("status = ?")
            params.append(filters["status"])
        
        if filters.get("experience_years_min"):
            where_conditions.append("experience_years >= ?")
            params.append(filters["experience_years_min"])
        
        if filters.get("experience_years_max"):
            where_conditions.append("experience_years <= ?")
            params.append(filters["experience_years_max"])
        
        if filters.get("skills"):
            where_conditions.append("skills LIKE ?")
            params.append(f"%{filters['skills']}%")
        
        if filters.get("education_level"):
            where_conditions.append("education_level = ?")
            params.append(filters["education_level"])
        
        if filters.get("rating_min"):
            where_conditions.append("rating >= ?")
            params.append(filters["rating_min"])
        
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
            return [CandidateModel.from_row(row) for row in rows]
        except Exception as e:
            print(f"搜索候选人失败: {e}")
            return []
    
    def get_by_name(self, name: str, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """根据姓名搜索候选人"""
        return self.search({"name": name}, limit, offset)
    
    def get_by_position(self, position: str, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """根据职位搜索候选人"""
        return self.search({"position": position}, limit, offset)
    
    def get_by_status(self, status: str, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """根据状态获取候选人"""
        return self.search({"status": status}, limit, offset)
    
    def get_active_candidates(self, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """获取活跃候选人"""
        return self.get_by_status("active", limit, offset)
    
    def get_by_experience_range(self, min_years: int, max_years: int, 
                               limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """根据经验年限范围获取候选人"""
        return self.search({
            "experience_years_min": min_years,
            "experience_years_max": max_years
        }, limit, offset)
    
    def get_by_skills(self, skills: List[str], limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """根据技能搜索候选人"""
        candidates = []
        for skill in skills:
            skill_candidates = self.search({"skills": skill}, limit, offset)
            candidates.extend(skill_candidates)
        
        # 去重
        seen_ids = set()
        unique_candidates = []
        for candidate in candidates:
            if candidate.id not in seen_ids:
                seen_ids.add(candidate.id)
                unique_candidates.append(candidate)
        
        return unique_candidates[:limit]
    
    def get_top_rated_candidates(self, limit: int = 10) -> List[CandidateModel]:
        """获取评分最高的候选人"""
        sql = f"""
        SELECT * FROM {self.table_name} 
        WHERE rating IS NOT NULL 
        ORDER BY rating DESC, created_at DESC 
        LIMIT ?
        """
        try:
            rows = self.connection.execute_query(sql, (limit,))
            return [CandidateModel.from_row(row) for row in rows]
        except Exception as e:
            print(f"获取高评分候选人失败: {e}")
            return []
    
    def get_recent_candidates(self, days: int = 7, limit: int = 100) -> List[CandidateModel]:
        """获取最近添加的候选人"""
        sql = f"""
        SELECT * FROM {self.table_name} 
        WHERE created_at >= datetime('now', '-{days} days')
        ORDER BY created_at DESC 
        LIMIT ?
        """
        try:
            rows = self.connection.execute_query(sql, (limit,))
            return [CandidateModel.from_row(row) for row in rows]
        except Exception as e:
            print(f"获取最近候选人失败: {e}")
            return []
    
    def get_statistics(self) -> Dict[str, Any]:
        """获取候选人统计信息"""
        sql = f"""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
            AVG(rating) as avg_rating,
            AVG(experience_years) as avg_experience
        FROM {self.table_name}
        """
        try:
            rows = self.connection.execute_query(sql)
            if rows:
                row = rows[0]
                return {
                    "total": row["total"] or 0,
                    "active": row["active"] or 0,
                    "inactive": row["inactive"] or 0,
                    "avg_rating": round(row["avg_rating"] or 0, 2),
                    "avg_experience": round(row["avg_experience"] or 0, 1)
                }
            
            return {"total": 0, "active": 0, "inactive": 0, "avg_rating": 0, "avg_experience": 0}
            
        except Exception as e:
            print(f"获取候选人统计失败: {e}")
            return {"total": 0, "active": 0, "inactive": 0, "avg_rating": 0, "avg_experience": 0}
    
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
    
    def create_from_resume_info(self, task_id: str, resume_info: Dict[str, Any]) -> bool:
        """从简历信息创建候选人记录"""
        try:
            # 提取候选人相关信息
            candidate_data = {
                "task_id": task_id,
                "name": resume_info.get("name"),
                "phone": resume_info.get("phone"),
                "email": resume_info.get("email"),
                "address": resume_info.get("address"),
                "summary": resume_info.get("summary"),
                "skills": resume_info.get("skills"),
                "languages": resume_info.get("languages"),
                "certifications": resume_info.get("certifications"),
                "status": "active"
            }
            
            # 从工作经历中提取职位和经验
            if resume_info.get("experience"):
                try:
                    import json
                    experiences = json.loads(resume_info["experience"]) if isinstance(resume_info["experience"], str) else resume_info["experience"]
                    if experiences and len(experiences) > 0:
                        latest_exp = experiences[0]  # 假设第一个是最新的
                        candidate_data["position"] = latest_exp.get("title")
                        # 计算经验年限（简化处理）
                        if latest_exp.get("start_date") and latest_exp.get("end_date"):
                            candidate_data["experience_years"] = 3  # 默认值，实际应该计算
                except:
                    pass
            
            # 从教育背景中提取信息
            if resume_info.get("education"):
                try:
                    import json
                    educations = json.loads(resume_info["education"]) if isinstance(resume_info["education"], str) else resume_info["education"]
                    if educations and len(educations) > 0:
                        latest_edu = educations[0]  # 假设第一个是最新的
                        candidate_data["school"] = latest_edu.get("institution")
                        candidate_data["major"] = latest_edu.get("major")
                        candidate_data["education_level"] = latest_edu.get("degree")
                except:
                    pass
            
            # 创建候选人记录
            candidate = CandidateModel(**candidate_data)
            return self.create(candidate)
            
        except Exception as e:
            print(f"从简历信息创建候选人失败: {e}")
            return False
