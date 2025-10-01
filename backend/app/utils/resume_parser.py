"""
简历解析工具
"""
import os
import json
import asyncio
from typing import Dict, Any, Optional
import requests
from rapidocr import RapidOCR
import fitz  # PyMuPDF
from docx import Document
from PIL import Image
import io

from app.core.config import settings
from app.models.resume import ResumeInfo, ContactInfo, EducationInfo, WorkExperience, ProjectInfo

class ResumeParser:
    """简历解析器"""
    
    def __init__(self):
        self.api_key = settings.SILICONFLOW_API_KEY
        self.api_url = settings.SILICONFLOW_API_URL
        self.ocr = RapidOCR()
        
        # 系统提示词
        self.system_prompt = """
你是一个专业的简历信息提取专家。你的任务是从OCR工具提取的简历文本中，准确识别并结构化候选人的关键信息。OCR文本可能包含拼写错误、格式混乱或缺失内容，请基于上下文进行智能解析和标准化。

请从输入文本中提取以下信息，并以JSON格式输出。如果某些信息无法找到，请使用`null`或空字符串表示。输出必须严格遵循下面的JSON结构。

需要提取的字段：
- **姓名**（全名）
- **联系方式**：包括电话和邮箱（如果多个，取主要的一个）
- **教育背景**：列表形式，每个项目包括学位、学校、专业、毕业年份
- **工作经历**：列表形式，每个项目包括职位、公司、工作时间、工作描述（简要）
- **项目经验**：列表形式，每个项目包括项目名称、描述、技术栈
- **技能**：数组形式，列出关键技能（如编程语言、工具等）
- **语言能力**：数组形式
- **证书**：数组形式
- **个人简介**：简要描述
- **其他信息**：如证书、项目经验、语言能力等（可选，如有则包含）

输出示例：
{
    "name": "张三",
    "contact": {
        "phone": "13800138000",
        "email": "zhangsan@example.com",
        "address": "北京市朝阳区"
    },
    "education": [
        {
            "degree": "学士学位",
            "institution": "某某大学",
            "major": "计算机科学与技术",
            "start_year": "2016",
            "end_year": "2020"
        }
    ],
    "experience": [
        {
            "title": "软件工程师",
            "company": "科技公司",
            "start_date": "2020-07",
            "end_date": "2022-12",
            "description": "负责开发Web应用...",
            "location": "北京"
        }
    ],
    "projects": [
        {
            "name": "电商系统",
            "description": "开发了一个完整的电商平台",
            "technologies": ["React", "Node.js", "MongoDB"],
            "start_date": "2021-01",
            "end_date": "2021-06"
        }
    ],
    "skills": ["Python", "Java", "机器学习"],
    "languages": ["英语六级", "普通话"],
    "certifications": ["PMP证书"],
    "summary": "具有3年软件开发经验...",
    "other": "其他相关信息"
}

请开始处理输入文本，并输出JSON结果。
"""
    
    async def parse_file(self, file_path: str) -> ResumeInfo:
        """
        解析简历文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            解析后的简历信息
        """
        print(f"开始解析文件: {file_path}")
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        # 根据文件类型选择解析方法
        file_extension = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_extension == '.pdf':
                text = await self._extract_pdf_text(file_path)
            elif file_extension in ['.doc', '.docx']:
                text = await self._extract_word_text(file_path)
            elif file_extension in ['.jpg', '.jpeg', '.png']:
                text = await self._extract_image_text(file_path)
            else:
                raise ValueError(f"不支持的文件类型: {file_extension}")
            
            if not text.strip():
                raise ValueError("未能从文件中提取到任何文本内容")
            
            print(text)
            
            # 使用LLM解析文本
            resume_info = await self._parse_with_llm(text)
            
            print(f"文件解析完成: {file_path}")
            return resume_info
            
        except Exception as e:
            print(f"解析文件失败 {file_path}: {e}")
            raise
    
    async def _extract_pdf_text(self, file_path: str) -> str:
        """提取PDF文本"""
        try:
            doc = fitz.open(file_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text += page.get_text()
            
            doc.close()
            return text
            
        except Exception as e:
            print(f"PDF文本提取失败: {e}")
            # 如果文本提取失败，尝试OCR
            return await self._extract_pdf_with_ocr(file_path)
    
    async def _extract_pdf_with_ocr(self, file_path: str) -> str:
        """使用OCR提取PDF文本"""
        try:
            doc = fitz.open(file_path)
            all_text = []
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                
                # 将页面转换为图片
                mat = fitz.Matrix(2.0, 2.0)  # 提高分辨率
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")
                
                # 使用OCR识别
                result = self.ocr(img_data)
                if result and len(result) > 0:
                    page_text = ' '.join([item[1] for item in result[0]])
                    all_text.append(f"=== 第{page_num + 1}页 ===\n{page_text}")
            
            doc.close()
            return '\n\n'.join(all_text)
            
        except Exception as e:
            print(f"PDF OCR提取失败: {e}")
            raise
    
    async def _extract_word_text(self, file_path: str) -> str:
        """提取Word文档文本"""
        try:
            doc = Document(file_path)
            text = ""
            
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text
            
        except Exception as e:
            print(f"Word文档文本提取失败: {e}")
            raise
    
    async def _extract_image_text(self, file_path: str) -> str:
        """提取图片文本"""
        try:
            result = self.ocr(file_path)
            
            if result and len(result) > 0:
                # 合并所有识别到的文本
                all_text = ' '.join([item[1] for item in result[0]])
                return all_text
            else:
                return ""
                
        except Exception as e:
            print(f"图片OCR提取失败: {e}")
            raise
    
    async def _parse_with_llm(self, text: str) -> ResumeInfo:
        """使用LLM解析文本"""
        if not self.api_key:
            print("警告: SILICONFLOW_API_KEY环境变量未设置，返回模拟数据")
            return self._get_mock_resume_info()
        
        try:
            payload = {
                "model": settings.LLM_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": self.system_prompt
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                "max_tokens": settings.MAX_TOKENS
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(self.api_url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            # 提取LLM返回的文本
            if 'choices' in result and len(result['choices']) > 0:
                llm_text = result['choices'][0]['message']['content']
            elif 'content' in result and len(result['content']) > 0:
                llm_text = result['content'][0]['text']
            else:
                raise ValueError("LLM响应格式不正确")
            
            # 尝试解析JSON
            try:
                # 清理LLM返回的文本，提取JSON部分
                json_start = llm_text.find('{')
                json_end = llm_text.rfind('}') + 1
                
                if json_start != -1 and json_end > json_start:
                    json_text = llm_text[json_start:json_end]
                    parsed_data = json.loads(json_text)
                else:
                    raise ValueError("未找到有效的JSON格式")
                
            except json.JSONDecodeError as e:
                print(f"JSON解析失败: {e}")
                print(f"LLM返回的文本: {llm_text}")
                raise ValueError(f"LLM返回的文本不是有效的JSON格式: {e}")
            
            # 转换为ResumeInfo对象
            return self._convert_to_resume_info(parsed_data)
            
        except requests.RequestException as e:
            print(f"LLM API请求失败: {e}")
            raise
        except Exception as e:
            print(f"LLM解析失败: {e}")
            raise
    
    def _convert_to_resume_info(self, data: Dict[str, Any]) -> ResumeInfo:
        """将解析的数据转换为ResumeInfo对象"""
        try:
            # 处理联系方式
            contact = None
            if 'contact' in data and data['contact']:
                contact_data = data['contact']
                contact = ContactInfo(
                    phone=contact_data.get('phone'),
                    email=contact_data.get('email'),
                    address=contact_data.get('address')
                )
            
            # 处理教育背景
            education = []
            if 'education' in data and data['education']:
                for edu_data in data['education']:
                    education.append(EducationInfo(
                        degree=edu_data.get('degree'),
                        institution=edu_data.get('institution'),
                        major=edu_data.get('major'),
                        start_year=edu_data.get('start_year'),
                        end_year=edu_data.get('end_year'),
                        gpa=edu_data.get('gpa')
                    ))
            
            # 处理工作经历
            experience = []
            if 'experience' in data and data['experience']:
                for exp_data in data['experience']:
                    experience.append(WorkExperience(
                        title=exp_data.get('title'),
                        company=exp_data.get('company'),
                        start_date=exp_data.get('start_date'),
                        end_date=exp_data.get('end_date'),
                        description=exp_data.get('description'),
                        location=exp_data.get('location')
                    ))
            
            # 处理项目经验
            projects = []
            if 'projects' in data and data['projects']:
                for proj_data in data['projects']:
                    projects.append(ProjectInfo(
                        name=proj_data.get('name'),
                        description=proj_data.get('description'),
                        technologies=proj_data.get('technologies'),
                        start_date=proj_data.get('start_date'),
                        end_date=proj_data.get('end_date')
                    ))
            
            return ResumeInfo(
                name=data.get('name'),
                contact=contact,
                education=education if education else None,
                experience=experience if experience else None,
                projects=projects if projects else None,
                skills=data.get('skills'),
                languages=data.get('languages'),
                certifications=data.get('certifications'),
                summary=data.get('summary'),
                other=data.get('other')
            )
            
        except Exception as e:
            print(f"数据转换失败: {e}")
            raise ValueError(f"数据转换失败: {e}")
    
    def _get_mock_resume_info(self) -> ResumeInfo:
        """返回模拟的简历信息用于测试"""
        from app.models.resume import ContactInfo, EducationInfo, WorkExperience
        
        return ResumeInfo(
            name="张三",
            contact=ContactInfo(
                phone="13800138000",
                email="zhangsan@example.com",
                address="北京市朝阳区"
            ),
            education=[
                EducationInfo(
                    degree="学士学位",
                    institution="某某大学",
                    major="计算机科学与技术",
                    start_year="2016",
                    end_year="2020"
                )
            ],
            experience=[
                WorkExperience(
                    title="软件工程师",
                    company="科技公司",
                    start_date="2020-07",
                    end_date="2022-12",
                    description="负责开发Web应用，使用React和Node.js技术栈",
                    location="北京"
                )
            ],
            skills=["Python", "Java", "React", "Node.js", "机器学习"],
            languages=["英语六级", "普通话"],
            certifications=["PMP证书"],
            summary="具有3年软件开发经验，熟悉前后端开发技术栈",
            other="这是一个模拟的简历数据，用于测试系统功能"
        )
