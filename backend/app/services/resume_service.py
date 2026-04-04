"""
简历解析服务
"""
import logging
from app.models.resume import TaskStatus, ResumeInfo
from app.services.task_service import TaskService
from app.services.database_service import db_service
from app.utils.resume_parser import ResumeParser

logger = logging.getLogger(__name__)

class ResumeService:
    """简历解析服务类"""
    
    def __init__(self):
        self.task_service = TaskService()
        self.parser = ResumeParser()
    
    def _find_exact_duplicate(self, name: str, phone: str = None, email: str = None):
        """
        查找严格匹配的重复候选人
        
        严格匹配规则: 姓名相同 AND (电话相同 OR 邮箱相同)
        """
        if not name:
            return None
        
        candidates = db_service.candidate_repo.get_by_exact_name(name)
        
        if not candidates:
            return None
        
        if phone or email:
            for candidate in candidates:
                if phone and candidate.phone:
                    norm_phone = phone.replace(' ', '').replace('-', '').replace('+86', '')
                    norm_cand_phone = candidate.phone.replace(' ', '').replace('-', '').replace('+86', '')
                    if norm_phone == norm_cand_phone:
                        return candidate
                
                if email and candidate.email:
                    if email.lower() == candidate.email.lower():
                        return candidate
        
        return candidates[0] if len(candidates) == 1 else None
    
    async def process_resume(self, task_id: str, force_update: bool = False):
        """处理简历解析任务"""
        try:
            task = await self.task_service.get_task(task_id)
            if not task:
                logger.error(f"任务不存在: {task_id}")
                return
            
            await self.task_service.update_task_status(
                task_id, TaskStatus.PARSING, progress=0
            )
            
            logger.info(f"开始解析任务: {task_id}")
            
            # 使用新的 parse_file_with_markdown 同时获取结构化结果和原始 Markdown
            result, original_markdown = await self.parser.parse_file_with_markdown(task.file_path)
            logger.info(f"解析结果: 姓名={result.name}")
            
            # 检查重复候选人
            if result.name and not force_update:
                phone = result.contact.phone if result.contact else None
                email = result.contact.email if result.contact else None
                
                duplicate = self._find_exact_duplicate(result.name, phone, email)
                
                if duplicate:
                    logger.info(f"发现严格匹配的重复候选人: {result.name} (ID: {duplicate.id})")
                    
                    import json
                    duplicate_info = json.dumps({
                        "duplicate": True,
                        "candidate_id": duplicate.id,
                        "candidate_name": duplicate.name,
                        "candidate_phone": duplicate.phone,
                        "candidate_email": duplicate.email,
                        "message": f"候选人 {duplicate.name} 已存在"
                    }, ensure_ascii=False)
                    
                    await self.task_service.update_task_status(
                        task_id, TaskStatus.DUPLICATE, error=duplicate_info
                    )
                    return
            
            # 完成任务，存储结果和原始 Markdown
            db_service.update_task_status(
                task_id, TaskStatus.COMPLETED, progress=100,
                result=result, original_markdown=original_markdown
            )
            
            logger.info(f"任务解析完成: {task_id}, 候选人: {result.name}")
            
        except Exception as e:
            logger.error(f"任务解析失败 {task_id}: {e}")
            
            await self.task_service.update_task_status(
                task_id, TaskStatus.FAILED, error=str(e)
            )
    
    async def process_resume_update(self, task_id: str, candidate_id: int):
        """处理简历更新任务 - 更新已存在的候选人"""
        try:
            task = await self.task_service.get_task(task_id)
            if not task:
                logger.error(f"任务不存在: {task_id}")
                return
            
            candidate = db_service.get_candidate(candidate_id)
            if not candidate:
                logger.error(f"候选人不存在: {candidate_id}")
                await self.task_service.update_task_status(
                    task_id, TaskStatus.FAILED, error="候选人不存在"
                )
                return
            
            await self.task_service.update_task_status(
                task_id, TaskStatus.PARSING, progress=0
            )
            
            logger.info(f"开始更新候选人 {candidate.name} (ID: {candidate_id}) 的简历")
            
            result, original_markdown = await self.parser.parse_file_with_markdown(task.file_path)
            
            self._update_candidate_from_resume(candidate, result)
            candidate.task_id = task_id
            
            success = db_service.update_candidate(candidate)
            
            if success:
                db_service.update_task_status(
                    task_id, TaskStatus.COMPLETED, progress=100,
                    result=result, original_markdown=original_markdown
                )
                logger.info(f"候选人 {candidate.name} 简历更新完成")
            else:
                await self.task_service.update_task_status(
                    task_id, TaskStatus.FAILED, error="保存候选人信息失败"
                )
            
        except Exception as e:
            logger.error(f"更新简历失败 {task_id}: {e}")
            await self.task_service.update_task_status(
                task_id, TaskStatus.FAILED, error=str(e)
            )
    
    def _update_candidate_from_resume(self, candidate, resume_info: ResumeInfo):
        """从解析的简历信息更新候选人记录"""
        import json
        from datetime import datetime
        
        if resume_info.name:
            candidate.name = resume_info.name
        
        if resume_info.contact:
            if resume_info.contact.phone:
                candidate.phone = resume_info.contact.phone
            if resume_info.contact.email:
                candidate.email = resume_info.contact.email
            if resume_info.contact.address:
                candidate.address = resume_info.contact.address
        
        if resume_info.skills:
            candidate.skills = json.dumps(resume_info.skills, ensure_ascii=False)
        
        if resume_info.languages:
            candidate.languages = json.dumps(resume_info.languages, ensure_ascii=False)
        
        if resume_info.certifications:
            candidate.certifications = json.dumps(resume_info.certifications, ensure_ascii=False)
        
        if resume_info.summary:
            candidate.summary = resume_info.summary
        
        if resume_info.experience:
            experiences = resume_info.experience
            if experiences and len(experiences) > 0:
                latest_exp = experiences[0]
                if latest_exp.title:
                    candidate.position = latest_exp.title
        
        if resume_info.education:
            educations = resume_info.education
            if educations and len(educations) > 0:
                latest_edu = educations[0]
                if latest_edu.institution:
                    candidate.school = latest_edu.institution
                if latest_edu.major:
                    candidate.major = latest_edu.major
                if latest_edu.degree:
                    candidate.education_level = latest_edu.degree
        
        candidate.updated_at = datetime.now()
