#!/usr/bin/env python3
"""
简历解析后端服务启动脚本
"""

import uvicorn
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def main():
    """启动后端服务"""
    # 加载.env文件
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✅ 已加载环境变量文件: {env_path}")
    else:
        print(f"⚠️  未找到.env文件: {env_path}")
    
    # 检查环境变量
    api_key = os.getenv("SILICONFLOW_API_KEY")
    if not api_key or api_key == "your_siliconflow_api_key_here":
        print("警告: 未设置有效的SILICONFLOW_API_KEY环境变量")
        print("请在.env文件中设置真实的API密钥")
        print("示例: SILICONFLOW_API_KEY=your_actual_api_key")
    else:
        print("✅ API密钥已配置")
    
    # 启动服务
    print("启动简历解析后端服务...")
    print("服务地址: http://localhost:8001")
    print("API文档: http://localhost:8001/docs")
    print("按 Ctrl+C 停止服务")
    
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8001,
        reload=True,  # 开发模式，代码变更时自动重启
        log_level="info"
    )

if __name__ == "__main__":
    main()
