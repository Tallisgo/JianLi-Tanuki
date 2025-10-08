"""
激励语API端点
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, date
from typing import Optional
import random
import json
import requests
from app.core.config import settings

router = APIRouter()

# 激励语模板库
INSPIRATION_TEMPLATES = [
    "今天是一个新的开始，每一个努力都不会白费。相信自己，你比想象中更强大！",
    "成功不是终点，失败也不是末日，重要的是继续前进的勇气。加油！",
    "每一次挑战都是成长的机会，每一次努力都在为未来铺路。坚持就是胜利！",
    "梦想不会发光，发光的是追梦的你。今天也要全力以赴！",
    "困难只是成功路上的垫脚石，跨过去就是新的高度。相信自己！",
    "每一天的努力，都是对梦想最好的投资。今天也要加油！",
    "不要害怕慢，只要不停下脚步，就一定能到达终点。坚持就是胜利！",
    "成功的人不是从不失败，而是从不放弃。今天也要勇敢前行！",
    "每一个不曾起舞的日子，都是对生命的辜负。让今天闪闪发光！",
    "努力不一定成功，但不努力一定不会成功。今天也要全力以赴！",
    "生活不会辜负每一个努力的人，时间会证明一切。相信自己！",
    "今天的汗水，是明天成功的基石。加油，未来可期！",
    "不要因为走得太远，而忘记为什么出发。不忘初心，方得始终！",
    "每一次跌倒都是为了更好地站起来。今天也要勇敢面对挑战！",
    "梦想照进现实，需要的是行动和坚持。今天也要为梦想努力！"
]

# 存储每日激励语的简单缓存（实际项目中应该使用数据库）
daily_inspiration_cache = {}

async def generate_inspiration_with_llm() -> str:
    """使用LLM生成激励语"""
    if not settings.SILICONFLOW_API_KEY:
        # 如果没有API Key，使用模板库
        return random.choice(INSPIRATION_TEMPLATES)
    
    try:
        # 多样化的激励语生成提示词
        inspiration_themes = [
            "关于坚持与毅力的励志语句",
            "关于梦想与目标的激励话语", 
            "关于挑战与成长的积极表达",
            "关于自信与勇气的鼓舞语句",
            "关于努力与奋斗的励志名言",
            "关于希望与未来的正能量话语",
            "关于突破与创新的激励表达",
            "关于团队合作与成功的励志语句"
        ]
        
        # 随机选择主题
        selected_theme = random.choice(inspiration_themes)
        
        # 多样化的表达风格
        styles = [
            "用比喻和象征的手法",
            "用排比和对比的修辞",
            "用简洁有力的短句",
            "用温暖感人的语调",
            "用激昂振奋的语气",
            "用哲理深刻的表达"
        ]
        
        selected_style = random.choice(styles)
        
        prompt = f"""
请创作一条{selected_theme}，要求：
1. 语言简洁有力，控制在30-60字之间
2. 传递积极向上的正能量
3. 适合职场人士、求职者或创业者
4. {selected_style}来表达
5. 语言自然流畅，有感染力和启发性
6. 不要包含具体日期、时间、人名或地名
7. 避免使用过于常见的励志词汇
8. 直接输出激励语内容，不要任何解释或前缀

请创作一条激励语：
"""
        
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一个专业的激励语生成助手，擅长创作积极向上、富有感染力的励志语句。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 200,
            "temperature": settings.LLM_TEMPERATURE,  # 使用配置文件中的参数
            "top_p": settings.LLM_TOP_P  # 添加top_p参数
        }
        
        headers = {
            "Authorization": f"Bearer {settings.SILICONFLOW_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(settings.SILICONFLOW_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        
        # 提取LLM返回的文本
        if 'choices' in result and len(result['choices']) > 0:
            llm_text = result['choices'][0]['message']['content'].strip()
        elif 'content' in result and len(result['content']) > 0:
            llm_text = result['content'][0]['text'].strip()
        else:
            raise ValueError("LLM响应格式不正确")
        
        # 清理文本，移除可能的引号或多余字符
        llm_text = llm_text.replace('"', '').replace("'", '').strip()
        
        # 如果生成的内容太短或太长，使用模板库
        if len(llm_text) < 10 or len(llm_text) > 100:
            return random.choice(INSPIRATION_TEMPLATES)
        
        return llm_text
        
    except Exception as e:
        print(f"LLM生成激励语失败: {e}")
        # 如果LLM调用失败，使用模板库
        return random.choice(INSPIRATION_TEMPLATES)

def generate_daily_inspiration() -> str:
    """生成每日激励语"""
    today = date.today().isoformat()
    
    # 如果今天已经生成过，直接返回
    if today in daily_inspiration_cache:
        return daily_inspiration_cache[today]
    
    # 使用日期作为随机种子，确保每天生成相同的激励语
    random.seed(today)
    inspiration = random.choice(INSPIRATION_TEMPLATES)
    
    # 缓存今天的激励语
    daily_inspiration_cache[today] = inspiration
    
    return inspiration

async def generate_fresh_inspiration() -> str:
    """生成全新的激励语（不使用缓存）"""
    return await generate_inspiration_with_llm()

@router.get("/daily", summary="获取每日激励语")
async def get_daily_inspiration():
    """获取每日激励语"""
    try:
        today = date.today().isoformat()
        
        # 如果今天已经生成过，直接返回
        if today in daily_inspiration_cache:
            inspiration = daily_inspiration_cache[today]
        else:
            # 使用LLM生成今日激励语
            inspiration = await generate_inspiration_with_llm()
            # 缓存今日激励语
            daily_inspiration_cache[today] = inspiration
        
        return {
            "inspiration": inspiration,
            "date": today,
            "timestamp": datetime.now().isoformat(),
            "source": "llm" if settings.SILICONFLOW_API_KEY else "template"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成激励语失败: {str(e)}")

@router.get("/refresh", summary="刷新今日激励语")
async def refresh_daily_inspiration():
    """刷新今日激励语（使用LLM重新生成）"""
    try:
        today = date.today().isoformat()
        
        # 使用LLM生成全新的激励语
        inspiration = await generate_fresh_inspiration()
        
        # 更新今日缓存
        daily_inspiration_cache[today] = inspiration
        
        return {
            "inspiration": inspiration,
            "date": today,
            "timestamp": datetime.now().isoformat(),
            "refreshed": True,
            "source": "llm" if settings.SILICONFLOW_API_KEY else "template"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"刷新激励语失败: {str(e)}")

@router.get("/history", summary="获取激励语历史")
async def get_inspiration_history():
    """获取激励语历史记录"""
    try:
        return {
            "history": daily_inspiration_cache,
            "count": len(daily_inspiration_cache),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史记录失败: {str(e)}")
