"""
简历解析工具 - 使用 markitdown 统一转换 + LLM JSON 增强提取
"""
import os
import re
import json
import asyncio
import logging
from typing import Dict, Any, Optional, Tuple
import requests
from pathlib import Path

from app.core.config import settings
from app.models.resume import ResumeInfo, ContactInfo, EducationInfo, WorkExperience, ProjectInfo

logger = logging.getLogger(__name__)

# markitdown 用于 PDF/DOCX → Markdown 转换
from markitdown import MarkItDown

# OCR 作为终极降级
from rapidocr import RapidOCR
import fitz  # PyMuPDF（仅用于 OCR 降级时渲染页面为图片）


SYSTEM_PROMPT = """\
你是一个专业的简历 JSON 提取引擎。你的唯一任务是从简历文本中提取结构化信息并输出 **纯 JSON**，不要附加任何解释。

请严格按照以下 JSON 结构输出。如果某字段无法找到，使用 null 或空数组。

{
    "name": "姓名",
    "contact": {
        "phone": "电话",
        "email": "邮箱",
        "address": "地址"
    },
    "education": [
        {
            "degree": "学位",
            "institution": "学校",
            "major": "专业",
            "start_year": "2018",
            "end_year": "2021",
            "gpa": "3.8/4.0"
        }
    ],
    "experience": [
        {
            "title": "职位",
            "company": "公司",
            "start_date": "2020-07",
            "end_date": "2022-12",
            "description": "工作描述",
            "location": "地点"
        }
    ],
    "projects": [
        {
            "name": "项目名称",
            "description": "项目描述",
            "technologies": ["技术1", "技术2"],
            "start_date": "2021-01",
            "end_date": "2021-06"
        }
    ],
    "skills": ["技能1", "技能2"],
    "languages": ["语言1"],
    "certifications": ["证书1"],
    "summary": "个人简介",
    "other": "其他信息"
}

重要规则：
- 教育背景按时间倒序（最新在前），提取所有学历
- 时间格式：年份用4位数字，月份用 YYYY-MM 格式
- 输出必须是合法的 JSON，不要包含注释或多余文本
- 只输出 JSON，不要输出任何其他内容\
"""


class ResumeParser:
    """简历解析器"""

    def __init__(self):
        self.api_key = settings.SILICONFLOW_API_KEY
        self.api_url = settings.SILICONFLOW_API_URL
        self._ocr: Optional[RapidOCR] = None
        self._markitdown: Optional[MarkItDown] = None

    @property
    def ocr(self) -> RapidOCR:
        if self._ocr is None:
            self._ocr = RapidOCR()
        return self._ocr

    @property
    def markitdown(self) -> MarkItDown:
        if self._markitdown is None:
            self._markitdown = MarkItDown()
        return self._markitdown

    # ------------------------------------------------------------------
    # 公开接口
    # ------------------------------------------------------------------

    async def parse_file(self, file_path: str) -> ResumeInfo:
        """解析简历文件，返回结构化信息"""
        logger.info(f"开始解析文件: {file_path}")

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")

        file_ext = os.path.splitext(file_path)[1].lower()

        try:
            markdown_text = await self._extract_text(file_path, file_ext)

            if not markdown_text.strip():
                raise ValueError("未能从文件中提取到任何文本内容")

            logger.info(f"提取到文本 ({len(markdown_text)} 字符)")

            resume_info = await self._complete_json(markdown_text)

            logger.info(f"文件解析完成: {file_path}")
            return resume_info

        except Exception as e:
            logger.error(f"解析文件失败 {file_path}: {e}")
            raise

    async def parse_file_with_markdown(self, file_path: str) -> Tuple[ResumeInfo, str]:
        """解析简历文件，同时返回原始 Markdown 文本（用于存储）"""
        logger.info(f"开始解析文件: {file_path}")

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")

        file_ext = os.path.splitext(file_path)[1].lower()

        try:
            markdown_text = await self._extract_text(file_path, file_ext)

            if not markdown_text.strip():
                raise ValueError("未能从文件中提取到任何文本内容")

            logger.info(f"提取到文本 ({len(markdown_text)} 字符)")

            resume_info = await self._complete_json(markdown_text)

            logger.info(f"文件解析完成: {file_path}")
            return resume_info, markdown_text

        except Exception as e:
            logger.error(f"解析文件失败 {file_path}: {e}")
            raise

    async def parse_text(self, text: str) -> ResumeInfo:
        """直接解析纯文本（如候选人备注），通过 LLM 提取结构化信息"""
        if not text or not text.strip():
            raise ValueError("文本内容为空")
        return await self._complete_json(text)

    # ------------------------------------------------------------------
    # 文档转文本：markitdown 主路径 + OCR 降级
    # ------------------------------------------------------------------

    async def _extract_text(self, file_path: str, file_ext: str) -> str:
        """统一文本提取入口"""
        if file_ext in (".jpg", ".jpeg", ".png"):
            return await self._extract_image_text(file_path)

        # PDF / DOCX / DOC → markitdown
        try:
            text = await asyncio.to_thread(self._sync_markitdown_extract, file_path)
            if len(text.strip()) >= 50:
                return text
            logger.warning(f"markitdown 提取内容过少({len(text.strip())}字)，切换到 OCR")
        except Exception as e:
            logger.warning(f"markitdown 提取失败: {e}，切换到 OCR")

        if file_ext == ".pdf":
            return await self._extract_pdf_with_ocr(file_path)

        raise ValueError(f"无法提取文件内容: {file_path}")

    def _sync_markitdown_extract(self, file_path: str) -> str:
        """使用 markitdown 将 PDF/DOCX 转为 Markdown"""
        result = self.markitdown.convert(file_path)
        return result.text_content

    # ------------------------------------------------------------------
    # OCR 降级路径（仅用于扫描件 PDF 和图片）
    # ------------------------------------------------------------------

    async def _extract_pdf_with_ocr(self, file_path: str) -> str:
        return await asyncio.to_thread(self._sync_extract_pdf_with_ocr, file_path)

    def _sync_extract_pdf_with_ocr(self, file_path: str) -> str:
        doc = fitz.open(file_path)
        all_text = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            result = self.ocr(img_data)
            if result and len(result) > 0:
                page_text = " ".join([item[1] for item in result[0]])
                all_text.append(f"=== 第{page_num + 1}页 ===\n{page_text}")
        doc.close()
        return "\n\n".join(all_text)

    async def _extract_image_text(self, file_path: str) -> str:
        return await asyncio.to_thread(self._sync_extract_image_text, file_path)

    def _sync_extract_image_text(self, file_path: str) -> str:
        result = self.ocr(file_path)
        if result and len(result) > 0:
            return " ".join([item[1] for item in result[0]])
        return ""

    # ------------------------------------------------------------------
    # LLM JSON 提取：重试 + 截断检测 + 鲁棒 JSON 解析
    # ------------------------------------------------------------------

    async def _complete_json(self, text: str, retries: int = 2) -> ResumeInfo:
        """
        调用 LLM 提取结构化 JSON，借鉴 Resume-Matcher 的 complete_json 策略：
        - JSON mode（若模型支持）
        - 截断检测 + 重试
        - 退避温度
        - 鲁棒 JSON 提取
        """
        if not self.api_key:
            logger.warning("SILICONFLOW_API_KEY 未设置，返回模拟数据")
            return self._get_mock_resume_info()

        user_content = text
        last_error = None

        for attempt in range(retries + 1):
            try:
                temperature = self._get_retry_temperature(attempt)
                raw_response = await self._call_llm(user_content, temperature)

                if self._appears_truncated(raw_response):
                    if attempt < retries:
                        logger.warning(f"检测到 JSON 截断（第{attempt + 1}次），重试...")
                        user_content = text + "\n\n[重要：请输出完整的 JSON，不要截断]"
                        continue
                    logger.warning("JSON 截断但已达最大重试次数，尝试解析部分内容")

                parsed_data = self._extract_json(raw_response)
                resume_info = self._convert_to_resume_info(parsed_data)

                issues = self._validate_resume_info(resume_info)
                if not issues or attempt == retries:
                    if issues:
                        logger.warning(f"解析结果校验警告(已重试): {issues}")
                    return resume_info

                logger.warning(f"解析结果校验不通过: {issues}，进行第{attempt + 2}次尝试")
                user_content = text + f"\n\n[重要提示：上次解析缺少以下关键信息: {', '.join(issues)}。请务必完整提取。]"

            except Exception as e:
                last_error = e
                if attempt < retries:
                    logger.error(f"LLM 第{attempt + 1}次解析失败: {e}，重试中...")
                    continue
                raise

        raise last_error or ValueError("LLM 解析失败")

    def _get_retry_temperature(self, attempt: int) -> float:
        """重试时逐步升高 temperature 增加变异"""
        base = settings.LLM_TEMPERATURE
        return min(base + attempt * 0.15, 1.0)

    def _appears_truncated(self, text: str) -> bool:
        """检测 JSON 响应是否被截断"""
        text = text.rstrip()
        if not text:
            return True
        open_braces = text.count("{")
        close_braces = text.count("}")
        open_brackets = text.count("[")
        close_brackets = text.count("]")
        if open_braces > close_braces or open_brackets > close_brackets:
            return True
        if text[-1] in (",", ":", '"', "[", "{"):
            return True
        return False

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """从可能包含解释文字的响应中鲁棒地提取 JSON 对象"""
        text = text.strip()

        # 去掉 markdown 代码块标记
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)

        # 直接解析
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # 括号匹配提取最外层 JSON 对象
        depth = 0
        start = -1
        for i, ch in enumerate(text):
            if ch == "{":
                if depth == 0:
                    start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start >= 0:
                    try:
                        return json.loads(text[start : i + 1])
                    except json.JSONDecodeError:
                        start = -1

        # 最后尝试简单截取
        json_start = text.find("{")
        json_end = text.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            try:
                return json.loads(text[json_start:json_end])
            except json.JSONDecodeError:
                pass

        raise ValueError(f"未找到有效 JSON，返回内容: {text[:300]}")

    # ------------------------------------------------------------------
    # LLM 调用
    # ------------------------------------------------------------------

    def _call_llm_sync(self, text: str, temperature: float) -> str:
        """同步调用 LLM API 并返回原始文本响应"""
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            "max_tokens": settings.MAX_TOKENS,
            "temperature": temperature,
            "top_p": settings.LLM_TOP_P,
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        response = requests.post(self.api_url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        result = response.json()

        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        elif "content" in result and len(result["content"]) > 0:
            return result["content"][0]["text"]
        else:
            raise ValueError("LLM 响应格式不正确")

    async def _call_llm(self, text: str, temperature: float) -> str:
        return await asyncio.to_thread(self._call_llm_sync, text, temperature)

    # ------------------------------------------------------------------
    # 数据校验与转换
    # ------------------------------------------------------------------

    def _validate_resume_info(self, info: ResumeInfo) -> list:
        """校验解析结果的关键字段完整性"""
        issues = []
        if not info.name:
            issues.append("姓名")
        if not info.contact or (not info.contact.phone and not info.contact.email):
            issues.append("联系方式(电话或邮箱)")
        if not info.education:
            issues.append("教育背景")
        if not info.experience:
            issues.append("工作经历")
        return issues

    def _normalize_name(self, name: Optional[str]) -> Optional[str]:
        """规范化姓名：移除中文名字中间的空格，保留英文名空格"""
        if not name:
            return name

        name = name.strip()

        def is_chinese_char(char):
            return "\u4e00" <= char <= "\u9fff" or char == "·"

        chinese_count = sum(1 for c in name if is_chinese_char(c))
        total_letters = sum(1 for c in name if c.isalpha() or is_chinese_char(c))

        if total_letters > 0 and chinese_count / total_letters > 0.5:
            name = "".join(c for c in name if c != " ")

        return name

    def _convert_to_resume_info(self, data: Dict[str, Any]) -> ResumeInfo:
        """将 LLM 返回的字典转换为 ResumeInfo（field_validator 自动容错）"""
        data["name"] = self._normalize_name(data.get("name"))

        try:
            return ResumeInfo.model_validate(data)
        except Exception as e:
            logger.warning(f"model_validate 失败，尝试手动转换: {e}")
            return self._manual_convert(data)

    def _manual_convert(self, data: Dict[str, Any]) -> ResumeInfo:
        """手动转换作为 model_validate 的后备"""
        contact = None
        if "contact" in data and data["contact"]:
            cd = data["contact"]
            contact = ContactInfo(
                phone=cd.get("phone"),
                email=cd.get("email"),
                address=cd.get("address"),
            )

        education = None
        if "education" in data and data["education"]:
            education = []
            for edu in data["education"]:
                if isinstance(edu, dict):
                    education.append(EducationInfo(**{k: edu.get(k) for k in
                        ("degree", "institution", "major", "start_year", "end_year", "gpa")}))

        experience = None
        if "experience" in data and data["experience"]:
            experience = []
            for exp in data["experience"]:
                if isinstance(exp, dict):
                    experience.append(WorkExperience(**{k: exp.get(k) for k in
                        ("title", "company", "start_date", "end_date", "description", "location")}))

        projects = None
        if "projects" in data and data["projects"]:
            projects = []
            for proj in data["projects"]:
                if isinstance(proj, dict):
                    projects.append(ProjectInfo(**{k: proj.get(k) for k in
                        ("name", "description", "technologies", "start_date", "end_date")}))

        return ResumeInfo(
            name=data.get("name"),
            contact=contact,
            education=education if education else None,
            experience=experience if experience else None,
            projects=projects if projects else None,
            skills=data.get("skills"),
            languages=data.get("languages"),
            certifications=data.get("certifications"),
            summary=data.get("summary"),
            other=data.get("other"),
        )

    # ------------------------------------------------------------------
    # Mock 数据
    # ------------------------------------------------------------------

    def _get_mock_resume_info(self) -> ResumeInfo:
        """返回模拟的简历信息用于测试"""
        return ResumeInfo(
            name="张三",
            contact=ContactInfo(
                phone="13800138000",
                email="zhangsan@example.com",
                address="北京市朝阳区",
            ),
            education=[
                EducationInfo(
                    degree="硕士学位",
                    institution="清华大学",
                    major="计算机科学与技术",
                    start_year="2018",
                    end_year="2021",
                    gpa="3.8/4.0",
                ),
                EducationInfo(
                    degree="学士学位",
                    institution="北京理工大学",
                    major="软件工程",
                    start_year="2014",
                    end_year="2018",
                    gpa="3.6/4.0",
                ),
            ],
            experience=[
                WorkExperience(
                    title="软件工程师",
                    company="科技公司",
                    start_date="2020-07",
                    end_date="2022-12",
                    description="负责开发Web应用，使用React和Node.js技术栈",
                    location="北京",
                )
            ],
            skills=["Python", "Java", "React", "Node.js", "机器学习"],
            languages=["英语六级", "普通话"],
            certifications=["PMP证书"],
            summary="具有3年软件开发经验，熟悉前后端开发技术栈",
            other="这是一个模拟的简历数据，用于测试系统功能",
        )
