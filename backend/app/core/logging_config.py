"""
日志配置模块 - 按日轮转 + 控制台输出
"""
import os
import logging
from logging.handlers import TimedRotatingFileHandler


_initialized = False


def setup_logging():
    """
    初始化日志系统：
    - 控制台输出（StreamHandler）
    - 按日轮转文件（TimedRotatingFileHandler）
    - 日志文件命名: jianli-tanuki.log（当天）, jianli-tanuki.2026-04-03.log（历史）
    """
    global _initialized
    if _initialized:
        return

    # 延迟导入避免循环引用
    from app.core.config import settings

    log_dir = settings.LOG_DIR
    os.makedirs(log_dir, exist_ok=True)

    # 防御: 兼容旧配置 LOG_FILE=logs/jianli-tanuki.log 含路径的情况
    log_filename = os.path.basename(settings.LOG_FILE)
    log_path = os.path.join(log_dir, log_filename)
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # 统一格式
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # 根 logger
    root = logging.getLogger()
    root.setLevel(log_level)

    # 避免重复添加 handler（热重载场景）
    if root.handlers:
        root.handlers.clear()

    # 控制台
    console = logging.StreamHandler()
    console.setLevel(log_level)
    console.setFormatter(formatter)
    root.addHandler(console)

    # 按日轮转文件
    file_handler = TimedRotatingFileHandler(
        filename=log_path,
        when="midnight",
        interval=1,
        backupCount=settings.LOG_BACKUP_COUNT,
        encoding="utf-8",
    )
    # 生成 jianli-tanuki.2026-04-03.log 格式的备份文件名
    file_handler.suffix = "%Y-%m-%d"
    file_handler.namer = _log_namer
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)

    # 降低第三方库的日志级别
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    _initialized = True
    logging.getLogger(__name__).info(
        "日志系统初始化完成 | 级别=%s | 目录=%s | 保留=%d天",
        settings.LOG_LEVEL, log_dir, settings.LOG_BACKUP_COUNT,
    )


def _log_namer(default_name: str) -> str:
    """
    将默认的 jianli-tanuki.log.2026-04-03 改为 jianli-tanuki.2026-04-03.log
    """
    base, ext = os.path.splitext(default_name)
    if ext and ext.startswith(".20"):
        # default_name = "xxx/jianli-tanuki.log.2026-04-03"
        # base = "xxx/jianli-tanuki.log", ext = ".2026-04-03"
        stem, _log_ext = os.path.splitext(base)
        return f"{stem}{ext}{_log_ext}"
    return default_name
