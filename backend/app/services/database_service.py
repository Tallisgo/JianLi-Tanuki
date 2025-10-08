"""
数据库服务层
集成新的数据库架构到现有服务中
"""
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from database import (
    upload_task_repo, 
    resume_info_repo, 
    candidate_repo,
    init_database
)
from database.models.upload_task import UploadTaskModel
from database.models.resume_info import ResumeInfoModel
from database.models.candidate import CandidateModel
from app.models.resume import UploadTask, TaskStatus, ResumeInfo

class DatabaseService:
    """数据库服务类 - 统一的数据访问接口"""
    
    def __init__(self):
        self.upload_repo = upload_task_repo
        self.resume_repo = resume_info_repo
        self.candidate_repo = candidate_repo
    
    def init_database(self) -> bool:
        """初始化数据库"""
        return init_database()
    
    # ==================== 任务管理 ====================
    
    def create_task(self, task: UploadTask) -> bool:
        """创建任务"""
        try:
            # 转换为数据库模型
            task_model = UploadTaskModel(
                id=task.id,
                filename=task.filename,
                file_path=task.file_path,
                file_size=task.file_size,
                file_type=task.file_type,
                status=task.status.value,
                progress=task.progress,
                result=task.result.json() if task.result else None,
                error=task.error,
                created_at=task.created_at,
                updated_at=task.updated_at,
                completed_at=task.completed_at
            )
            
            return self.upload_repo.create(task_model)
        except Exception as e:
            print(f"创建任务失败: {e}")
            return False
    
    def get_task(self, task_id: str) -> Optional[UploadTask]:
        """获取任务"""
        try:
            task_model = self.upload_repo.get_by_id(task_id)
            if not task_model:
                return None
            
            return self._convert_task_model_to_upload_task(task_model)
        except Exception as e:
            print(f"获取任务失败: {e}")
            return None
    
    def get_all_tasks(self, limit: int = 100, offset: int = 0) -> List[UploadTask]:
        """获取所有任务"""
        try:
            task_models = self.upload_repo.get_all(limit, offset)
            return [self._convert_task_model_to_upload_task(model) for model in task_models]
        except Exception as e:
            print(f"获取任务列表失败: {e}")
            return []
    
    def update_task_status(self, task_id: str, status: TaskStatus, 
                          progress: int = None, result: ResumeInfo = None, 
                          error: str = None) -> bool:
        """更新任务状态"""
        try:
            result_json = result.json() if result else None
            success = self.upload_repo.update_status(
                task_id, status, progress, result_json, error
            )
            
            # 如果任务完成且有结果，创建简历信息和候选人记录
            if success and status == TaskStatus.COMPLETED and result:
                self._create_resume_and_candidate_records(task_id, result)
            
            return success
        except Exception as e:
            print(f"更新任务状态失败: {e}")
            return False
    
    def delete_task(self, task_id: str) -> bool:
        """删除任务"""
        try:
            # 删除相关记录
            self.resume_repo.delete_by_task_id(task_id)
            self.candidate_repo.delete_by_task_id(task_id)
            
            # 删除任务
            return self.upload_repo.delete(task_id)
        except Exception as e:
            print(f"删除任务失败: {e}")
            return False
    
    def get_task_statistics(self) -> Dict[str, Any]:
        """获取任务统计信息"""
        return self.upload_repo.get_statistics()
    
    # ==================== 简历信息管理 ====================
    
    def create_resume_info(self, task_id: str, resume_info: ResumeInfo) -> bool:
        """创建简历信息"""
        try:
            resume_data = self._convert_resume_info_to_dict(resume_info)
            return self.resume_repo.create_or_update_from_resume_info(task_id, resume_data)
        except Exception as e:
            print(f"创建简历信息失败: {e}")
            return False
    
    def get_resume_info(self, task_id: str) -> Optional[ResumeInfoModel]:
        """获取简历信息"""
        return self.resume_repo.get_by_task_id(task_id)
    
    def get_all_resume_infos(self, limit: int = 100, offset: int = 0) -> List[ResumeInfoModel]:
        """获取所有简历信息"""
        return self.resume_repo.get_all(limit, offset)
    
    def search_resume_infos(self, filters: Dict[str, Any], 
                           limit: int = 100, offset: int = 0) -> List[ResumeInfoModel]:
        """搜索简历信息"""
        return self.resume_repo.search(filters, limit, offset)
    
    def get_skills_statistics(self) -> Dict[str, int]:
        """获取技能统计信息"""
        return self.resume_repo.get_skills_statistics()
    
    # ==================== 候选人管理 ====================
    
    def create_candidate(self, task_id: str, resume_info: ResumeInfo) -> bool:
        """创建候选人记录"""
        try:
            resume_data = self._convert_resume_info_to_dict(resume_info)
            return self.candidate_repo.create_from_resume_info(task_id, resume_data)
        except Exception as e:
            print(f"创建候选人失败: {e}")
            return False
    
    def get_candidate(self, candidate_id: int) -> Optional[CandidateModel]:
        """获取候选人"""
        return self.candidate_repo.get_by_id(candidate_id)
    
    def get_candidate_by_task_id(self, task_id: str) -> Optional[CandidateModel]:
        """根据任务ID获取候选人"""
        return self.candidate_repo.get_by_task_id(task_id)
    
    def get_all_candidates(self, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """获取所有候选人"""
        return self.candidate_repo.get_all(limit, offset)
    
    def search_candidates(self, filters: Dict[str, Any], 
                         limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """搜索候选人"""
        return self.candidate_repo.search(filters, limit, offset)
    
    def get_active_candidates(self, limit: int = 100, offset: int = 0) -> List[CandidateModel]:
        """获取活跃候选人"""
        return self.candidate_repo.get_active_candidates(limit, offset)
    
    def get_recent_candidates(self, days: int = 7, limit: int = 100) -> List[CandidateModel]:
        """获取最近添加的候选人"""
        return self.candidate_repo.get_recent_candidates(days, limit)
    
    def get_candidate_statistics(self) -> Dict[str, Any]:
        """获取候选人统计信息"""
        return self.candidate_repo.get_statistics()
    
    def update_candidate(self, candidate: CandidateModel) -> bool:
        """更新候选人"""
        return self.candidate_repo.update(candidate)
    
    def delete_candidate(self, candidate_id: int) -> bool:
        """删除候选人"""
        return self.candidate_repo.delete(candidate_id)
    
    # ==================== 私有方法 ====================
    
    def _convert_task_model_to_upload_task(self, task_model: UploadTaskModel) -> UploadTask:
        """将数据库模型转换为UploadTask对象"""
        result = None
        if task_model.result:
            try:
                result_data = json.loads(task_model.result)
                result = ResumeInfo(**result_data)
            except Exception as e:
                print(f"解析结果数据失败: {e}")
        
        return UploadTask(
            id=task_model.id,
            filename=task_model.filename,
            file_path=task_model.file_path,
            file_size=task_model.file_size,
            file_type=task_model.file_type,
            status=TaskStatus(task_model.status),
            progress=task_model.progress,
            result=result,
            error=task_model.error,
            created_at=task_model.created_at,
            updated_at=task_model.updated_at,
            completed_at=task_model.completed_at
        )
    
    def _convert_resume_info_to_dict(self, resume_info: ResumeInfo) -> Dict[str, Any]:
        """将ResumeInfo对象转换为字典"""
        data = {}
        
        if resume_info.name:
            data["name"] = resume_info.name
        
        if resume_info.contact:
            if resume_info.contact.phone:
                data["phone"] = resume_info.contact.phone
            if resume_info.contact.email:
                data["email"] = resume_info.contact.email
            if resume_info.contact.address:
                data["address"] = resume_info.contact.address
        
        if resume_info.education:
            data["education"] = json.dumps([edu.dict() for edu in resume_info.education], ensure_ascii=False)
        
        if resume_info.experience:
            data["experience"] = json.dumps([exp.dict() for exp in resume_info.experience], ensure_ascii=False)
        
        if resume_info.projects:
            data["projects"] = json.dumps([proj.dict() for proj in resume_info.projects], ensure_ascii=False)
        
        if resume_info.skills:
            data["skills"] = json.dumps(resume_info.skills, ensure_ascii=False)
        
        if resume_info.languages:
            data["languages"] = json.dumps(resume_info.languages, ensure_ascii=False)
        
        if resume_info.certifications:
            data["certifications"] = json.dumps(resume_info.certifications, ensure_ascii=False)
        
        if resume_info.summary:
            data["summary"] = resume_info.summary
        
        if resume_info.other:
            data["other"] = resume_info.other
        
        return data
    
    def _create_resume_and_candidate_records(self, task_id: str, resume_info: ResumeInfo):
        """创建简历信息和候选人记录"""
        try:
            # 创建简历信息记录
            self.create_resume_info(task_id, resume_info)
            
            # 创建候选人记录
            self.create_candidate(task_id, resume_info)
            
            print(f"✅ 为任务 {task_id} 创建了简历信息和候选人记录")
        except Exception as e:
            print(f"❌ 创建简历信息和候选人记录失败: {e}")

# 创建全局数据库服务实例
db_service = DatabaseService()
