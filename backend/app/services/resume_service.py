"""
简历解析服务
"""
from app.models.resume import TaskStatus, ResumeInfo
from app.services.task_service import TaskService
from app.services.database_service import db_service
from app.utils.resume_parser import ResumeParser

class ResumeService:
    """简历解析服务类"""
    
    def __init__(self):
        self.task_service = TaskService()
        self.parser = ResumeParser()
    
    async def process_resume(self, task_id: str, force_update: bool = False):
        """
        处理简历解析任务
        
        Args:
            task_id: 任务ID
            force_update: 是否强制更新已存在的候选人
        """
        try:
            # 获取任务信息
            task = await self.task_service.get_task(task_id)
            if not task:
                print(f"任务不存在: {task_id}")
                return
            
            # 更新状态为解析中
            await self.task_service.update_task_status(
                task_id, TaskStatus.PARSING, progress=0
            )
            
            print(f"开始解析任务: {task_id}")
            
            # 解析文件
            result = await self.parser.parse_file(task.file_path)

            print(result)
            
            # 检查是否存在重复候选人
            if result.name and not force_update:
                phone = result.contact.phone if result.contact else None
                email = result.contact.email if result.contact else None
                duplicates = db_service.candidate_repo.find_duplicates(
                    result.name, phone, email
                )
                
                if duplicates:
                    print(f"发现重复候选人: {result.name}, 共 {len(duplicates)} 条记录")
                    # 即使有重复，我们仍然继续创建新记录（用户可以后续合并）
                    # 但在日志中记录警告
            
            # 更新任务状态为完成
            await self.task_service.update_task_status(
                task_id, TaskStatus.COMPLETED, progress=100, result=result
            )
            
            print(f"任务解析完成: {task_id}")
            
        except Exception as e:
            print(f"任务解析失败 {task_id}: {e}")
            
            # 更新任务状态为失败
            await self.task_service.update_task_status(
                task_id, TaskStatus.FAILED, error=str(e)
            )
    
    async def process_resume_update(self, task_id: str, candidate_id: int):
        """
        处理简历更新任务 - 更新已存在的候选人
        
        Args:
            task_id: 任务ID
            candidate_id: 要更新的候选人ID
        """
        try:
            # 获取任务信息
            task = await self.task_service.get_task(task_id)
            if not task:
                print(f"任务不存在: {task_id}")
                return
            
            # 获取候选人信息
            candidate = db_service.get_candidate(candidate_id)
            if not candidate:
                print(f"候选人不存在: {candidate_id}")
                await self.task_service.update_task_status(
                    task_id, TaskStatus.FAILED, error="候选人不存在"
                )
                return
            
            # 更新状态为解析中
            await self.task_service.update_task_status(
                task_id, TaskStatus.PARSING, progress=0
            )
            
            print(f"开始更新候选人 {candidate.name} (ID: {candidate_id}) 的简历")
            
            # 解析文件
            result = await self.parser.parse_file(task.file_path)
            
            # 更新候选人信息
            self._update_candidate_from_resume(candidate, result)
            
            # 更新任务的task_id到候选人
            candidate.task_id = task_id
            
            # 保存更新
            success = db_service.update_candidate(candidate)
            
            if success:
                # 更新任务状态为完成
                await self.task_service.update_task_status(
                    task_id, TaskStatus.COMPLETED, progress=100, result=result
                )
                print(f"候选人 {candidate.name} 简历更新完成")
            else:
                await self.task_service.update_task_status(
                    task_id, TaskStatus.FAILED, error="保存候选人信息失败"
                )
            
        except Exception as e:
            print(f"更新简历失败 {task_id}: {e}")
            await self.task_service.update_task_status(
                task_id, TaskStatus.FAILED, error=str(e)
            )
    
    def _update_candidate_from_resume(self, candidate, resume_info: ResumeInfo):
        """从解析的简历信息更新候选人记录"""
        import json
        from datetime import datetime
        
        # 更新基本信息
        if resume_info.name:
            candidate.name = resume_info.name
        
        if resume_info.contact:
            if resume_info.contact.phone:
                candidate.phone = resume_info.contact.phone
            if resume_info.contact.email:
                candidate.email = resume_info.contact.email
            if resume_info.contact.address:
                candidate.address = resume_info.contact.address
        
        # 更新技能
        if resume_info.skills:
            candidate.skills = json.dumps(resume_info.skills, ensure_ascii=False)
        
        # 更新语言能力
        if resume_info.languages:
            candidate.languages = json.dumps(resume_info.languages, ensure_ascii=False)
        
        # 更新证书
        if resume_info.certifications:
            candidate.certifications = json.dumps(resume_info.certifications, ensure_ascii=False)
        
        # 更新个人简介
        if resume_info.summary:
            candidate.summary = resume_info.summary
        
        # 从工作经历中提取职位
        if resume_info.experience:
            experiences = resume_info.experience
            if experiences and len(experiences) > 0:
                latest_exp = experiences[0]
                if latest_exp.title:
                    candidate.position = latest_exp.title
        
        # 从教育背景中提取信息
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
        
        # 更新时间戳
        candidate.updated_at = datetime.now()
