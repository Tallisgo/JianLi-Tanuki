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
    
    def _find_exact_duplicate(self, name: str, phone: str = None, email: str = None):
        """
        查找严格匹配的重复候选人
        
        严格匹配规则: 姓名相同 AND (电话相同 OR 邮箱相同)
        
        Returns:
            候选人对象，如果没有找到返回 None
        """
        if not name:
            return None
        
        # 先按姓名查找
        candidates = db_service.candidate_repo.get_by_exact_name(name)
        
        if not candidates:
            return None
        
        # 如果有电话或邮箱，进行严格匹配
        if phone or email:
            for candidate in candidates:
                # 电话匹配
                if phone and candidate.phone:
                    # 标准化电话号码比较（去除空格和横线）
                    norm_phone = phone.replace(' ', '').replace('-', '').replace('+86', '')
                    norm_cand_phone = candidate.phone.replace(' ', '').replace('-', '').replace('+86', '')
                    if norm_phone == norm_cand_phone:
                        return candidate
                
                # 邮箱匹配
                if email and candidate.email:
                    if email.lower() == candidate.email.lower():
                        return candidate
        
        # 如果没有电话和邮箱，但姓名完全匹配，返回第一个（可能是重复）
        # 这种情况下，让系统询问用户是否是同一人
        return candidates[0] if len(candidates) == 1 else None
    
    async def process_resume(self, task_id: str, force_update: bool = False):
        """
        处理简历解析任务
        
        Args:
            task_id: 任务ID
            force_update: 是否强制更新已存在的候选人（跳过查重）
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
            print(f"解析结果: 姓名={result.name}")
            
            # 检查是否存在严格匹配的重复候选人
            if result.name and not force_update:
                phone = result.contact.phone if result.contact else None
                email = result.contact.email if result.contact else None
                
                duplicate = self._find_exact_duplicate(result.name, phone, email)
                
                if duplicate:
                    print(f"🔴 发现严格匹配的重复候选人: {result.name} (ID: {duplicate.id})")
                    
                    # 设置任务状态为重复，不创建新记录
                    # 在 error 字段中存储重复候选人信息，供前端解析
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
            
            # 没有重复或强制更新，正常完成任务并创建候选人
            await self.task_service.update_task_status(
                task_id, TaskStatus.COMPLETED, progress=100, result=result
            )
            
            print(f"✅ 任务解析完成: {task_id}, 候选人: {result.name}")
            
        except Exception as e:
            print(f"❌ 任务解析失败 {task_id}: {e}")
            
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
