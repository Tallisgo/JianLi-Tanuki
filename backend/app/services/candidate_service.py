"""
候选人管理服务
"""
from typing import List, Optional, Dict, Any
from app.services.database_service import db_service
from database.models.candidate import CandidateModel

class CandidateService:
    """候选人管理服务类"""
    
    def __init__(self):
        self.db_service = db_service
    
    async def get_all_candidates(self, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """获取所有候选人"""
        return self.db_service.get_all_candidates(limit, offset)
    
    async def get_candidate(self, candidate_id: int) -> Optional[CandidateModel]:
        """获取候选人详情"""
        return self.db_service.get_candidate(candidate_id)
    
    async def get_candidate_by_task_id(self, task_id: str) -> Optional[CandidateModel]:
        """根据任务ID获取候选人"""
        return self.db_service.get_candidate_by_task_id(task_id)
    
    async def search_candidates(self, filters: Dict[str, Any], 
                               limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """搜索候选人"""
        return self.db_service.search_candidates(filters, limit, offset)
    
    async def get_active_candidates(self, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """获取活跃候选人"""
        return self.db_service.get_active_candidates(limit, offset)
    
    async def get_recent_candidates(self, days: int = 7, limit: int = 100) -> List[CandidateModel]:
        """获取最近添加的候选人"""
        return self.db_service.get_recent_candidates(days, limit)
    
    async def get_candidates_by_name(self, name: str, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """根据姓名搜索候选人"""
        return self.db_service.search_candidates({"name": name}, limit, offset)
    
    async def get_candidates_by_position(self, position: str, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """根据职位搜索候选人"""
        return self.db_service.search_candidates({"position": position}, limit, offset)
    
    async def get_candidates_by_skills(self, skills: List[str], limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """根据技能搜索候选人"""
        return self.db_service.candidate_repo.get_by_skills(skills, limit, offset)
    
    async def get_candidates_by_experience(self, min_years: int, max_years: int, 
                                         limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """根据经验年限搜索候选人"""
        return self.db_service.search_candidates({
            "experience_years_min": min_years,
            "experience_years_max": max_years
        }, limit, offset)
    
    async def get_top_rated_candidates(self, limit: int = 10) -> List[CandidateModel]:
        """获取评分最高的候选人"""
        return self.db_service.candidate_repo.get_top_rated_candidates(limit)
    
    async def update_candidate(self, candidate: CandidateModel) -> bool:
        """更新候选人信息"""
        return self.db_service.update_candidate(candidate)
    
    async def delete_candidate(self, candidate_id: int) -> bool:
        """删除候选人"""
        return self.db_service.delete_candidate(candidate_id)
    
    async def get_candidate_statistics(self) -> Dict[str, Any]:
        """获取候选人统计信息"""
        return self.db_service.get_candidate_statistics()
    
    async def get_skills_statistics(self) -> Dict[str, int]:
        """获取技能统计信息"""
        return self.db_service.candidate_repo.get_skills_statistics()
    
    async def rate_candidate(self, candidate_id: int, rating: int) -> bool:
        """给候选人评分"""
        if rating < 1 or rating > 5:
            return False
        
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            return False
        
        candidate.rating = rating
        return await self.update_candidate(candidate)
    
    async def add_candidate_notes(self, candidate_id: int, notes: str) -> bool:
        """添加候选人备注"""
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            return False
        
        candidate.notes = notes
        return await self.update_candidate(candidate)
    
    async def update_candidate_status(self, candidate_id: int, status: str) -> bool:
        """更新候选人状态"""
        if status not in ["active", "inactive", "hired", "rejected"]:
            return False
        
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            return False
        
        candidate.status = status
        return await self.update_candidate(candidate)
    
    async def add_candidate_tags(self, candidate_id: int, tags: List[str]) -> bool:
        """添加候选人标签"""
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            return False
        
        existing_tags = candidate.get_tags_list()
        new_tags = list(set(existing_tags + tags))  # 去重
        candidate.set_tags_list(new_tags)
        
        return await self.update_candidate(candidate)
    
    async def remove_candidate_tags(self, candidate_id: int, tags: List[str]) -> bool:
        """移除候选人标签"""
        candidate = await self.get_candidate(candidate_id)
        if not candidate:
            return False
        
        existing_tags = candidate.get_tags_list()
        new_tags = [tag for tag in existing_tags if tag not in tags]
        candidate.set_tags_list(new_tags)
        
        return await self.update_candidate(candidate)

# 创建全局候选人服务实例
candidate_service = CandidateService()
